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

const { GET, POST } = await import("./route");

const GESTOR = {
  id: "uid-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "g@bpo.com",
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
  email: "c@empresa.com",
  clienteId: "cliente-1",
  nome: "Cliente",
};

const CLIENTE_ROW = {
  id: "cliente-1",
  bpo_id: "bpo-1",
  cnpj: "11222333000181",
  razao_social: "Empresa Ltda",
  nome_fantasia: "Empresa",
  email: "contato@empresa.com",
  telefone: null,
  responsavel_interno_id: null,
  receita_estimada: null,
  status: "Ativo",
  tags: [],
  created_at: "2026-03-13T00:00:00Z",
  updated_at: "2026-03-13T00:00:00Z",
};

const INTEGRACAO_ROW = {
  id: "int-1",
  bpo_id: "bpo-1",
  cliente_id: "cliente-1",
  tipo_erp: "F360",
  e_principal: true,
  ativo: true,
  created_at: "2026-03-14T00:00:00Z",
  updated_at: "2026-03-14T00:00:00Z",
  token_f360_encrypted: null as string | null,
  observacoes: null as string | null,
  token_configurado_em: null as string | null,
};

function makeSupabaseForGet(integracoes: unknown[] = []) {
  const maybeSingleCliente = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
  const order = vi.fn().mockResolvedValue({ data: integracoes, error: null });
  const eqBpo = vi.fn().mockReturnValue({ order });
  const eqCliente = vi.fn().mockReturnValue({ eq: eqBpo });
  const selectErp = vi.fn().mockReturnValue({ eq: eqCliente });
  const from = vi.fn()
    .mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleCliente }) }),
      }),
    })
    .mockReturnValueOnce({
      select: selectErp,
    });
  return { from };
}

describe("GET /api/clientes/[clienteId]/erp", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockResolvedValue(undefined as never);
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/clientes/cliente-1/erp") as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    const res = await GET(
      new Request("http://localhost/api/clientes/cliente-1/erp") as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 404 quando cliente de outro BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      }),
    });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await GET(
      new Request("http://localhost/api/clientes/outro/erp") as never,
      { params: Promise.resolve({ clienteId: "outro" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna integracoes vazias quando cliente sem ERPs", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const { from } = makeSupabaseForGet([]);
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await GET(
      new Request("http://localhost/api/clientes/cliente-1/erp") as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.integracoes).toEqual([]);
    expect(json.error).toBeNull();
  });
});

describe("POST /api/clientes/[clienteId]/erp", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockResolvedValue(undefined as never);
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/clientes/cliente-1/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoErp: "F360", ePrincipal: true }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é operador_bpo", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(OPERADOR);
    const res = await POST(
      new Request("http://localhost/api/clientes/cliente-1/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoErp: "F360", ePrincipal: true }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 400 quando body inválido (sem tipoErp)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const maybeSingleErp = vi.fn().mockResolvedValue({ data: null, error: null });
    const single = vi.fn().mockResolvedValue({ data: INTEGRACAO_ROW, error: null });
    const from = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleErp }),
          }),
        }),
      })
      .mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }),
      });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await POST(
      new Request("http://localhost/api/clientes/cliente-1/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("INVALID_ERP_TIPO");
  });

  it("retorna 201 ao criar nova integração", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const maybeSingleErp = vi.fn().mockResolvedValue({ data: null, error: null });
    const single = vi.fn().mockResolvedValue({ data: INTEGRACAO_ROW, error: null });
    const from = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleErp }),
          }),
        }),
      })
      .mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }),
      });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await POST(
      new Request("http://localhost/api/clientes/cliente-1/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoErp: "F360", ePrincipal: true }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.integracao.tipoErp).toBe("F360");
    expect(json.data.integracao.ePrincipal).toBe(true);
  });

  it("retorna 200 ao fazer upsert (já existia)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingle = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const maybeSingleErp = vi.fn().mockResolvedValue({ data: INTEGRACAO_ROW, error: null });
    const single = vi.fn().mockResolvedValue({
      data: { ...INTEGRACAO_ROW, e_principal: false, updated_at: "2026-03-14T12:00:00Z" },
      error: null,
    });
    const from = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleErp }),
          }),
        }),
      })
      .mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }),
      });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await POST(
      new Request("http://localhost/api/clientes/cliente-1/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoErp: "F360", ePrincipal: false }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.integracao.ePrincipal).toBe(false);
  });
});
