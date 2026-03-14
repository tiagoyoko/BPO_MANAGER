/**
 * Story 2.4: PATCH /api/tarefas/[tarefaId]/checklist/[itemId] — marcar/desmarcar item.
 * Task 1: body { concluido: boolean }; atualiza concluido, concluido_por_id, concluido_em.
 * Task 2: desmarcar obrigatório/opcional bloqueado se tarefa já concluída.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";

type ChecklistRow = {
  id: string;
  tarefa_id: string;
  obrigatorio: boolean;
  concluido: boolean;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tarefaId: string; itemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAccessModelos(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { tarefaId, itemId } = await context.params;
  if (!tarefaId || !itemId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "tarefaId e itemId obrigatórios." } },
      { status: 400 }
    );
  }

  let body: { concluido?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo inválido." } },
      { status: 400 }
    );
  }

  const concluido = body.concluido;
  if (typeof concluido !== "boolean") {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "concluido deve ser boolean." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: tarefaRow, error: errTarefa } = await supabase
    .from("tarefas")
    .select("id, status")
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (errTarefa) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errTarefa.message } },
      { status: 500 }
    );
  }
  if (!tarefaRow) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Tarefa não encontrada." } },
      { status: 404 }
    );
  }

  const { data: itemRow, error: errItem } = await supabase
    .from("tarefa_checklist_itens")
    .select("id, tarefa_id, obrigatorio, concluido")
    .eq("id", itemId)
    .eq("tarefa_id", tarefaId)
    .maybeSingle();

  if (errItem) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errItem.message } },
      { status: 500 }
    );
  }
  if (!itemRow) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Item do checklist não encontrado." } },
      { status: 404 }
    );
  }

  const tarefaStatus = (tarefaRow as { status: string }).status;
  const item = itemRow as ChecklistRow;

  if (concluido === false) {
    if (tarefaStatus === "concluida") {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "REGRA_NEGOCIO",
            message: item.obrigatorio
              ? "Itens obrigatórios não podem ser desmarcados após conclusão da tarefa."
              : "Itens do checklist não podem ser desmarcados após a tarefa estar concluída.",
          },
        },
        { status: 400 }
      );
    }
  }

  const updatePayload =
    concluido === true
      ? {
          concluido: true,
          concluido_por_id: user.id,
          concluido_em: new Date().toISOString(),
        }
      : {
          concluido: false,
          concluido_por_id: null,
          concluido_em: null,
        };

  const { data: updated, error: errUpdate } = await supabase
    .from("tarefa_checklist_itens")
    .update(updatePayload)
    .eq("id", itemId)
    .eq("tarefa_id", tarefaId)
    .select("id, concluido, concluido_por_id, concluido_em")
    .single();

  if (errUpdate) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errUpdate.message } },
      { status: 500 }
    );
  }

  const u = updated as { id: string; concluido: boolean; concluido_por_id: string | null; concluido_em: string | null };
  return NextResponse.json({
    data: {
      item: {
        id: u.id,
        concluido: u.concluido,
        concluidoPor: u.concluido_por_id,
        concluidoEm: u.concluido_em,
      },
    },
    error: null,
  });
}
