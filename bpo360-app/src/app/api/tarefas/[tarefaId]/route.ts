/**
 * Story 2.3: GET /api/tarefas/[tarefaId] — detalhe da tarefa com checklist.
 * Story 2.3 Task 4: PATCH para editar status.
 * Story 2.4 Task 3: PATCH status "concluida" só se todos obrigatórios marcados.
 * Guard: mesmo bpo_id.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import type {
  TarefaDetalhe,
  TarefaChecklistItem,
  StatusTarefa,
} from "@/lib/domain/rotinas/types";

const STATUS_VALIDOS: StatusTarefa[] = ["a_fazer", "em_andamento", "concluida", "atrasada", "bloqueada"];

type TarefaRow = {
  id: string;
  titulo: string;
  data_vencimento: string;
  status: string;
  prioridade: string;
  responsavel_id: string | null;
  cliente_id: string;
  rotina_cliente_id: string | null;
  created_at: string;
  updated_at: string;
  bpo_id: string;
};

type ChecklistRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  obrigatorio: boolean;
  ordem: number;
  concluido: boolean;
  concluido_por_id: string | null;
  concluido_em: string | null;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tarefaId: string }> }
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

  const { tarefaId } = await context.params;
  if (!tarefaId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "tarefaId obrigatório." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: tarefaRow, error: errTarefa } = await supabase
    .from("tarefas")
    .select("id, titulo, data_vencimento, status, prioridade, responsavel_id, cliente_id, rotina_cliente_id, created_at, updated_at, bpo_id")
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

  const t = tarefaRow as TarefaRow;
  const { data: checklistRows, error: errCheck } = await supabase
    .from("tarefa_checklist_itens")
    .select("id, titulo, descricao, obrigatorio, ordem, concluido, concluido_por_id, concluido_em")
    .eq("tarefa_id", tarefaId)
    .order("ordem", { ascending: true });

  if (errCheck) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errCheck.message } },
      { status: 500 }
    );
  }

  let responsavelNome: string | null = null;
  if (t.responsavel_id) {
    const { data: u } = await supabase
      .from("usuarios")
      .select("nome")
      .eq("id", t.responsavel_id)
      .single();
    if (u && (u as { nome: string | null }).nome) {
      responsavelNome = (u as { nome: string }).nome;
    }
  }

  const checklist: TarefaChecklistItem[] = ((checklistRows ?? []) as ChecklistRow[]).map((c) => ({
    id: c.id,
    titulo: c.titulo,
    descricao: c.descricao,
    obrigatorio: c.obrigatorio,
    ordem: c.ordem,
    concluido: c.concluido,
    concluidoPor: c.concluido_por_id,
    concluidoEm: c.concluido_em,
  }));

  const data: TarefaDetalhe = {
    id: t.id,
    titulo: t.titulo,
    dataVencimento: t.data_vencimento,
    status: t.status,
    prioridade: t.prioridade,
    responsavelId: t.responsavel_id,
    responsavelNome,
    clienteId: t.cliente_id,
    rotinaClienteId: t.rotina_cliente_id,
    criadoEm: t.created_at,
    atualizadoEm: t.updated_at,
    checklist,
    comentarios: [],
    historico: [],
  };

  return NextResponse.json({ data, error: null });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tarefaId: string }> }
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

  const { tarefaId } = await context.params;
  if (!tarefaId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "tarefaId obrigatório." } },
      { status: 400 }
    );
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo inválido." } },
      { status: 400 }
    );
  }

  const status = body.status as string | undefined;
  if (!status || !STATUS_VALIDOS.includes(status as StatusTarefa)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "STATUS_INVALIDO",
          message: "status deve ser um de: a_fazer, em_andamento, concluida, atrasada, bloqueada.",
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (status === "concluida") {
    const { data: obrigatorios, error: errCheck } = await supabase
      .from("tarefa_checklist_itens")
      .select("id, concluido")
      .eq("tarefa_id", tarefaId)
      .eq("obrigatorio", true);

    if (errCheck) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: errCheck.message } },
        { status: 500 }
      );
    }
    const pendentes = (obrigatorios ?? []).filter((r: { concluido: boolean }) => !r.concluido);
    if (pendentes.length > 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "REGRA_NEGOCIO",
            message: "Complete todos os itens obrigatórios do checklist antes de concluir a tarefa.",
          },
        },
        { status: 400 }
      );
    }
  }

  const { data: updated, error } = await supabase
    .from("tarefas")
    .update({ status })
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .select("id, titulo, data_vencimento, status, prioridade, responsavel_id, cliente_id, rotina_cliente_id, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  if (!updated) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Tarefa não encontrada." } },
      { status: 404 }
    );
  }

  const u = updated as TarefaRow;
  return NextResponse.json({
    data: {
      id: u.id,
      titulo: u.titulo,
      dataVencimento: u.data_vencimento,
      status: u.status,
      prioridade: u.prioridade,
      responsavelId: u.responsavel_id,
      clienteId: u.cliente_id,
      rotinaClienteId: u.rotina_cliente_id,
      criadoEm: u.created_at,
      atualizadoEm: u.updated_at,
    },
    error: null,
  });
}
