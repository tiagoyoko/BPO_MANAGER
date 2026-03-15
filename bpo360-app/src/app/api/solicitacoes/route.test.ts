import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { getCurrentUser } = await import("@/lib/auth/get-current-user") as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = await import("@/lib/supabase/server") as {
  createClient: ReturnType<typeof vi.fn>;
};

const { GET, POST } = await import("./route");

const USUARIO_MOCK = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Operador",
};

const CLIENTE_FINAL_MOCK = { ...USUARIO_MOCK, role: "cliente_final" as const, clienteId: "cliente-1" };

const SOLICITACAO_ROW = {
  id: "sol-1",
  cliente_id: "cliente-1",
  titulo: "Doc faltando",
  descricao: "NF jan",
  tipo: "documento_faltando",
  prioridade: "alta",
  tarefa_id: null,
  status: "aberta",
  created_at: "2026-03-14T10:00:00Z",
  updated_at: "2026-03-14T10:00:00Z",
  criado_por_id: "user-1",
  origem: "interno",
};

function reqGet(url = "http://localhost/api/solicitacoes"): NextRequest {
  return new NextRequest(url);
}

describe("GET /api/solicitacoes", () => {
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

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL_MOCK);
    const res = await GET(reqGet());
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna lista de solicitações do BPO (200)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const eqFn = vi.fn().mockReturnValue({ order: orderFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqFn }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(reqGet());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toEqual({ solicitacoes: [], total: 0, page: 1, limit: 20 });
    expect(eqFn).toHaveBeenCalledWith("bpo_id", USUARIO_MOCK.bpoId);
  });

  it("GET com clienteId aplica filtro", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const eqClienteFn = vi.fn().mockReturnValue({ order: orderFn });
    const eqBpoFn = vi.fn().mockReturnValue({ eq: eqClienteFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqBpoFn }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>);

    await GET(reqGet("http://localhost/api/solicitacoes?clienteId=cliente-1"));
    expect(eqClienteFn).toHaveBeenCalledWith("cliente_id", "cliente-1");
  });

  it("GET com status=aberta aplica filtro", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const eqStatusFn = vi.fn().mockReturnValue({ order: orderFn });
    const eqBpoFn = vi.fn().mockReturnValue({ eq: eqStatusFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqBpoFn }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>);

    await GET(reqGet("http://localhost/api/solicitacoes?status=aberta"));
    expect(eqStatusFn).toHaveBeenCalledWith("status", "aberta");
  });

  it("GET retorna itens em camelCase com clienteNome", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const row = { ...SOLICITACAO_ROW, clientes: { nome_fantasia: "Cliente A" } };
    const rangeFn = vi.fn().mockResolvedValue({ data: [row], error: null, count: 1 });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const eqFn = vi.fn().mockReturnValue({ order: orderFn });
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqFn }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(reqGet());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.solicitacoes).toHaveLength(1);
    expect(json.data.solicitacoes[0]).toMatchObject({
      id: "sol-1",
      clienteId: "cliente-1",
      clienteNome: "Cliente A",
      titulo: "Doc faltando",
      tipo: "documento_faltando",
      prioridade: "alta",
      status: "aberta",
      createdAt: "2026-03-14T10:00:00Z",
      criadoPorId: "user-1",
      origem: "interno",
    });
  });
});

describe("POST /api/solicitacoes", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes", {
        method: "POST",
        body: JSON.stringify({
          clienteId: "cliente-1",
          titulo: "T",
          tipo: "outro",
          prioridade: "media",
        }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL_MOCK);
    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes", {
        method: "POST",
        body: JSON.stringify({
          clienteId: "cliente-1",
          titulo: "T",
          tipo: "outro",
          prioridade: "media",
        }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("retorna 400 quando faltam campos obrigatórios", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes", {
        method: "POST",
        body: JSON.stringify({ titulo: "Só título" }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CAMPOS_OBRIGATORIOS");
  });

  it("retorna 400 quando titulo contém apenas espaços", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes", {
        method: "POST",
        body: JSON.stringify({
          clienteId: "cliente-1",
          titulo: "   ",
          tipo: "outro",
          prioridade: "media",
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CAMPOS_OBRIGATORIOS");
  });

  it("retorna 400 quando tipo é inválido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingleCliente = vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null });
    const eqCliente = vi.fn().mockReturnValue({ maybeSingle: maybeSingleCliente });
    const fromMock = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqCliente }) });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes", {
        method: "POST",
        body: JSON.stringify({
          clienteId: "cliente-1",
          titulo: "T",
          tipo: "invalido",
          prioridade: "media",
        }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("TIPO_INVALIDO");
  });

  it("retorna 400 quando cliente não pertence ao BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingleCliente = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqBpoCliente = vi.fn().mockReturnValue({ maybeSingle: maybeSingleCliente });
    const eqIdCliente = vi.fn().mockReturnValue({ eq: eqBpoCliente });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqIdCliente }),
      insert: vi.fn(),
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes", {
        method: "POST",
        body: JSON.stringify({
          clienteId: "cliente-outro",
          titulo: "T",
          tipo: "outro",
          prioridade: "media",
        }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CLIENTE_INVALIDO");
  });

  it("retorna 201 e solicitação com id e status aberta", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingleCliente = vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null });
    const eqBpoCliente = vi.fn().mockReturnValue({ maybeSingle: maybeSingleCliente });
    const eqIdCliente = vi.fn().mockReturnValue({ eq: eqBpoCliente });
    const singleInsert = vi.fn().mockResolvedValue({ data: SOLICITACAO_ROW, error: null });
    const selectInsert = vi.fn().mockReturnValue({ single: singleInsert });
    const insertFn = vi.fn().mockReturnValue({ select: selectInsert });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqIdCliente }),
      insert: insertFn,
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes", {
        method: "POST",
        body: JSON.stringify({
          clienteId: "cliente-1",
          titulo: "Doc faltando",
          descricao: "NF jan",
          tipo: "documento_faltando",
          prioridade: "alta",
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data).toMatchObject({
      id: "sol-1",
      clienteId: "cliente-1",
      titulo: "Doc faltando",
      descricao: "NF jan",
      tipo: "documento_faltando",
      prioridade: "alta",
      status: "aberta",
      criadoPorId: "user-1",
      origem: "interno",
    });
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        bpo_id: "bpo-1",
        cliente_id: "cliente-1",
        titulo: "Doc faltando",
        status: "aberta",
        criado_por_id: "user-1",
        origem: "interno",
      })
    );
  });
});
