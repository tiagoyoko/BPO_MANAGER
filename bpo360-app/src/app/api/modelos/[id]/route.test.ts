/**
 * Story 2.1: Testes GET/PATCH/DELETE /api/modelos/[id]
 * Evidências: PATCH atualiza nome e lista de itens com ordem preservada; usuário sem permissão ou de outro BPO não acessa (403/404).
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

const { GET, PATCH, DELETE } = await import("./route");

const USUARIO_MOCK = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "gestor@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const MODELO_ROW = {
  id: "modelo-1",
  bpo_id: "bpo-1",
  nome: "Conciliação",
  descricao: "Rotina conciliação",
  periodicidade: "diaria",
  tipo_servico: "conciliacao",
  created_at: "2026-03-14T10:00:00Z",
  updated_at: "2026-03-14T10:00:00Z",
  criado_por_id: "user-1",
};

const ITENS_ROWS = [
  { id: "item-1", titulo: "Item A", descricao: null, obrigatorio: true, ordem: 0 },
  { id: "item-2", titulo: "Item B", descricao: "Desc B", obrigatorio: false, ordem: 1 },
];

function createSupabaseForModelo(bpoId: string) {
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "rotinas_modelo") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: bpoId === USUARIO_MOCK.bpoId ? MODELO_ROW : null,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    }
    if (table === "rotina_modelo_checklist_itens") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: ITENS_ROWS, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return {};
  });
  return { from: fromMock };
}

describe("GET /api/modelos/[id]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 404 quando modelo não existe para o bpo do usuário", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "rotina_modelo_checklist_itens") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {};
    });
    vi.mocked(createClient).mockResolvedValue(
      { from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(new NextRequest("http://localhost/api/modelos/outro-id"), {
      params: Promise.resolve({ id: "outro-id" }),
    });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna 200 com modelo e itens quando pertence ao bpo do usuário", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseForModelo(USUARIO_MOCK.bpoId) as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await GET(new NextRequest("http://localhost/api/modelos/modelo-1"), {
      params: Promise.resolve({ id: "modelo-1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("modelo-1");
    expect(json.data.itensChecklist).toHaveLength(2);
    expect(json.data.itensChecklist[0].titulo).toBe("Item A");
    expect(json.data.itensChecklist[1].ordem).toBe(1);
  });
});

describe("PATCH /api/modelos/[id]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 400 quando nome vazio no PATCH", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseForModelo(USUARIO_MOCK.bpoId) as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await PATCH(
      new NextRequest("http://localhost/api/modelos/modelo-1", {
        method: "PATCH",
        body: JSON.stringify({ nome: "   " }),
      }),
      { params: Promise.resolve({ id: "modelo-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("CAMPOS_OBRIGATORIOS");
  });

  it("PATCH atualiza nome e lista de itens; ordem preservada", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    let updatePayload: unknown = null;
    let insertItensPayload: unknown[] = [];
    let rotinasCallCount = 0;
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo") {
        rotinasCallCount += 1;
        const isFirstGet = rotinasCallCount === 1; // 1ª getModeloComItens (existente); 2ª = após update
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: isFirstGet ? MODELO_ROW : { ...MODELO_ROW, nome: "Conciliação v2" },
                  error: null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockImplementation((payload: unknown) => {
            updatePayload = payload;
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }),
        };
      }
      if (table === "rotina_modelo_checklist_itens") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn()
                .mockResolvedValueOnce({ data: ITENS_ROWS, error: null })
                .mockResolvedValueOnce({
                  data: [
                    { id: "i1", titulo: "Item X", descricao: null, obrigatorio: true, ordem: 0 },
                    { id: "i2", titulo: "Item Y", descricao: null, obrigatorio: false, ordem: 1 },
                  ],
                  error: null,
                }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          insert: vi.fn().mockImplementation((payload: unknown) => {
            insertItensPayload = Array.isArray(payload) ? payload : [payload];
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {};
    });
    vi.mocked(createClient).mockResolvedValue(
      { from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await PATCH(
      new NextRequest("http://localhost/api/modelos/modelo-1", {
        method: "PATCH",
        body: JSON.stringify({
          nome: "Conciliação v2",
          itensChecklist: [
            { titulo: "Item X", obrigatorio: true },
            { titulo: "Item Y", obrigatorio: false },
          ],
        }),
      }),
      { params: Promise.resolve({ id: "modelo-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.nome).toBe("Conciliação v2");
    expect(updatePayload).toEqual(expect.objectContaining({ nome: "Conciliação v2" }));
    expect(insertItensPayload.length).toBe(2);
    expect((insertItensPayload[0] as { ordem: number }).ordem).toBe(0);
    expect((insertItensPayload[1] as { ordem: number }).ordem).toBe(1);
  });
});

describe("DELETE /api/modelos/[id]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 403 quando usuário é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      ...USUARIO_MOCK,
      role: "cliente_final" as const,
    });
    const res = await DELETE(new NextRequest("http://localhost/api/modelos/modelo-1"), {
      params: Promise.resolve({ id: "modelo-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna 404 quando modelo de outro BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "rotinas_modelo") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });
    vi.mocked(createClient).mockResolvedValue(
      { from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await DELETE(new NextRequest("http://localhost/api/modelos/modelo-outro-bpo"), {
      params: Promise.resolve({ id: "modelo-outro-bpo" }),
    });
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("retorna 204 ao deletar modelo do próprio BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_MOCK);
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseForModelo(USUARIO_MOCK.bpoId) as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const res = await DELETE(new NextRequest("http://localhost/api/modelos/modelo-1"), {
      params: Promise.resolve({ id: "modelo-1" }),
    });
    expect(res.status).toBe(204);
  });
});
