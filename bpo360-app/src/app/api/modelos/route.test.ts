/**
 * Story 2.1: Testes GET/POST /api/modelos
 * Evidências: POST com itens de checklist persiste modelo e itens com ordem; GET retorna apenas modelos do bpo_id do usuário.
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
  role: "gestor_bpo" as const,
  email: "gestor@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const CLIENTE_FINAL_MOCK = { ...USUARIO_MOCK, role: "cliente_final" as const };

describe("GET /api/modelos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.data).toBeNull();
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL_MOCK);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("GET retorna apenas modelos do bpo_id do usuário (200)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const orderFn = vi.fn().mockResolvedValue({
      data: [
        {
          id: "modelo-1",
          nome: "Conciliação diária",
          descricao: "Rotina de conciliação",
          periodicidade: "diaria",
          tipo_servico: "conciliacao",
          created_at: "2026-03-14T10:00:00Z",
        },
      ],
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    const fromRotinas = { select: selectFn };
    const fromItens = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [{ rotina_modelo_id: "modelo-1" }, { rotina_modelo_id: "modelo-1" }],
          error: null,
        }),
      }),
    };
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo") return fromRotinas;
      if (table === "rotina_modelo_checklist_itens") return fromItens;
      return {};
    });
    vi.mocked(createClient).mockResolvedValue(
      { from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.modelos).toHaveLength(1);
    expect(json.data.modelos[0].id).toBe("modelo-1");
    expect(json.data.modelos[0].nome).toBe("Conciliação diária");
    expect(json.data.modelos[0].qtdItensChecklist).toBe(2);
    expect(eqFn).toHaveBeenCalledWith("bpo_id", USUARIO_MOCK.bpoId);
  });
});

describe("POST /api/modelos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(
      new NextRequest("http://localhost/api/modelos", {
        method: "POST",
        body: JSON.stringify({
          nome: "Teste",
          periodicidade: "semanal",
          itensChecklist: [{ titulo: "Item 1", obrigatorio: true }],
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
      new NextRequest("http://localhost/api/modelos", {
        method: "POST",
        body: JSON.stringify({ nome: "Teste", periodicidade: "mensal", itensChecklist: [] }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 400 quando nome vazio", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const res = await POST(
      new NextRequest("http://localhost/api/modelos", {
        method: "POST",
        body: JSON.stringify({ nome: "", periodicidade: "diaria", itensChecklist: [] }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CAMPOS_OBRIGATORIOS");
  });

  it("retorna 400 quando periodicidade inválida", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const res = await POST(
      new NextRequest("http://localhost/api/modelos", {
        method: "POST",
        body: JSON.stringify({
          nome: "Rotina",
          periodicidade: "anual",
          itensChecklist: [],
        }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("PERIODICIDADE_INVALIDA");
  });

  it("POST com itens de checklist persiste modelo e itens com ordem correta (201)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const modeloRow = {
      id: "modelo-new",
      bpo_id: USUARIO_MOCK.bpoId,
      nome: "Fechamento mensal",
      descricao: "Checklist fechamento",
      periodicidade: "mensal",
      tipo_servico: "fechamento",
      created_at: "2026-03-14T12:00:00Z",
      updated_at: "2026-03-14T12:00:00Z",
      criado_por_id: USUARIO_MOCK.id,
    };
    const itensRows = [
      { id: "i1", titulo: "Conferir saldos", descricao: null, obrigatorio: true, ordem: 0 },
      { id: "i2", titulo: "Gerar relatório", descricao: "PDF", obrigatorio: false, ordem: 1 },
    ];
    let insertModeloCalled = false;
    let insertItensPayload: unknown[] = [];
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo") {
        return {
          insert: vi.fn().mockImplementation(() => {
            insertModeloCalled = true;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: modeloRow, error: null }),
              }),
            };
          }),
        };
      }
      if (table === "rotina_modelo_checklist_itens") {
        return {
          insert: vi.fn().mockImplementation((rows: unknown) => {
            insertItensPayload = Array.isArray(rows) ? rows : [rows];
            return Promise.resolve({ error: null });
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: itensRows, error: null }),
            }),
          }),
        };
      }
      return {};
    });
    vi.mocked(createClient).mockResolvedValue(
      { from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await POST(
      new NextRequest("http://localhost/api/modelos", {
        method: "POST",
        body: JSON.stringify({
          nome: "Fechamento mensal",
          descricao: "Checklist fechamento",
          periodicidade: "mensal",
          tipoServico: "fechamento",
          itensChecklist: [
            { titulo: "Conferir saldos", obrigatorio: true },
            { titulo: "Gerar relatório", descricao: "PDF", obrigatorio: false },
          ],
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.id).toBe("modelo-new");
    expect(json.data.nome).toBe("Fechamento mensal");
    expect(json.data.itensChecklist).toHaveLength(2);
    expect(json.data.itensChecklist[0].titulo).toBe("Conferir saldos");
    expect(json.data.itensChecklist[0].ordem).toBe(0);
    expect(json.data.itensChecklist[1].titulo).toBe("Gerar relatório");
    expect(json.data.itensChecklist[1].ordem).toBe(1);
    expect(insertModeloCalled).toBe(true);
    expect(insertItensPayload.length).toBe(2);
    expect((insertItensPayload[0] as { ordem: number }).ordem).toBe(0);
    expect((insertItensPayload[1] as { ordem: number }).ordem).toBe(1);
  });
});
