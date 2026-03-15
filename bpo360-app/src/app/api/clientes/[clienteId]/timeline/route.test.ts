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

const CLIENTE_FINAL_MOCK = {
  ...USUARIO_MOCK,
  role: "cliente_final" as const,
  clienteId: "cliente-1",
};

function reqGet(clienteId = "cliente-1", params = ""): NextRequest {
  return new NextRequest(
    `http://localhost/api/clientes/${clienteId}/timeline${params ? `?${params}` : ""}`
  );
}

describe("GET /api/clientes/[clienteId]/timeline", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(reqGet(), { params: Promise.resolve({ clienteId: "cliente-1" }) });
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.data).toBeNull();
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL_MOCK);
    const res = await GET(reqGet(), { params: Promise.resolve({ clienteId: "cliente-1" }) });
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 404 quando cliente não pertence ao BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const supabaseMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );
    const res = await GET(reqGet("cliente-outro"), {
      params: Promise.resolve({ clienteId: "cliente-outro" }),
    });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna lista vazia quando não há eventos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    // Supabase mock complexo para suportar múltiplas chamadas
    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === "clientes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
                }),
              }),
            }),
          };
        }
        // solicitacoes: primeira chamada retorna lista para timeline, segunda para sub-query ids
        if (table === "solicitacoes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "comentarios") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet(), { params: Promise.resolve({ clienteId: "cliente-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.eventos).toHaveLength(0);
    expect(json.data.total).toBe(0);
    expect(json.data.page).toBe(1);
    expect(json.data.limit).toBe(20);
  });

  it("retorna evento solicitacao_criada com autorTipo interno", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const solRow = {
      id: "sol-1",
      titulo: "Nota fiscal faltando",
      created_at: "2026-03-14T10:00:00Z",
      criado_por_id: "user-1",
      origem: "interno",
      usuarios: { nome: "Operador" },
    };

    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === "clientes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "solicitacoes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [solRow], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "comentarios") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet(), { params: Promise.resolve({ clienteId: "cliente-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.eventos).toHaveLength(1);
    const evento = json.data.eventos[0];
    expect(evento.tipo).toBe("solicitacao_criada");
    expect(evento.tituloOuResumo).toBe("Nota fiscal faltando");
    expect(evento.autorTipo).toBe("interno");
    expect(evento.autorNome).toBe("Operador");
    expect(evento.dataHora).toBe("2026-03-14T10:00:00Z");
    expect(evento.entidadeId).toBe("sol-1");
    expect(evento.entidadeTipo).toBe("solicitacao");
  });

  it("retorna evento solicitacao_criada com autorTipo cliente quando origem=cliente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const solRow = {
      id: "sol-2",
      titulo: "Dúvida do cliente",
      created_at: "2026-03-14T09:00:00Z",
      criado_por_id: null,
      origem: "cliente",
      usuarios: null,
    };

    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === "clientes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "solicitacoes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [solRow], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "comentarios") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet(), { params: Promise.resolve({ clienteId: "cliente-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    const evento = json.data.eventos[0];
    expect(evento.autorTipo).toBe("cliente");
    expect(evento.autorNome).toBe("Cliente");
  });

  it("retorna evento comentario com texto resumido se longo", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const textoLongo = "a".repeat(200);
    const comRow = {
      id: "com-1",
      texto: textoLongo,
      created_at: "2026-03-14T11:00:00Z",
      solicitacao_id: "sol-1",
      autor_id: "user-1",
      usuarios: { nome: "Operador" },
    };

    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === "clientes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "solicitacoes") {
          // Comentários pertencem a solicitações; mock retorna a solicitação pai para fornecer os IDs.
          const solPai = {
            id: "sol-1",
            titulo: "Solicitação pai",
            created_at: "2026-03-14T10:00:00Z",
            criado_por_id: "user-1",
            origem: "interno",
            usuarios: { nome: "Operador" },
          };
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [solPai], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "comentarios") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [comRow], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet(), { params: Promise.resolve({ clienteId: "cliente-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    // O comentário mais recente (11:00) vem antes da solicitação pai (10:00)
    const evento = json.data.eventos[0];
    expect(evento.tipo).toBe("comentario");
    expect(evento.tituloOuResumo.length).toBeLessThanOrEqual(121); // 120 chars + "…"
    expect(evento.tituloOuResumo.endsWith("…")).toBe(true);
    expect(evento.autorTipo).toBe("interno");
    expect(evento.entidadeTipo).toBe("comentario");
  });

  it("filtra por tipoEvento=solicitacao_criada (não busca comentários)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const fromFn = vi.fn((table: string) => {
      if (table === "clientes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "solicitacoes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    vi.mocked(createClient).mockResolvedValue(
      { from: fromFn } as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await GET(reqGet("cliente-1", "tipoEvento=solicitacao_criada"), {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });

    // comentarios não devem ser chamados
    const calledTables = fromFn.mock.calls.map((c) => c[0]);
    expect(calledTables).not.toContain("comentarios");
  });

  it("filtra por tipoEvento=comentario (não busca solicitacoes para timeline)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const fromFn = vi.fn((table: string) => {
      if (table === "clientes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
              }),
            }),
          }),
        };
      }
      // solicitacoes ainda é chamado para sub-query de ids
      if (table === "solicitacoes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "comentarios") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    vi.mocked(createClient).mockResolvedValue(
      { from: fromFn } as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet("cliente-1", "tipoEvento=comentario"), {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.eventos).toHaveLength(0);
  });

  it("eventos são ordenados por dataHora decrescente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const solRow = {
      id: "sol-1",
      titulo: "Sol antiga",
      created_at: "2026-03-14T08:00:00Z",
      criado_por_id: "user-1",
      origem: "interno",
      usuarios: { nome: "Op" },
    };
    const comRow = {
      id: "com-1",
      texto: "Comentário mais recente",
      created_at: "2026-03-14T12:00:00Z",
      solicitacao_id: "sol-1",
      autor_id: "user-1",
      usuarios: { nome: "Op" },
    };

    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === "clientes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "solicitacoes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [solRow], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "comentarios") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [comRow], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet(), { params: Promise.resolve({ clienteId: "cliente-1" }) });
    const json = await res.json();

    expect(json.data.eventos).toHaveLength(2);
    // comentário mais recente (12:00) deve vir primeiro
    expect(json.data.eventos[0].tipo).toBe("comentario");
    expect(json.data.eventos[1].tipo).toBe("solicitacao_criada");
  });

  it("paginação: page=2 com limit=1 retorna segundo evento", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);

    const solRows = [
      {
        id: "sol-1",
        titulo: "Sol 1",
        created_at: "2026-03-14T10:00:00Z",
        criado_por_id: "user-1",
        origem: "interno",
        usuarios: { nome: "Op" },
      },
      {
        id: "sol-2",
        titulo: "Sol 2",
        created_at: "2026-03-14T09:00:00Z",
        criado_por_id: "user-1",
        origem: "interno",
        usuarios: { nome: "Op" },
      },
    ];

    const supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === "clientes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cliente-1" }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "solicitacoes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: solRows, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "comentarios") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(
      supabaseMock as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(reqGet("cliente-1", "page=2&limit=1"), {
      params: Promise.resolve({ clienteId: "cliente-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.total).toBe(2);
    expect(json.data.eventos).toHaveLength(1);
    expect(json.data.eventos[0].entidadeId).toBe("sol-2");
  });
});
