/**
 * Story 2.3: GET /api/tarefas/[tarefaId] — detalhe da tarefa com checklist.
 * Story 2.3 Task 4: PATCH para editar status.
 * Guard: mesmo bpo_id.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PatchTarefaSchema } from "@/lib/api/schemas/tarefas";
import type {
  TarefaDetalhe,
  TarefaChecklistItem,
  TarefaHistoricoItem,
  SolicitacaoRelacionada,
} from "@/lib/domain/rotinas/types";


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

type UsuarioNomeRow = {
  id: string;
  nome: string | null;
};

type ChecklistLogRow = {
  id: string;
  tarefa_checklist_item_id: string;
  acao: "marcar" | "desmarcar";
  usuario_id: string | null;
  ocorrido_em: string;
  item: {
    titulo: string;
  } | null;
};

/** Maps raw Supabase response to typed checklist log rows; documents the select() contract. */
function toChecklistLogRows(data: unknown): ChecklistLogRow[] {
  return (Array.isArray(data) ? data : []) as ChecklistLogRow[];
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tarefaId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { tarefaId } = await context.params;
  if (!tarefaId) return jsonError({ code: "BAD_REQUEST", message: "tarefaId obrigatório." }, 400);

  const supabase = await createClient();
  const { data: tarefaRow, error: errTarefa } = await supabase
    .from("tarefas")
    .select("id, titulo, data_vencimento, status, prioridade, responsavel_id, cliente_id, rotina_cliente_id, created_at, updated_at, bpo_id")
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (errTarefa) return jsonError({ code: "DB_ERROR", message: errTarefa.message }, 500);
  if (!tarefaRow) return jsonError({ code: "NOT_FOUND", message: "Tarefa não encontrada." }, 404);

  const t = tarefaRow as TarefaRow;
  const { data: checklistRows, error: errCheck } = await supabase
    .from("tarefa_checklist_itens")
    .select("id, titulo, descricao, obrigatorio, ordem, concluido, concluido_por_id, concluido_em")
    .eq("tarefa_id", tarefaId)
    .order("ordem", { ascending: true });

  if (errCheck) return jsonError({ code: "DB_ERROR", message: errCheck.message }, 500);

  const checklistConcluidoPorIds = Array.from(
    new Set(
      ((checklistRows ?? []) as ChecklistRow[])
        .map((item) => item.concluido_por_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const usuarioNomePorId = new Map<string, string | null>();
  if (checklistConcluidoPorIds.length > 0) {
    const { data: usuariosChecklist } = await supabase
      .from("usuarios")
      .select("id, nome")
      .in("id", checklistConcluidoPorIds);

    for (const usuario of (usuariosChecklist ?? []) as UsuarioNomeRow[]) {
      usuarioNomePorId.set(usuario.id, usuario.nome);
    }
  }

  const { data: historicoRows, error: errHistorico } = await supabase
    .from("tarefa_checklist_logs")
    .select("id, tarefa_checklist_item_id, acao, usuario_id, ocorrido_em, item:tarefa_checklist_itens(titulo)")
    .eq("tarefa_id", tarefaId)
    .order("ocorrido_em", { ascending: false });

  if (errHistorico) return jsonError({ code: "DB_ERROR", message: errHistorico.message }, 500);

  const historicoUsuarioIds = Array.from(
    new Set(
      toChecklistLogRows(historicoRows)
        .map((entry) => entry.usuario_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (historicoUsuarioIds.length > 0) {
    const usuariosSemNome = historicoUsuarioIds.filter((id) => !usuarioNomePorId.has(id));
    if (usuariosSemNome.length > 0) {
      const { data: usuariosHistorico } = await supabase
        .from("usuarios")
        .select("id, nome")
        .in("id", usuariosSemNome);

      for (const usuario of (usuariosHistorico ?? []) as UsuarioNomeRow[]) {
        usuarioNomePorId.set(usuario.id, usuario.nome);
      }
    }
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
    concluidoPorNome: c.concluido_por_id ? (usuarioNomePorId.get(c.concluido_por_id) ?? null) : null,
    concluidoEm: c.concluido_em,
  }));

  const historico: TarefaHistoricoItem[] = toChecklistLogRows(historicoRows).map((entry) => ({
    id: entry.id,
    itemId: entry.tarefa_checklist_item_id,
    itemTitulo: entry.item?.titulo ?? "Item removido",
    acao: entry.acao,
    usuarioId: entry.usuario_id,
    usuarioNome: entry.usuario_id ? (usuarioNomePorId.get(entry.usuario_id) ?? null) : null,
    ocorridoEm: entry.ocorrido_em,
  }));

  // Story 3.6: solicitações vinculadas à tarefa (tarefa_id = tarefaId, mesmo bpo)
  type SolicitacaoRow = { id: string; titulo: string; status: string; created_at: string };
  const { data: solicitacoesRows } = await supabase
    .from("solicitacoes")
    .select("id, titulo, status, created_at")
    .eq("tarefa_id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .order("created_at", { ascending: false });

  const solicitacoesRelacionadas: SolicitacaoRelacionada[] = ((solicitacoesRows ?? []) as SolicitacaoRow[]).map(
    (s) => ({
      id: s.id,
      titulo: s.titulo,
      status: s.status,
      dataAbertura: s.created_at,
    })
  );
  const solicitacoesAbertasCount = solicitacoesRelacionadas.filter((s) => s.status === "aberta").length;

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
    historico,
    solicitacoesRelacionadas,
    solicitacoesAbertasCount,
  };

  return jsonSuccess(data);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tarefaId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { tarefaId } = await context.params;
  if (!tarefaId) return jsonError({ code: "BAD_REQUEST", message: "tarefaId obrigatório." }, 400);

  const parsed = await parseBody(request, PatchTarefaSchema);
  if (!parsed.success) return parsed.response;
  const status = parsed.data.status;

  const supabase = await createClient();
  if (status === "concluida") {
    const { data: itensObrigatorios, error: errChecklist } = await supabase
      .from("tarefa_checklist_itens")
      .select("id, concluido")
      .eq("tarefa_id", tarefaId)
      .eq("obrigatorio", true);

    if (errChecklist) return jsonError({ code: "DB_ERROR", message: errChecklist.message }, 500);

    const possuiObrigatorioPendente = ((itensObrigatorios ?? []) as Array<{ id: string; concluido: boolean }>).some(
      (item) => !item.concluido
    );

    if (possuiObrigatorioPendente) {
      return jsonError(
        {
          code: "CHECKLIST_INCOMPLETO",
          message: "Complete todos os itens obrigatórios do checklist antes de concluir a tarefa.",
        },
        400
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

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);
  if (!updated) return jsonError({ code: "NOT_FOUND", message: "Tarefa não encontrada." }, 404);

  const u = updated as TarefaRow;
  return jsonSuccess({
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
  });
}
