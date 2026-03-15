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

const { GET } = await import("./route");

const USUARIO_MOCK = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Operador",
};

const CLIENTE_FINAL_MOCK = { ...USUARIO_MOCK, role: "cliente_final" as const };

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
  clientes: { nome_fantasia: "Cliente A" },
};

describe("GET /api/solicitacoes/[solicitacaoId]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-1"),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL_MOCK);
    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-1"),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("retorna 404 quando solicitação não existe ou é de outro BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqBpo = vi.fn().mockReturnValue({ maybeSingle });
    const eqId = vi.fn().mockReturnValue({ eq: eqBpo });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqId }),
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-inexistente"),
      { params: Promise.resolve({ solicitacaoId: "sol-inexistente" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna 200 e detalhe em camelCase", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: SOLICITACAO_ROW, error: null });
    const eqBpo = vi.fn().mockReturnValue({ maybeSingle });
    const eqId = vi.fn().mockReturnValue({ eq: eqBpo });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqId }),
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-1"),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toMatchObject({
      id: "sol-1",
      clienteId: "cliente-1",
      clienteNome: "Cliente A",
      titulo: "Doc faltando",
      tipo: "documento_faltando",
      prioridade: "alta",
      status: "aberta",
      createdAt: "2026-03-14T10:00:00Z",
      criadoPorId: "user-1",
    });
  });
});
