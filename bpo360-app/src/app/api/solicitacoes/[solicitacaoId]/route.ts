/**
 * Stories 3.1 + 3.2 + 3.5:
 * GET /api/solicitacoes/[solicitacaoId] — detalhe da solicitação.
 * PATCH — altera status e dispara notificação quando uma solicitação do cliente é atualizada.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { notificarClienteSolicitacaoAtualizada } from "@/lib/domain/notificacoes/notificar-cliente-solicitacao";
import type { SolicitacaoDetalhe } from "@/app/api/solicitacoes/route";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PatchSolicitacaoSchema } from "@/lib/api/schemas/solicitacoes";

type SolicitacaoRowComCliente = {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  prioridade: string;
  tarefa_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  criado_por_id: string | null;
  origem: string;
  clientes?: { nome_fantasia: string } | null;
};

/** Maps raw Supabase single-row response to typed row; documents the select() contract. */
function toSolicitacaoRowComCliente(row: unknown): SolicitacaoRowComCliente {
  return row as SolicitacaoRowComCliente;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  const isClienteFinal = user.role === "cliente_final";
  if (!isClienteFinal && !canAccessModelos(user)) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return jsonError({ code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." }, 400);
  }

  const supabase = await createClient();
  let query = supabase
    .from("solicitacoes")
    .select("id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, origem, clientes(nome_fantasia)")
    .eq("id", solicitacaoId);
  if (!isClienteFinal) query = query.eq("bpo_id", user.bpoId);
  const { data: row, error } = await query.maybeSingle();

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);
  if (!row) return jsonError({ code: "NOT_FOUND", message: "Solicitação não encontrada." }, 404);

  const r = toSolicitacaoRowComCliente(row);
  const detalhe: SolicitacaoDetalhe = {
    id: r.id,
    clienteId: r.cliente_id,
    clienteNome: r.clientes?.nome_fantasia ?? null,
    titulo: r.titulo,
    descricao: r.descricao,
    tipo: r.tipo as SolicitacaoDetalhe["tipo"],
    prioridade: r.prioridade as SolicitacaoDetalhe["prioridade"],
    tarefaId: r.tarefa_id,
    status: r.status as SolicitacaoDetalhe["status"],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    criadoPorId: r.criado_por_id,
    origem: r.origem as SolicitacaoDetalhe["origem"],
  };

  return jsonSuccess(detalhe);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return jsonError({ code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." }, 400);
  }

  const parsed = await parseBody(request, PatchSolicitacaoSchema);
  if (!parsed.success) return parsed.response;
  const { status: newStatus } = parsed.data;

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, status, origem")
    .eq("id", solicitacaoId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (fetchError) return jsonError({ code: "DB_ERROR", message: fetchError.message }, 500);
  if (!current) return jsonError({ code: "NOT_FOUND", message: "Solicitação não encontrada." }, 404);

  const currentRow = current as { cliente_id: string; status: string; origem: string };
  const statusAlterado =
    newStatus !== undefined && newStatus !== currentRow.status;

  if (newStatus !== undefined) {
    const { error: updateError } = await supabase
      .from("solicitacoes")
      .update({ status: newStatus })
      .eq("id", solicitacaoId)
      .eq("bpo_id", user.bpoId);

    if (updateError) return jsonError({ code: "DB_ERROR", message: updateError.message }, 500);
  }

  if (statusAlterado && currentRow.origem === "cliente") {
    await notificarClienteSolicitacaoAtualizada(supabase, {
      clienteId: currentRow.cliente_id,
      solicitacaoId,
      tipoEvento: "status_alterado",
      origemSolicitacao: currentRow.origem,
    });
  }

  const { data: updated, error: selectError } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, origem, clientes(nome_fantasia)")
    .eq("id", solicitacaoId)
    .eq("bpo_id", user.bpoId)
    .single();

  if (selectError) return jsonError({ code: "DB_ERROR", message: selectError.message }, 500);

  const u = toSolicitacaoRowComCliente(updated);
  const detalhe: SolicitacaoDetalhe = {
    id: u.id,
    clienteId: u.cliente_id,
    clienteNome: u.clientes?.nome_fantasia ?? null,
    titulo: u.titulo,
    descricao: u.descricao,
    tipo: u.tipo as SolicitacaoDetalhe["tipo"],
    prioridade: u.prioridade as SolicitacaoDetalhe["prioridade"],
    tarefaId: u.tarefa_id,
    status: u.status as SolicitacaoDetalhe["status"],
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    criadoPorId: u.criado_por_id,
    origem: u.origem as SolicitacaoDetalhe["origem"],
  };

  return jsonSuccess(detalhe);
}
