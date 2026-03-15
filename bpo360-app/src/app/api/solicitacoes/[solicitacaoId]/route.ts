/**
 * Story 3.1: GET /api/solicitacoes/[solicitacaoId] — detalhe da solicitação.
 * Story 3.5: PATCH — alterar status (e opcionalmente outros campos); dispara notificação se origem=cliente.
 * Guard: apenas solicitações do bpo do usuário (RLS + canAccessModelos).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { notificarClienteSolicitacaoAtualizada } from "@/lib/domain/notificacoes/notificar-cliente-solicitacao";
import type { SolicitacaoDetalhe, StatusSolicitacao } from "../../route";

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string }> }
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

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, origem, clientes(nome_fantasia)")
    .eq("id", solicitacaoId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  if (!row) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Solicitação não encontrada." } },
      { status: 404 }
    );
  }

  const r = row as SolicitacaoRowComCliente;
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

  return NextResponse.json({ data: detalhe, error: null });
}

const STATUS_VALIDOS = ["aberta", "em_andamento", "resolvida", "fechada"] as const;

export type PatchSolicitacaoBody = {
  status?: StatusSolicitacao;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string }> }
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

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." } },
      { status: 400 }
    );
  }

  let body: PatchSolicitacaoBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const { status: newStatus } = body;
  if (newStatus !== undefined && !STATUS_VALIDOS.includes(newStatus)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "STATUS_INVALIDO",
          message: `status deve ser um de: ${STATUS_VALIDOS.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, status, origem")
    .eq("id", solicitacaoId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: fetchError.message } },
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Solicitação não encontrada." } },
      { status: 404 }
    );
  }

  const currentRow = current as { cliente_id: string; status: string; origem: string };
  const statusAlterado =
    newStatus !== undefined && newStatus !== currentRow.status;

  if (newStatus !== undefined) {
    const { error: updateError } = await supabase
      .from("solicitacoes")
      .update({ status: newStatus })
      .eq("id", solicitacaoId)
      .eq("bpo_id", user.bpoId);

    if (updateError) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: updateError.message } },
        { status: 500 }
      );
    }
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

  if (selectError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: selectError.message } },
      { status: 500 }
    );
  }

  const u = updated as SolicitacaoRowComCliente;
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

  return NextResponse.json({ data: detalhe, error: null });
}
