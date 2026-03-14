/**
 * Story 2.3: GET /api/clientes/[clienteId]/tarefas — listar tarefas do cliente.
 * Mesmo contrato que GET /api/tarefas com clienteId implícito. cliente_final só acessa seu próprio cliente.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessCliente } from "@/lib/auth/rbac";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import type { TarefaListItem } from "@/lib/domain/rotinas/types";

const STATUS_VALIDOS = ["a_fazer", "em_andamento", "concluida", "atrasada", "bloqueada"] as const;
const PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"] as const;

type TarefaRow = {
  id: string;
  titulo: string;
  data_vencimento: string;
  status: string;
  prioridade: string;
  responsavel_id: string | null;
  cliente_id: string;
  rotina_cliente_id: string | null;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }

  const { clienteId } = await context.params;
  if (!clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "clienteId obrigatório." } },
      { status: 400 }
    );
  }
  if (!canAccessCliente(user, clienteId)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const cliente = await buscarClientePorIdEBpo({ supabase, clienteId, bpoId: user.bpoId });
  if (!cliente.data) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dataInicioParam = (searchParams.get("dataInicio") ?? "").trim();
  const dataFimParam = (searchParams.get("dataFim") ?? "").trim();
  const statusParam = (searchParams.get("status") ?? "").trim();
  const responsavelId = (searchParams.get("responsavelId") ?? "").trim() || null;
  const prioridadeParam = (searchParams.get("prioridade") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const hoje = new Date().toISOString().slice(0, 10);
  const dataInicio = dataInicioParam === "hoje" ? hoje : dataInicioParam || null;
  const dataFim = dataFimParam === "hoje" ? hoje : dataFimParam || null;
  const status =
    statusParam && STATUS_VALIDOS.includes(statusParam as (typeof STATUS_VALIDOS)[number])
      ? statusParam
      : null;
  const prioridade =
    prioridadeParam && PRIORIDADES_VALIDAS.includes(prioridadeParam as (typeof PRIORIDADES_VALIDAS)[number])
      ? prioridadeParam
      : null;

  let query = supabase
    .from("tarefas")
    .select("id, titulo, data_vencimento, status, prioridade, responsavel_id, cliente_id, rotina_cliente_id", {
      count: "exact",
    })
    .eq("bpo_id", user.bpoId)
    .eq("cliente_id", clienteId);

  if (dataInicio) query = query.gte("data_vencimento", dataInicio);
  if (dataFim) query = query.lte("data_vencimento", dataFim);
  if (status) query = query.eq("status", status);
  if (responsavelId) query = query.eq("responsavel_id", responsavelId);
  if (prioridade) query = query.eq("prioridade", prioridade);

  query = query.order("data_vencimento", { ascending: true }).order("prioridade", { ascending: false });
  const { data: rows, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const list = (rows ?? []) as TarefaRow[];
  const responsavelIds = [...new Set(list.map((r) => r.responsavel_id).filter(Boolean))] as string[];
  let nomesMap: Record<string, string> = {};
  if (responsavelIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nome")
      .in("id", responsavelIds);
    if (usuarios) {
      for (const u of usuarios as { id: string; nome: string | null }[]) {
        if (u.nome) nomesMap[u.id] = u.nome;
      }
    }
  }

  const tarefas: TarefaListItem[] = list.map((r) => {
    let statusExibir = r.status;
    if (r.status !== "concluida" && r.data_vencimento < hoje) {
      statusExibir = "atrasada";
    }
    return {
      id: r.id,
      titulo: r.titulo,
      dataVencimento: r.data_vencimento,
      status: statusExibir,
      prioridade: r.prioridade,
      responsavelId: r.responsavel_id,
      responsavelNome: r.responsavel_id ? nomesMap[r.responsavel_id] ?? null : null,
      clienteId: r.cliente_id,
      rotinaClienteId: r.rotina_cliente_id,
    };
  });

  return NextResponse.json({
    data: { tarefas, total: count ?? 0, page, limit },
    error: null,
  });
}
