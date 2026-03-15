/**
 * Story 3.1 + 3.2: GET /api/solicitacoes/[solicitacaoId] — detalhe da solicitação.
 * BPO: canAccessModelos + bpo_id; cliente_final: RLS restringe ao próprio cliente.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import type { SolicitacaoDetalhe } from "../../route";

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
  const isClienteFinal = user.role === "cliente_final";
  if (!isClienteFinal && !canAccessModelos(user)) {
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
  let query = supabase
    .from("solicitacoes")
    .select("id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, origem, clientes(nome_fantasia)")
    .eq("id", solicitacaoId);
  if (!isClienteFinal) query = query.eq("bpo_id", user.bpoId);
  const { data: row, error } = await query.maybeSingle();

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
