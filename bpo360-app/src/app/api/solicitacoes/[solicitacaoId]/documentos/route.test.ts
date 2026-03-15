/**
 * Story 3.4: Testes GET/POST /api/solicitacoes/[solicitacaoId]/documentos
 */
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

const SOL_ROW = { id: "sol-1", cliente_id: "c1", bpo_id: "bpo-1" };
const DOC_ROWS = [
  {
    id: "doc-1",
    nome_arquivo: "arquivo.pdf",
    tipo_mime: "application/pdf",
    tamanho: 1024,
    created_at: "2026-03-14T12:00:00Z",
    storage_key: "bpo-1/c1/solicitacao_sol-1/uuid_arquivo.pdf",
    criado_por_id: "user-1",
  },
];

describe("GET /api/solicitacoes/[solicitacaoId]/documentos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/doc"), {
      params: Promise.resolve({ solicitacaoId: "sol-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 404 quando solicitação não existe", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const fromMock = vi.fn()
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(new NextRequest("http://localhost/doc"), {
      params: Promise.resolve({ solicitacaoId: "sol-inexistente" }),
    });
    expect(res.status).toBe(404);
  });

  it("retorna 200 e lista de documentos em camelCase", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: SOL_ROW, error: null });
    const order = vi.fn().mockResolvedValue({ data: DOC_ROWS, error: null });
    const eqOrder = vi.fn().mockReturnValue({ order });
    const selectDoc = vi.fn().mockReturnValue({ eq: eqOrder });
    const inUsuarios = vi.fn().mockResolvedValue({ data: [{ id: "user-1", nome: "Operador" }] });
    const selectUsuarios = vi.fn().mockReturnValue({ in: inUsuarios });
    const fromMock = vi.fn((table: string) => {
      if (table === "solicitacoes") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) };
      }
      if (table === "documentos") {
        return { select: selectDoc };
      }
      if (table === "usuarios") {
        return { select: selectUsuarios };
      }
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(new NextRequest("http://localhost/doc"), {
      params: Promise.resolve({ solicitacaoId: "sol-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0]).toMatchObject({
      id: "doc-1",
      nomeArquivo: "arquivo.pdf",
      tipoMime: "application/pdf",
      tamanho: 1024,
      createdAt: "2026-03-14T12:00:00Z",
      autor: "Operador",
      storageKey: expect.any(String),
    });
  });
});

describe("POST /api/solicitacoes/[solicitacaoId]/documentos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 400 quando não multipart", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: SOL_ROW, error: null });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock, storage: { from: vi.fn() } } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(
      new NextRequest("http://localhost/doc", { headers: { "content-type": "application/json" } }),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("BAD_REQUEST");
  });
});
