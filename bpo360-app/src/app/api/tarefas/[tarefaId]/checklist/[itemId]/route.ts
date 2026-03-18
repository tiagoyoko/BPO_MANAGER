/**
 * Story 2.4: PATCH /api/tarefas/[tarefaId]/checklist/[itemId] — marcar/desmarcar item do checklist.
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PatchChecklistItemSchema } from "@/lib/api/schemas/tarefas";

type TarefaRow = {
  id: string;
  bpo_id: string;
  status: string;
};

type ChecklistRow = {
  id: string;
  tarefa_id: string;
  titulo: string;
  obrigatorio: boolean;
  concluido: boolean;
  concluido_por_id: string | null;
  concluido_em: string | null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tarefaId: string; itemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { tarefaId, itemId } = await context.params;
  if (!tarefaId || !itemId) {
    return jsonError({ code: "BAD_REQUEST", message: "tarefaId e itemId são obrigatórios." }, 400);
  }

  const parsed = await parseBody(request, PatchChecklistItemSchema);
  if (!parsed.success) return parsed.response;
  const concluido = parsed.data.concluido;

  const supabase = await createClient();
  const { data: tarefa, error: errTarefa } = await supabase
    .from("tarefas")
    .select("id, bpo_id, status")
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (errTarefa) return jsonError({ code: "DB_ERROR", message: errTarefa.message }, 500);
  if (!tarefa) return jsonError({ code: "NOT_FOUND", message: "Tarefa não encontrada." }, 404);

  const { data: item, error: errItem } = await supabase
    .from("tarefa_checklist_itens")
    .select("id, tarefa_id, titulo, obrigatorio, concluido, concluido_por_id, concluido_em")
    .eq("id", itemId)
    .eq("tarefa_id", tarefaId)
    .maybeSingle();

  if (errItem) return jsonError({ code: "DB_ERROR", message: errItem.message }, 500);
  if (!item) return jsonError({ code: "NOT_FOUND", message: "Item do checklist não encontrado." }, 404);

  const tarefaAtual = tarefa as TarefaRow;
  const itemAtual = item as ChecklistRow;

  if (tarefaAtual.status === "concluida" && itemAtual.concluido !== concluido) {
    if (concluido === false && itemAtual.obrigatorio) {
      return jsonError(
        { code: "CHECKLIST_LOCKED", message: "Itens obrigatórios não podem ser desmarcados após conclusão da tarefa." },
        400
      );
    }
    if (concluido === false) {
      return jsonError(
        { code: "CHECKLIST_LOCKED", message: "Itens opcionais não podem ser desmarcados após conclusão da tarefa." },
        400
      );
    }
    return jsonError(
      { code: "CHECKLIST_LOCKED", message: "Checklist não pode ser alterado após conclusão da tarefa." },
      400
    );
  }

  const concluidoEm = concluido ? new Date().toISOString() : null;
  const concluidoPorId = concluido ? user.id : null;

  const { data: updatedItem, error: errUpdate } = await supabase
    .from("tarefa_checklist_itens")
    .update({
      concluido: concluido,
      concluido_por_id: concluidoPorId,
      concluido_em: concluidoEm,
    })
    .eq("id", itemId)
    .eq("tarefa_id", tarefaId)
    .select("id, concluido, concluido_por_id, concluido_em")
    .single();

  if (errUpdate) return jsonError({ code: "DB_ERROR", message: errUpdate.message }, 500);

  const { error: errLog } = await supabase.from("tarefa_checklist_logs").insert({
    bpo_id: tarefaAtual.bpo_id,
    tarefa_id: tarefaId,
    tarefa_checklist_item_id: itemId,
    acao: concluido ? "marcar" : "desmarcar",
    usuario_id: user.id,
  });

  if (errLog) return jsonError({ code: "DB_ERROR", message: errLog.message }, 500);

  const itemResponse = updatedItem as {
    id: string;
    concluido: boolean;
    concluido_por_id: string | null;
    concluido_em: string | null;
  };

  return jsonSuccess({
    item: {
      id: itemResponse.id,
      concluido: itemResponse.concluido,
      concluidoPor: itemResponse.concluido_por_id,
      concluidoPorNome: concluido ? user.nome : null,
      concluidoEm: itemResponse.concluido_em,
    },
  });
}
