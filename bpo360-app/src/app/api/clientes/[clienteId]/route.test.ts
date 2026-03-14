import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { getCurrentUser } = (await import("@/lib/auth/get-current-user")) as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = (await import("@/lib/supabase/server")) as {
  createClient: ReturnType<typeof vi.fn>;
};

const { PATCH } = await import("./route");

const GESTOR = {
  id: "uid-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "gestor@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const OPERADOR = {
  id: "uid-2",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Operador",
};

const CLIENTE_FINAL = {
  id: "uid-3",
  bpoId: "bpo-1",
  role: "cliente_final" as const,
  email: "cliente@empresa.com",
  clienteId: "cliente-1",
  nome: "Cliente Final",
};

const CLIENTE_ROW = {
  id: "cliente-1",
  bpo_id: "bpo-1",
  cnpj: "11222333000181",
  razao_social: "Empresa Teste Ltda",
  nome_fantasia: "Empresa Teste",
  email: "contato@empresa.com",
  telefone: null,
  responsavel_interno_id: null,
  receita_estimada: null,
  status: "Ativo",
  tags: [],
  created_at: "2026-03-13T00:00:00Z",
  updated_at: "2026-03-13T00:00:00Z",
};

function makeSupabaseMock(updatedRow: Record<string, unknown>) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
  const single = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
  const eqBpoUpdate = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
  const eqIdUpdate = vi.fn().mockReturnValue({ eq: eqBpoUpdate });
  const update = vi.fn().mockReturnValue({ eq: eqIdUpdate });
  const eqBpoGet = vi.fn().mockReturnValue({ maybeSingle });
  const eqIdGet = vi.fn().mockReturnValue({ eq: eqBpoGet });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: eqIdGet }),
    update,
  });
  return { from, update };
}

describe("PATCH /api/clientes/[clienteId]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockResolvedValue(undefined as never);
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razaoSocial: "X" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é operador_bpo", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(OPERADOR);
    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razaoSocial: "X" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("Acesso negado");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razaoSocial: "X" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 200 e dados atualizados em sucesso", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const updated = {
      ...CLIENTE_ROW,
      razao_social: "Nova Razão",
      updated_at: "2026-03-13T12:00:00Z",
    };
    const { from } = makeSupabaseMock(updated);
    vi.mocked(createClient).mockResolvedValue({
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razaoSocial: "Nova Razão" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.razaoSocial).toBe("Nova Razão");
  });

  it("retorna 404 quando clienteId não pertence ao bpo_id do usuário", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqIdGet = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqIdGet }),
    });
    vi.mocked(createClient).mockResolvedValue({
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new Request("http://localhost/api/clientes/outro-cliente", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razaoSocial: "X" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "outro-cliente" }),
    });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna 500 quando ocorre erro ao buscar o cliente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "db offline" } });
    const eqIdGet = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqIdGet }),
    });
    vi.mocked(createClient).mockResolvedValue({
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razaoSocial: "X" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.error.code).toBe("DB_ERROR");
  });

  it("retorna 400 quando status inválido enviado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const eqIdGet = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqIdGet }),
    });
    vi.mocked(createClient).mockResolvedValue({
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Invalido" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("STATUS_INVALIDO");
  });

  it("retorna 400 quando CNPJ é enviado no body (CNPJ não editável)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj: "99999999000199", razaoSocial: "X" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CNPJ_NAO_EDITAVEL");
  });

  it("retorna 400 quando receitaEstimada não é um número válido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const eqIdGet = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqIdGet }),
    });
    vi.mocked(createClient).mockResolvedValue({
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receitaEstimada: "nao-e-numero" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("RECEITA_INVALIDA");
  });

  it("retorna 400 quando responsavelInternoId não pertence ao mesmo bpo_id", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingleCliente = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const maybeSingleResponsavel = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleCliente }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleResponsavel }),
          }),
        }),
      });

    vi.mocked(createClient).mockResolvedValue({
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const req = new Request("http://localhost/api/clientes/cliente-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsavelInternoId: "uid-outro-bpo" }),
    });
    const res = await PATCH(req as unknown as import("next/server").NextRequest, {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("RESPONSAVEL_INVALIDO");
  });
});
