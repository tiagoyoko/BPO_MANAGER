/**
 * Story 2.4: Testes PATCH /api/tarefas/[tarefaId]/checklist/[itemId].
 * Marcar/desmarcar item; concluido_por_id e concluido_em ao marcar; 400 ao desmarcar se tarefa concluída.
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

const { PATCH } = await import("./route");

const GESTOR = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "g@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

function createSupabaseForChecklistPatch(
  tarefaStatus: string,
  itemObrigatorio: boolean,
  updateResult: { id: string; concluido: boolean; concluido_por_id: string | null; concluido_em: string | null }
) {
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "tarefas") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "tarefa-1", status: tarefaStatus },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "tarefa_checklist_itens") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "item-1",
                  tarefa_id: "tarefa-1",
                  obrigatorio: itemObrigatorio,
                  concluido: false,
                },
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updateResult, error: null }),
              }),
            }),
          }),
        }),
      };
    }
    return {};
  });
  return { from };
}

describe("PATCH /api/tarefas/[tarefaId]/checklist/[itemId]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/t1/checklist/i1", {
        method: "PATCH",
        body: JSON.stringify({ concluido: true }),
      }),
      { params: Promise.resolve({ tarefaId: "t1", itemId: "i1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error?.code).toBe("UNAUTHORIZED");
  });

  it("retorna 200 e preenche concluido_por_id e concluido_em ao marcar item", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const updateResult = {
      id: "item-1",
      concluido: true,
      concluido_por_id: "user-1",
      concluido_em: "2026-03-14T12:00:00.000Z",
    };
    const supabase = createSupabaseForChecklistPatch("a_fazer", true, updateResult);
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/tarefa-1/checklist/item-1", {
        method: "PATCH",
        body: JSON.stringify({ concluido: true }),
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1", itemId: "item-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.item.concluido).toBe(true);
    expect(json.data.item.concluidoPor).toBe("user-1");
    expect(json.data.item.concluidoEm).toBe(updateResult.concluido_em);
  });

  it("retorna 400 ao desmarcar item obrigatório com tarefa já concluída", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseForChecklistPatch("concluida", true, {
      id: "item-1",
      concluido: false,
      concluido_por_id: null,
      concluido_em: null,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/tarefa-1/checklist/item-1", {
        method: "PATCH",
        body: JSON.stringify({ concluido: false }),
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1", itemId: "item-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("REGRA_NEGOCIO");
    expect(json.error?.message).toContain("obrigatórios");
  });

  it("retorna 400 ao desmarcar item opcional com tarefa já concluída", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseForChecklistPatch("concluida", false, {
      id: "item-1",
      concluido: false,
      concluido_por_id: null,
      concluido_em: null,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/tarefa-1/checklist/item-1", {
        method: "PATCH",
        body: JSON.stringify({ concluido: false }),
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1", itemId: "item-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("REGRA_NEGOCIO");
  });
});
