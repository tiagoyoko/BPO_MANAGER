/**
 * Story 2.2: Testes GET/POST /api/clientes/[clienteId]/rotinas
 * Evidências: POST aplica modelo e retorna rotinaCliente + tarefasGeradas; GET lista rotinas do cliente;
 * cliente/modelo de outro BPO rejeitado (404).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/domain/clientes/repository", () => ({
  buscarClientePorIdEBpo: vi.fn(),
  buscarUsuarioPorIdEBpo: vi.fn(),
}));
vi.mock("@/lib/domain/rotinas/gerar-tarefas-recorrentes", () => ({
  gerarTarefasRecorrentes: vi.fn(),
}));

const { getCurrentUser } = await import("@/lib/auth/get-current-user") as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = await import("@/lib/supabase/server") as {
  createClient: ReturnType<typeof vi.fn>;
};
const { buscarClientePorIdEBpo } = await import("@/lib/domain/clientes/repository") as unknown as {
  buscarClientePorIdEBpo: ReturnType<typeof vi.fn>;
};
const { buscarUsuarioPorIdEBpo } = await import("@/lib/domain/clientes/repository") as unknown as {
  buscarUsuarioPorIdEBpo: ReturnType<typeof vi.fn>;
};
const { gerarTarefasRecorrentes } = await import("@/lib/domain/rotinas/gerar-tarefas-recorrentes") as unknown as {
  gerarTarefasRecorrentes: ReturnType<typeof vi.fn>;
};

const { GET, POST } = await import("./route");

const GESTOR = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "g@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const CLIENTE_FINAL = { ...GESTOR, role: "cliente_final" as const };

const CLIENTE_ROW = {
  id: "cliente-1",
  bpo_id: "bpo-1",
  razao_social: "Empresa Ltda",
  nome_fantasia: "Empresa",
};

const MODELO_ROW = { id: "modelo-1", nome: "Conciliação diária", bpo_id: "bpo-1" };

const ROTINA_CLIENTE_ROW = {
  id: "rc-1",
  cliente_id: "cliente-1",
  rotina_modelo_id: "modelo-1",
  data_inicio: "2026-03-14",
  frequencia: "mensal",
  responsavel_padrao_id: null,
  prioridade: "media",
  created_at: "2026-03-14T10:00:00Z",
  updated_at: "2026-03-14T10:00:00Z",
};

function createSupabaseForGet(rotinas: unknown[] = []) {
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: rotinas, error: null }),
        }),
      }),
    }),
  });
  return { from };
}

describe("GET /api/clientes/[clienteId]/rotinas", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
    vi.mocked(buscarClientePorIdEBpo).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new NextRequest("http://localhost/api/clientes/c1/rotinas"),
      { params: Promise.resolve({ clienteId: "c1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error?.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    const res = await GET(
      new NextRequest("http://localhost/api/clientes/c1/rotinas"),
      { params: Promise.resolve({ clienteId: "c1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("retorna 404 quando cliente não encontrado ou outro BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    vi.mocked(buscarClientePorIdEBpo).mockResolvedValue({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue(createSupabaseForGet() as never);

    const res = await GET(
      new NextRequest("http://localhost/api/clientes/cliente-1/rotinas"),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error?.message).toContain("Cliente não encontrado");
  });

  it("retorna 200 com lista de rotinas do cliente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    vi.mocked(buscarClientePorIdEBpo).mockResolvedValue({ data: CLIENTE_ROW, error: null });
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseForGet([{ ...ROTINA_CLIENTE_ROW }]) as never
    );

    const res = await GET(
      new NextRequest("http://localhost/api/clientes/cliente-1/rotinas"),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.rotinas).toHaveLength(1);
    expect(json.data.rotinas[0].id).toBe("rc-1");
    expect(json.data.rotinas[0].dataInicio).toBe("2026-03-14");
    expect(json.data.rotinas[0].frequencia).toBe("mensal");
  });
});

describe("POST /api/clientes/[clienteId]/rotinas", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    vi.mocked(buscarClientePorIdEBpo).mockResolvedValue({ data: CLIENTE_ROW, error: null });
    vi.mocked(buscarUsuarioPorIdEBpo).mockResolvedValue({ data: null, error: null });
    vi.mocked(gerarTarefasRecorrentes).mockResolvedValue({ count: 12, error: undefined });
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(
      new NextRequest("http://localhost/api/clientes/c1/rotinas", {
        method: "POST",
        body: JSON.stringify({ rotinaModeloId: "m1", dataInicio: "2026-03-14" }),
      }),
      { params: Promise.resolve({ clienteId: "c1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    const res = await POST(
      new NextRequest("http://localhost/api/clientes/c1/rotinas", {
        method: "POST",
        body: JSON.stringify({ rotinaModeloId: "m1", dataInicio: "2026-03-14" }),
      }),
      { params: Promise.resolve({ clienteId: "c1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("retorna 400 quando rotinaModeloId ou dataInicio ausentes", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/clientes/c1/rotinas", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ clienteId: "c1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error?.message).toContain("obrigatórios");
  });

  it("retorna 404 quando modelo não encontrado ou de outro BPO", async () => {
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo")
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
        };
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/clientes/cliente-1/rotinas", {
        method: "POST",
        body: JSON.stringify({ rotinaModeloId: "modelo-outro-bpo", dataInicio: "2026-03-14" }),
      }),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error?.message).toMatch(/modelo|BPO/i);
  });

  it("retorna 400 quando responsavelPadraoId pertence a outro BPO", async () => {
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo")
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: MODELO_ROW, error: null }),
              }),
            }),
          }),
        };
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from } as never);
    vi.mocked(buscarUsuarioPorIdEBpo).mockResolvedValue({ data: null, error: null });

    const res = await POST(
      new NextRequest("http://localhost/api/clientes/cliente-1/rotinas", {
        method: "POST",
        body: JSON.stringify({
          rotinaModeloId: "modelo-1",
          dataInicio: "2026-03-14",
          responsavelPadraoId: "user-outro-bpo",
        }),
      }),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("RESPONSAVEL_INVALIDO");
  });

  it("remove rotina e tarefas parciais quando a geração falha", async () => {
    const deleteTarefasEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const deleteRotinaEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo")
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: MODELO_ROW, error: null }),
              }),
            }),
          }),
        };
      if (table === "rotinas_cliente")
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: ROTINA_CLIENTE_ROW, error: null }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: deleteRotinaEq,
          }),
        };
      if (table === "tarefas")
        return {
          delete: vi.fn().mockReturnValue({
            eq: deleteTarefasEq,
          }),
        };
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from } as never);
    vi.mocked(gerarTarefasRecorrentes).mockResolvedValue({ count: 4, error: "Falha parcial" });

    const res = await POST(
      new NextRequest("http://localhost/api/clientes/cliente-1/rotinas", {
        method: "POST",
        body: JSON.stringify({ rotinaModeloId: "modelo-1", dataInicio: "2026-03-14" }),
      }),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error?.message).toBe("Falha parcial");
    expect(deleteTarefasEq).toHaveBeenCalledWith("rotina_cliente_id", "rc-1");
    expect(deleteRotinaEq).toHaveBeenCalledWith("id", "rc-1");
  });

  it("retorna 201 com rotinaCliente e tarefasGeradas ao aplicar modelo do mesmo BPO", async () => {
    const rotinaInserida = { ...ROTINA_CLIENTE_ROW, prioridade: "alta" };
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo")
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: MODELO_ROW, error: null }),
              }),
            }),
          }),
        };
      if (table === "rotinas_cliente")
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: rotinaInserida, error: null }),
            }),
          }),
        };
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from } as never);
    vi.mocked(buscarUsuarioPorIdEBpo).mockResolvedValue({ data: { id: "user-1" }, error: null });

    const res = await POST(
      new NextRequest("http://localhost/api/clientes/cliente-1/rotinas", {
        method: "POST",
        body: JSON.stringify({
          rotinaModeloId: "modelo-1",
          dataInicio: "2026-03-14",
          frequencia: "mensal",
          prioridade: "alta",
        }),
      }),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.rotinaCliente).toBeDefined();
    expect(json.data.rotinaCliente.id).toBe("rc-1");
    expect(json.data.rotinaCliente.dataInicio).toBe("2026-03-14");
    expect(json.data.rotinaCliente.prioridade).toBe("alta");
    expect(json.data.tarefasGeradas).toBe(12);
    expect(gerarTarefasRecorrentes).toHaveBeenCalledWith(
      expect.objectContaining({
        rotinaClienteId: "rc-1",
        clienteId: "cliente-1",
        rotinaModeloId: "modelo-1",
        dataInicio: "2026-03-14",
        frequencia: "mensal",
        prioridade: "alta",
        tituloModelo: "Conciliação diária",
      })
    );
  });
});
