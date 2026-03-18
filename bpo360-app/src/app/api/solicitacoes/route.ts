/**
 * Story 3.1 + 3.2: GET /api/solicitacoes (lista com filtros) | POST (criar solicitação).
 * BPO: canAccessModelos; cliente_final: só próprio cliente (GET filtrado, POST ignora body.clienteId e usa get_my_cliente_id; origem 'cliente').
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PostSolicitacaoSchema } from "@/lib/api/schemas/solicitacoes";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type export (typeof X)[number]
const TIPOS_VALIDOS = ["documento_faltando", "duvida", "ajuste", "outro"] as const;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type export (typeof X)[number]
const PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"] as const;
const STATUS_VALIDOS = ["aberta", "em_andamento", "resolvida", "fechada"] as const;

export type TipoSolicitacao = (typeof TIPOS_VALIDOS)[number];
export type PrioridadeSolicitacao = (typeof PRIORIDADES_VALIDAS)[number];
export type StatusSolicitacao = (typeof STATUS_VALIDOS)[number];
export type OrigemSolicitacao = "interno" | "cliente";

export type SolicitacaoListItem = {
  id: string;
  clienteId: string;
  clienteNome: string | null;
  titulo: string;
  descricao: string | null;
  tipo: TipoSolicitacao;
  prioridade: PrioridadeSolicitacao;
  tarefaId: string | null;
  status: StatusSolicitacao;
  createdAt: string;
  updatedAt: string;
  criadoPorId: string | null;
  origem: OrigemSolicitacao;
};

export type SolicitacaoDetalhe = SolicitacaoListItem;

type SolicitacaoRow = {
  id: string;
  bpo_id: string;
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
};

type SolicitacaoRowComCliente = SolicitacaoRow & {
  clientes?: { nome_fantasia: string } | null;
};

/** Maps raw Supabase list response to typed rows; documents the select() contract. */
function toSolicitacaoRowComClienteList(data: unknown): SolicitacaoRowComCliente[] {
  return (Array.isArray(data) ? data : []) as SolicitacaoRowComCliente[];
}

// ─── GET /api/solicitacoes ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  const isClienteFinal = user.role === "cliente_final";
  if (!isClienteFinal && !canAccessModelos(user)) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }
  if (isClienteFinal && !user.clienteId) {
    return jsonError({ code: "FORBIDDEN", message: "Cliente não identificado." }, 403);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;
  const statusParam = (searchParams.get("status") ?? "").trim();
  const status =
    statusParam && STATUS_VALIDOS.includes(statusParam as StatusSolicitacao) ? statusParam : null;
  const clienteIdParam = (searchParams.get("clienteId") ?? "").trim() || null;
  const clienteId = isClienteFinal ? user.clienteId! : clienteIdParam;

  const supabase = await createClient();

  let query = supabase
    .from("solicitacoes")
    .select(
      "id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, origem, clientes(nome_fantasia)",
      { count: "exact" }
    );

  if (isClienteFinal) {
    query = query.eq("cliente_id", user.clienteId!);
  } else {
    query = query.eq("bpo_id", user.bpoId);
    if (clienteId) query = query.eq("cliente_id", clienteId);
  }
  if (status) query = query.eq("status", status);

  const { data: rows, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);

  const list = toSolicitacaoRowComClienteList(rows);
  const solicitacoes: SolicitacaoListItem[] = list.map((r) => ({
    id: r.id,
    clienteId: r.cliente_id,
    clienteNome: r.clientes?.nome_fantasia ?? null,
    titulo: r.titulo,
    descricao: r.descricao,
    tipo: r.tipo as TipoSolicitacao,
    prioridade: r.prioridade as PrioridadeSolicitacao,
    tarefaId: r.tarefa_id,
    status: r.status as StatusSolicitacao,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    criadoPorId: r.criado_por_id,
    origem: r.origem as OrigemSolicitacao,
  }));

  return jsonSuccess({ solicitacoes, total: count ?? 0, page, limit });
}

// ─── POST /api/solicitacoes ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  const isClienteFinal = user.role === "cliente_final";
  if (!isClienteFinal && !canAccessModelos(user)) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }
  if (isClienteFinal && !user.clienteId) {
    return jsonError({ code: "FORBIDDEN", message: "Cliente não identificado." }, 403);
  }

  const parsed = await parseBody(request, PostSolicitacaoSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const { clienteId: bodyClienteId, titulo, descricao, tipo, prioridade, tarefaId } = body;
  const tituloNormalizado = titulo.trim();
  const descricaoNormalizada = descricao.trim();
  const clienteId = isClienteFinal ? user.clienteId! : (bodyClienteId ?? "").trim() || null;
  if (!clienteId) {
    return jsonError(
      {
        code: "CAMPOS_OBRIGATORIOS",
        message: "clienteId é obrigatório para solicitações do BPO.",
      },
      400
    );
  }

  const supabase = await createClient();

  if (tarefaId && !isClienteFinal) {
    const { data: tarefa, error: errTarefa } = await supabase
      .from("tarefas")
      .select("id, cliente_id")
      .eq("id", tarefaId)
      .eq("bpo_id", user.bpoId)
      .maybeSingle();
    if (errTarefa) return jsonError({ code: "DB_ERROR", message: errTarefa.message }, 500);
    if (!tarefa || (tarefa as { cliente_id: string }).cliente_id !== clienteId) {
      return jsonError(
        { code: "TAREFA_INVALIDA", message: "tarefaId deve ser uma tarefa do mesmo cliente e do seu BPO." },
        400
      );
    }
  }

  if (!isClienteFinal) {
    const { data: cliente, error: errCliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", clienteId)
      .eq("bpo_id", user.bpoId)
      .maybeSingle();
    if (errCliente) return jsonError({ code: "DB_ERROR", message: errCliente.message }, 500);
    if (!cliente) {
      return jsonError({ code: "CLIENTE_INVALIDO", message: "clienteId deve pertencer ao seu BPO." }, 400);
    }
  }

  const origem = isClienteFinal ? "cliente" : "interno";
  let bpoIdForInsert: string;
  if (isClienteFinal) {
    const { data: cli } = await supabase.from("clientes").select("bpo_id").eq("id", clienteId).single();
    bpoIdForInsert = (cli as { bpo_id: string } | null)?.bpo_id ?? "";
  } else {
    bpoIdForInsert = user.bpoId ?? "";
  }
  if (!bpoIdForInsert) {
    return jsonError({ code: "DB_ERROR", message: "BPO do cliente não encontrado." }, 500);
  }

  const { data: inserida, error: insertError } = await supabase
    .from("solicitacoes")
    .insert({
      bpo_id: bpoIdForInsert,
      cliente_id: clienteId,
      titulo: tituloNormalizado,
      descricao: descricaoNormalizada,
      tipo,
      prioridade,
      tarefa_id: isClienteFinal ? null : (tarefaId ?? null),
      status: "aberta",
      criado_por_id: user.id,
      origem,
    })
    .select("id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, origem")
    .single();

  if (insertError) return jsonError({ code: "DB_ERROR", message: insertError.message }, 500);

  const row = inserida as SolicitacaoRow;
  return jsonSuccess(
    {
      id: row.id,
      clienteId: row.cliente_id,
      titulo: row.titulo,
      descricao: row.descricao,
      tipo: row.tipo,
      prioridade: row.prioridade,
      tarefaId: row.tarefa_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      criadoPorId: row.criado_por_id,
      origem: row.origem as OrigemSolicitacao,
    },
    201
  );
}
