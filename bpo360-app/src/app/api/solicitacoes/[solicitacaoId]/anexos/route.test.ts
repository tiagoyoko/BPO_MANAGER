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

const USUARIO_BPO = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Operador",
};

const CLIENTE_FINAL = { ...USUARIO_BPO, role: "cliente_final" as const, clienteId: "cliente-1" };

describe("GET /api/solicitacoes/[solicitacaoId]/anexos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-1/anexos"),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("retorna 404 quando solicitação não existe", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_BPO);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const fromMock = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-inexistente/anexos"),
      { params: Promise.resolve({ solicitacaoId: "sol-inexistente" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna 200 e lista de anexos em camelCase", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_BPO);
    const maybeSingleSol = vi.fn().mockResolvedValue({
      data: { id: "sol-1", cliente_id: "cliente-1", bpo_id: "bpo-1" },
      error: null,
    });
    const docList = {
      data: [
        {
          id: "doc-1",
          solicitacao_id: "sol-1",
          nome_arquivo: "doc.pdf",
          tipo_mime: "application/pdf",
          tamanho: 1024,
          created_at: "2026-03-14T12:00:00Z",
          storage_key: "bpo-1/cliente-1/sol-1/uuid_doc.pdf",
        },
      ],
      error: null,
    };
    const orderFn = vi.fn().mockResolvedValue(docList);
    const eqDocFn = vi.fn().mockReturnValue({ order: orderFn });
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "solicitacoes")
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleSol }) }) };
      if (table === "documentos")
        return { select: vi.fn().mockReturnValue({ eq: eqDocFn }) };
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-1/anexos"),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.anexos).toHaveLength(1);
    expect(json.data.anexos[0]).toMatchObject({
      id: "doc-1",
      solicitacaoId: "sol-1",
      nomeArquivo: "doc.pdf",
      tipoMime: "application/pdf",
      tamanho: 1024,
      createdAt: "2026-03-14T12:00:00Z",
      storageKey: "bpo-1/cliente-1/sol-1/uuid_doc.pdf",
    });
  });

  it("cliente_final retorna 403 para solicitação de outro cliente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "sol-2", cliente_id: "cliente-outro", bpo_id: "bpo-1" },
      error: null,
    });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await GET(
      new NextRequest("http://localhost/api/solicitacoes/sol-2/anexos"),
      { params: Promise.resolve({ solicitacaoId: "sol-2" }) }
    );
    expect(res.status).toBe(403);
  });
});

describe("POST /api/solicitacoes/[solicitacaoId]/anexos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 400 quando não é multipart", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_BPO);
    const fromMock = vi.fn().mockReturnValue({});
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes/sol-1/anexos", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("retorna 400 quando tipo MIME não permitido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_BPO);
    const maybeSingleSol = vi.fn().mockResolvedValue({
      data: { id: "sol-1", cliente_id: "cliente-1", bpo_id: "bpo-1" },
      error: null,
    });
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "solicitacoes")
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleSol }) }) };
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

    const form = new FormData();
    form.append("file", new File(["x"], "x.zip", { type: "application/zip" }));
    const req = {
      formData: () => Promise.resolve(form),
      headers: { get: (name: string) => (name === "content-type" ? "multipart/form-data; boundary=----" : null) },
    } as unknown as NextRequest;

    const res = await POST(req, { params: Promise.resolve({ solicitacaoId: "sol-1" }) });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("TIPO_NAO_PERMITIDO");
  });

  it("retorna 201 e anexo após upload (mock storage + insert)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_BPO);
    const maybeSingleSol = vi.fn().mockResolvedValue({
      data: { id: "sol-1", cliente_id: "cliente-1", bpo_id: "bpo-1" },
      error: null,
    });
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const fromStorage = vi.fn().mockReturnValue({ upload: uploadMock });
    const insertDoc = vi.fn().mockResolvedValue({
      data: {
        id: "doc-new",
        solicitacao_id: "sol-1",
        nome_arquivo: "arquivo.pdf",
        tipo_mime: "application/pdf",
        tamanho: 100,
        created_at: "2026-03-14T12:00:00Z",
        storage_key: "bpo-1/cliente-1/sol-1/uuid_arquivo.pdf",
      },
      error: null,
    });
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "solicitacoes")
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleSol }) }) };
      if (table === "documentos")
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertDoc }) }) };
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({
      from: fromMock,
      storage: { from: fromStorage },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const form = new FormData();
    form.append("file", new File(["content"], "arquivo.pdf", { type: "application/pdf" }));
    const req = {
      formData: () => Promise.resolve(form),
      headers: { get: (name: string) => (name === "content-type" ? "multipart/form-data; boundary=----" : null) },
    } as unknown as NextRequest;

    const res = await POST(req, { params: Promise.resolve({ solicitacaoId: "sol-1" }) });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data).toMatchObject({
      id: "doc-new",
      solicitacaoId: "sol-1",
      nomeArquivo: "arquivo.pdf",
      tipoMime: "application/pdf",
      tamanho: 100,
    });
    expect(uploadMock).toHaveBeenCalled();
  });
});
