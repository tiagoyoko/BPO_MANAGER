/**
 * Story 3.1 + 3.2: GET /api/solicitacoes (lista com filtros) | POST (criar solicitação).
 * BPO: canAccessModelos; cliente_final: só próprio cliente (GET filtrado, POST ignora body.clienteId e usa get_my_cliente_id; origem 'cliente').
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";

const TIPOS_VALIDOS = ["documento_faltando", "duvida", "ajuste", "outro"] as const;
const PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"] as const;
const STATUS_VALIDOS = ["aberta", "em_andamento", "resolvida", "fechada"] as const;

export type TipoSolicitacao = (typeof TIPOS_VALIDOS)[number];
export type PrioridadeSolicitacao = (typeof PRIORIDADES_VALIDAS)[number];
export type StatusSolicitacao = (typeof STATUS_VALIDOS)[number];

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
};

type SolicitacaoRowComCliente = SolicitacaoRow & {
  clientes?: { nome_fantasia: string } | null;
};

export type PostSolicitacaoBody = {
  clienteId: string;
  titulo: string;
  descricao?: string;
  tipo: TipoSolicitacao;
  prioridade: PrioridadeSolicitacao;
  tarefaId?: string | null;
};

// ─── GET /api/solicitacoes ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
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
  if (isClienteFinal && !user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Cliente não identificado." } },
      { status: 403 }
    );
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
      "id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, clientes(nome_fantasia)",
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

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const list = (rows ?? []) as SolicitacaoRowComCliente[];
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
  }));

  return NextResponse.json({
    data: { solicitacoes, total: count ?? 0, page, limit },
    error: null,
  });
}

// ─── POST /api/solicitacoes ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
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
  if (isClienteFinal && !user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Cliente não identificado." } },
      { status: 403 }
    );
  }

  let body: PostSolicitacaoBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const { clienteId: bodyClienteId, titulo, descricao, tipo, prioridade, tarefaId } = body;
  const tituloNormalizado = titulo?.trim() ?? "";
  const descricaoNormalizada = descricao?.trim() ?? "";
  const clienteId = isClienteFinal ? user.clienteId! : (bodyClienteId ?? "").trim() || null;
  if (!clienteId || !tituloNormalizado || !descricaoNormalizada || !tipo || !prioridade) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CAMPOS_OBRIGATORIOS",
          message: isClienteFinal
            ? "titulo, descricao, tipo e prioridade são obrigatórios."
            : "clienteId, titulo, descricao, tipo e prioridade são obrigatórios.",
        },
      },
      { status: 400 }
    );
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "TIPO_INVALIDO",
          message: `tipo deve ser um de: ${TIPOS_VALIDOS.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }
  if (!PRIORIDADES_VALIDAS.includes(prioridade)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "PRIORIDADE_INVALIDA",
          message: `prioridade deve ser uma de: ${PRIORIDADES_VALIDAS.join(", ")}.`,
        },
      },
      { status: 400 }
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
    if (errTarefa) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: errTarefa.message } },
        { status: 500 }
      );
    }
    if (!tarefa || (tarefa as { cliente_id: string }).cliente_id !== clienteId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "TAREFA_INVALIDA",
            message: "tarefaId deve ser uma tarefa do mesmo cliente e do seu BPO.",
          },
        },
        { status: 400 }
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
    if (errCliente) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: errCliente.message } },
        { status: 500 }
      );
    }
    if (!cliente) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CLIENTE_INVALIDO",
            message: "clienteId deve pertencer ao seu BPO.",
          },
        },
        { status: 400 }
      );
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
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: "BPO do cliente não encontrado." } },
      { status: 500 }
    );
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
    .select("id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  const row = inserida as SolicitacaoRow;
  return NextResponse.json(
    {
      data: {
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
      },
      error: null,
    },
    { status: 201 }
  );
}
