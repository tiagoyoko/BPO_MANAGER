import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Importações após mock
const { getCurrentUser } = await import("@/lib/auth/get-current-user") as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = await import("@/lib/supabase/server") as {
  createClient: ReturnType<typeof vi.fn>;
};

// Importar após mocks estarem prontos
const { GET, POST } = await import("./route");

function reqGet(url = "http://localhost/api/clientes"): NextRequest {
  return new NextRequest(url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USUARIO_MOCK = {
  id: "uid-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "gestor@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const CLIENTE_FINAL_MOCK = {
  ...USUARIO_MOCK,
  role: "cliente_final" as const,
  clienteId: "cliente-1",
};

/** CNPJ válido com dígitos verificadores corretos: 11.222.333/0001-81 */
const CNPJ_VALIDO = "11222333000181";

const CLIENTE_ROW = {
  id: "cliente-1",
  bpo_id: "bpo-1",
  cnpj: CNPJ_VALIDO,
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

/**
 * Mock do Supabase para o caso de sucesso no POST.
 * from("clientes").select("id").eq("bpo_id").eq("cnpj").maybeSingle() → sem duplicata
 * from("clientes").insert({}).select().single() → retorna o cliente inserido
 */
function makeSupabaseMock() {
  // Cadeia de duplicidade: .select("id").eq(bpo_id).eq(cnpj).maybeSingle()
  const maybeSingleFn = vi.fn().mockResolvedValue({ data: null, error: null });
  const innerEqFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
  const outerEqFn = vi.fn().mockReturnValue({ eq: innerEqFn });
  const selectDupFn = vi.fn().mockReturnValue({ eq: outerEqFn });

  // Cadeia de inserção: .insert({}).select().single()
  const singleFn = vi.fn().mockResolvedValue({ data: CLIENTE_ROW, error: null });
  const selectInsertFn = vi.fn().mockReturnValue({ single: singleFn });
  const insertFn = vi.fn().mockReturnValue({ select: selectInsertFn });

  return {
    from: vi.fn().mockReturnValue({
      select: selectDupFn,
      insert: insertFn,
    }),
  };
}

// ─── GET /api/clientes ────────────────────────────────────────────────────────

describe("GET /api/clientes", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const res = await GET(reqGet());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.data).toBeNull();
  });

  it("retorna lista de clientes do bpo_id do usuário (200)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const eqFn = vi.fn().mockReturnValue({ order: orderFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqFn,
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toEqual({ clientes: [], total: 0, page: 1, limit: 20 });
    expect(eqFn).toHaveBeenCalledWith("bpo_id", USUARIO_MOCK.bpoId);
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL_MOCK);

    const res = await GET(reqGet());
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("GET com search retorna somente clientes com nome/CNPJ correspondente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const orFn = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: [CLIENTE_ROW],
          error: null,
          count: 1,
        }),
      }),
    });
    const eqFn = vi.fn().mockReturnValue({ or: orFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqFn }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet("http://localhost/api/clientes?search=Empresa"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.clientes).toHaveLength(1);
    expect(json.data.clientes[0].nomeFantasia).toBe("Empresa Teste");
    expect(orFn).toHaveBeenCalled();
  });

  it("GET com status=Pausado aplica filtro de status", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const eqStatusFn = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }),
    });
    const eqBpoFn = vi.fn().mockReturnValue({ eq: eqStatusFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqBpoFn }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet("http://localhost/api/clientes?status=Pausado"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.clientes).toEqual([]);
    expect(eqStatusFn).toHaveBeenCalledWith("status", "Pausado");
  });

  it("GET com page=2 e limit=5 retorna segunda página", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 10 });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const eqFn = vi.fn().mockReturnValue({ order: orderFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqFn }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet("http://localhost/api/clientes?page=2&limit=5"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.page).toBe(2);
    expect(json.data.limit).toBe(5);
    expect(json.data.total).toBe(10);
    expect(rangeFn).toHaveBeenCalledWith(5, 9);
  });
});

// ─── POST /api/clientes ───────────────────────────────────────────────────────

describe("POST /api/clientes", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj: CNPJ_VALIDO, razaoSocial: "X", nomeFantasia: "X", email: "x@x.com" }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL_MOCK);

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj: CNPJ_VALIDO, razaoSocial: "X", nomeFantasia: "X", email: "x@x.com" }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 400 quando e-mail é inválido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj: CNPJ_VALIDO, razaoSocial: "X", nomeFantasia: "X", email: "nao-e-email" }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("EMAIL_INVALIDO");
  });

  it("retorna 400 quando CNPJ é inválido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj: "12345678901234", razaoSocial: "X", nomeFantasia: "X", email: "x@x.com" }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CNPJ_INVALIDO");
  });

  it("retorna 400 quando faltam campos obrigatórios", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnpj: CNPJ_VALIDO }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CAMPOS_OBRIGATORIOS");
  });

  it("retorna 409 quando CNPJ já está cadastrado no BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "cliente-existente" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cnpj: CNPJ_VALIDO,
        razaoSocial: "Empresa Teste Ltda",
        nomeFantasia: "Empresa Teste",
        email: "contato@empresa.com",
      }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.code).toBe("CNPJ_DUPLICADO");
  });

  it("retorna 400 quando responsavelInternoId não pertence ao mesmo bpo_id", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const supabaseMock = {
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cnpj: CNPJ_VALIDO,
        razaoSocial: "Empresa Teste Ltda",
        nomeFantasia: "Empresa Teste",
        email: "contato@empresa.com",
        responsavelInternoId: "uid-outro-bpo",
      }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("RESPONSAVEL_INVALIDO");
  });

  it("cria cliente com sucesso e retorna 201", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const supabaseMock = makeSupabaseMock();
    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const req = new Request("http://localhost/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cnpj: CNPJ_VALIDO,
        razaoSocial: "Empresa Teste Ltda",
        nomeFantasia: "Empresa Teste",
        email: "contato@empresa.com",
      }),
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.cnpj).toBe(CNPJ_VALIDO);
    expect(json.data.status).toBe("Ativo");
  });
});
