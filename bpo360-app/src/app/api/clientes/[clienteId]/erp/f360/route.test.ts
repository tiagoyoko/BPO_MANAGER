import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/security/crypto", () => ({
  encrypt: vi.fn((plain: string) => `enc:${plain}`),
  decrypt: vi.fn((cipher: string) => (cipher.startsWith("enc:") ? cipher.slice(4) : "abcd")),
}));

const { getCurrentUser } = (await import("@/lib/auth/get-current-user")) as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = (await import("@/lib/supabase/server")) as {
  createClient: ReturnType<typeof vi.fn>;
};

const { GET, PUT } = await import("./route");

const GESTOR = {
  id: "u1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "g@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const OPERADOR = {
  id: "u2",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Operador",
};

const CLIENTE_FINAL = {
  id: "u3",
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

const F360_ROW = {
  id: "int-f360",
  bpo_id: "bpo-1",
  cliente_id: "cliente-1",
  tipo_erp: "F360",
  e_principal: true,
  ativo: true,
  created_at: "2026-03-14T00:00:00Z",
  updated_at: "2026-03-14T00:00:00Z",
  token_f360_encrypted: "enc:secret1234",
  observacoes: "Obs",
  token_configurado_em: "2026-03-14T12:00:00Z",
};

function makeSupabaseGetF360(row: typeof F360_ROW | null) {
  const maybeSingleCliente = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
  const maybeSingleErp = vi.fn().mockResolvedValue({ data: row, error: null });
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
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleErp }),
          }),
        }),
      }),
    });
  return { from };
}

describe("GET /api/clientes/[clienteId]/erp/f360", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockResolvedValue(undefined as never);
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360") as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    const res = await GET(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360") as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 404 quando integração F360 não configurada", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const { from } = makeSupabaseGetF360(null);
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await GET(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360") as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toContain("F360");
  });

  it("retorna 200 com configuração mascarada e nunca expõe token_f360_encrypted", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const { from } = makeSupabaseGetF360(F360_ROW);
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await GET(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360") as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.tokenConfigurado).toBe(true);
    expect(json.data.tokenMascarado).toBe("••••••••1234");
    expect(json.data.observacoes).toBe("Obs");
    expect(json.data.tokenConfiguradoEm).toBe("2026-03-14T12:00:00Z");
    expect(json.data).not.toHaveProperty("token_f360_encrypted");
  });
});

describe("PUT /api/clientes/[clienteId]/erp/f360", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockResolvedValue(undefined as never);
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await PUT(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "new-token", observacoes: null }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é operador_bpo", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(OPERADOR);
    const res = await PUT(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "t" }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 400 quando token vazio", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingleCliente = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const f360Row = { ...F360_ROW, token_f360_encrypted: null, observacoes: null, token_configurado_em: null };
    const maybeSingleF360 = vi.fn().mockResolvedValue({ data: f360Row, error: null });
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
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleF360 }),
            }),
          }),
        }),
      });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await PUT(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "   " }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("TOKEN_REQUIRED");
  });

  it("retorna 404 quando ERP F360 não configurado (story 1.5)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingleCliente = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const maybeSingleF360Null = vi.fn().mockResolvedValue({ data: null, error: null });
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
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleF360Null }),
            }),
          }),
        }),
      });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await PUT(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "valid-token" }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.message).toMatch(/F360|primeiro/i);
  });

  it("retorna 200 ao salvar token com sucesso e resposta com token mascarado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const maybeSingleCliente = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
    const f360Existente = {
      ...F360_ROW,
      token_f360_encrypted: null,
      observacoes: null,
      token_configurado_em: null,
    };
    const maybeSingleF360 = vi.fn().mockResolvedValue({ data: f360Existente, error: null });
    const updatedRow = {
      ...F360_ROW,
      token_f360_encrypted: "enc:newtoken",
      observacoes: "Obs",
      token_configurado_em: "2026-03-14T14:00:00Z",
      updated_at: "2026-03-14T14:00:00Z",
    };
    const singleUpdated = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
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
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleF360 }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ single: singleUpdated }),
            }),
          }),
        }),
      });
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const res = await PUT(
      new Request("http://localhost/api/clientes/cliente-1/erp/f360", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "new-token", observacoes: "Obs" }),
      }) as never,
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.integracao).toBeDefined();
    expect(json.data.integracao.tokenConfigurado).toBe(true);
    expect(json.data.integracao.tokenMascarado).toBe("••••••••");
    expect(json.data.integracao).not.toHaveProperty("token_f360_encrypted");
  });
});
