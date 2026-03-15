/**
 * Story 3.4: Testes GET /api/tarefas/[tarefaId]/documentos
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

const TAREFA_ROW = { id: "tarefa-1", bpo_id: "bpo-1", cliente_id: "c1" };
const DOC_ROWS = [
  {
    id: "doc-1",
    nome_arquivo: "anexo.pdf",
    tipo_mime: "application/pdf",
    tamanho: 2048,
    created_at: "2026-03-14T14:00:00Z",
    criado_por_id: "user-1",
  },
];

describe("GET /api/tarefas/[tarefaId]/documentos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/doc"), {
      params: Promise.resolve({ tarefaId: "tarefa-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 404 quando tarefa não existe ou outro BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqBpo = vi.fn().mockReturnValue({ maybeSingle });
    const eqId = vi.fn().mockReturnValue({ eq: eqBpo });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqId }),
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(new NextRequest("http://localhost/doc"), {
      params: Promise.resolve({ tarefaId: "tarefa-inexistente" }),
    });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna 200 e lista de documentos em camelCase", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: TAREFA_ROW, error: null });
    const order = vi.fn().mockResolvedValue({ data: DOC_ROWS, error: null });
    const eqOrder = vi.fn().mockReturnValue({ order });
    const selectDoc = vi.fn().mockReturnValue({ eq: eqOrder });
    const inUsuarios = vi.fn().mockResolvedValue({ data: [{ id: "user-1", nome: "Operador" }] });
    const selectUsuarios = vi.fn().mockReturnValue({ in: inUsuarios });
    const fromMock = vi.fn((table: string) => {
      if (table === "tarefas") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) }) };
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
      params: Promise.resolve({ tarefaId: "tarefa-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0]).toMatchObject({
      id: "doc-1",
      nomeArquivo: "anexo.pdf",
      tipoMime: "application/pdf",
      tamanho: 2048,
      createdAt: "2026-03-14T14:00:00Z",
      autor: "Operador",
    });
    expect(json.data[0]).not.toHaveProperty("storageKey");
  });
});

describe("POST /api/tarefas/[tarefaId]/documentos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(
      new NextRequest("http://localhost/doc", { method: "POST" }),
      { params: Promise.resolve({ tarefaId: "tarefa-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 400 quando não multipart", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: TAREFA_ROW, error: null });
    const eqBpo = vi.fn().mockReturnValue({ maybeSingle });
    const eqId = vi.fn().mockReturnValue({ eq: eqBpo });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqId }),
    });
    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
      storage: { from: vi.fn() },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(
      new NextRequest("http://localhost/doc", {
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("retorna 404 quando tarefa não existe", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqBpo = vi.fn().mockReturnValue({ maybeSingle });
    const eqId = vi.fn().mockReturnValue({ eq: eqBpo });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqId }),
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(
      new NextRequest("http://localhost/doc", {
        method: "POST",
        headers: { "content-type": "multipart/form-data; boundary=x" },
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-inexistente" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });
});
