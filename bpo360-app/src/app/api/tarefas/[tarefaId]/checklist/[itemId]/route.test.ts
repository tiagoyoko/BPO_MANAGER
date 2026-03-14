/**
 * Story 2.4: Testes PATCH /api/tarefas/[tarefaId]/checklist/[itemId].
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
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

function createSupabaseForChecklistPatch(options?: {
  tarefa?: unknown;
  item?: unknown;
  updatedItem?: unknown;
}) {
  const tarefa = options?.tarefa ?? { id: "tarefa-1", bpo_id: "bpo-1", status: "em_andamento" };
  const item = options?.item ?? {
    id: "item-1",
    tarefa_id: "tarefa-1",
    titulo: "Validar extrato",
    obrigatorio: true,
    concluido: false,
    concluido_por_id: null,
    concluido_em: null,
  };
  const updatedItem = options?.updatedItem ?? {
    id: "item-1",
    concluido: true,
    concluido_por_id: "user-1",
    concluido_em: "2026-03-14T12:00:00Z",
  };

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "tarefas") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: tarefa, error: null }),
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
              maybeSingle: vi.fn().mockResolvedValue({ data: item, error: null }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedItem, error: null }),
              }),
            }),
          }),
        }),
      };
    }

    if (table === "tarefa_checklist_logs") {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
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
      new NextRequest("http://localhost/api/tarefas/tarefa-1/checklist/item-1", {
        method: "PATCH",
        body: JSON.stringify({ concluido: true }),
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1", itemId: "item-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error?.code).toBe("UNAUTHORIZED");
  });

  it("retorna 200 ao marcar item e preenche concluido_por_id e concluido_em", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    vi.mocked(createClient).mockResolvedValue(createSupabaseForChecklistPatch() as never);

    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/tarefa-1/checklist/item-1", {
        method: "PATCH",
        body: JSON.stringify({ concluido: true }),
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1", itemId: "item-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.item.concluido).toBe(true);
    expect(json.data.item.concluidoPor).toBe("user-1");
    expect(json.data.item.concluidoEm).toBe("2026-03-14T12:00:00Z");
  });

  it("retorna 400 ao desmarcar item obrigatório com tarefa concluída", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseForChecklistPatch({
        tarefa: { id: "tarefa-1", bpo_id: "bpo-1", status: "concluida" },
        item: {
          id: "item-1",
          tarefa_id: "tarefa-1",
          titulo: "Validar extrato",
          obrigatorio: true,
          concluido: true,
          concluido_por_id: "user-1",
          concluido_em: "2026-03-14T12:00:00Z",
        },
      }) as never
    );

    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/tarefa-1/checklist/item-1", {
        method: "PATCH",
        body: JSON.stringify({ concluido: false }),
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1", itemId: "item-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("CHECKLIST_LOCKED");
  });
});
