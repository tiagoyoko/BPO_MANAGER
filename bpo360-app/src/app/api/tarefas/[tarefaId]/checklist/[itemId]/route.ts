/**
 * Story 2.4: PATCH /api/tarefas/[tarefaId]/checklist/[itemId] — marcar/desmarcar item do checklist.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

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
      { data: null, error: { code: "BAD_REQUEST", message: "tarefaId e itemId são obrigatórios." } },
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

  if (typeof body.concluido !== "boolean") {
    return NextResponse.json(
      {
        data: null,
        error: { code: "BAD_REQUEST", message: "Campo concluido deve ser boolean." },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: tarefa, error: errTarefa } = await supabase
    .from("tarefas")
    .select("id, bpo_id, status")
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (errTarefa) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errTarefa.message } },
      { status: 500 }
    );
  }
  if (!tarefa) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Tarefa não encontrada." } },
      { status: 404 }
    );
  }

  const { data: item, error: errItem } = await supabase
    .from("tarefa_checklist_itens")
    .select("id, tarefa_id, titulo, obrigatorio, concluido, concluido_por_id, concluido_em")
    .eq("id", itemId)
    .eq("tarefa_id", tarefaId)
    .maybeSingle();

  if (errItem) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errItem.message } },
      { status: 500 }
    );
  }
  if (!item) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Item do checklist não encontrado." } },
      { status: 404 }
    );
  }

  const tarefaAtual = tarefa as TarefaRow;
  const itemAtual = item as ChecklistRow;

  if (tarefaAtual.status === "concluida" && itemAtual.concluido !== body.concluido) {
    if (body.concluido === false && itemAtual.obrigatorio) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CHECKLIST_LOCKED",
            message: "Itens obrigatórios não podem ser desmarcados após conclusão da tarefa.",
          },
        },
        { status: 400 }
      );
    }

    if (body.concluido === false) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CHECKLIST_LOCKED",
            message: "Itens opcionais não podem ser desmarcados após conclusão da tarefa.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CHECKLIST_LOCKED",
          message: "Checklist não pode ser alterado após conclusão da tarefa.",
        },
      },
      { status: 400 }
    );
  }

  const concluidoEm = body.concluido ? new Date().toISOString() : null;
  const concluidoPorId = body.concluido ? user.id : null;

  const { data: updatedItem, error: errUpdate } = await supabase
    .from("tarefa_checklist_itens")
    .update({
      concluido: body.concluido,
      concluido_por_id: concluidoPorId,
      concluido_em: concluidoEm,
    })
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

  const { error: errLog } = await supabase.from("tarefa_checklist_logs").insert({
    bpo_id: tarefaAtual.bpo_id,
    tarefa_id: tarefaId,
    tarefa_checklist_item_id: itemId,
    acao: body.concluido ? "marcar" : "desmarcar",
    usuario_id: user.id,
  });

  if (errLog) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errLog.message } },
      { status: 500 }
    );
  }

  const itemResponse = updatedItem as {
    id: string;
    concluido: boolean;
    concluido_por_id: string | null;
    concluido_em: string | null;
  };

  return NextResponse.json({
    data: {
      item: {
        id: itemResponse.id,
        concluido: itemResponse.concluido,
        concluidoPor: itemResponse.concluido_por_id,
        concluidoPorNome: body.concluido ? user.nome : null,
        concluidoEm: itemResponse.concluido_em,
      },
    },
    error: null,
  });
}
