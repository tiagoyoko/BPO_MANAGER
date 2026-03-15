import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/domain/notificacoes/notificar-cliente-solicitacao", () => ({
  notificarClienteSolicitacaoAtualizada: vi.fn().mockResolvedValue(undefined),
}));

const { getCurrentUser } = await import("@/lib/auth/get-current-user") as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = await import("@/lib/supabase/server") as {
  createClient: ReturnType<typeof vi.fn>;
};

const { POST } = await import("./route");

const USUARIO_MOCK = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Op",
};

describe("POST /api/solicitacoes/[solicitacaoId]/comentarios", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes/sol-1/comentarios", {
        method: "POST",
        body: JSON.stringify({ texto: "Comentário" }),
      }),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 400 quando texto vazio", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes/sol-1/comentarios", {
        method: "POST",
        body: JSON.stringify({ texto: "   " }),
      }),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION");
  });

  it("retorna 201 e comentário quando solicitação existe", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const solRow = { id: "sol-1", cliente_id: "cliente-1", origem: "interno" };
    const comentarioRow = {
      id: "com-1",
      solicitacao_id: "sol-1",
      texto: "Resposta",
      autor_id: "user-1",
      created_at: "2026-03-14T12:00:00Z",
    };
    let fromCall = 0;
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "solicitacoes") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: solRow, error: null }),
        };
      }
      if (table === "comentarios") {
        fromCall++;
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: comentarioRow, error: null }),
        };
      }
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/solicitacoes/sol-1/comentarios", {
        method: "POST",
        body: JSON.stringify({ texto: "Resposta" }),
      }),
      { params: Promise.resolve({ solicitacaoId: "sol-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.id).toBe("com-1");
    expect(json.data.texto).toBe("Resposta");
    expect(json.data.solicitacaoId).toBe("sol-1");
  });
});
