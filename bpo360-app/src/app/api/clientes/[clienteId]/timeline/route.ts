/**
 * Story 3.3: GET /api/clientes/[clienteId]/timeline
 * Agrega eventos de comunicação do cliente: solicitacao_criada e comentario.
 * Ordenado por dataHora decrescente (mais recente primeiro).
 * Filtro opcional: ?tipoEvento=solicitacao_criada,comentario
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isInternalBPOUser } from "@/lib/auth/rbac";

export type TipoEvento = "solicitacao_criada" | "comentario";

export type EventoTimeline = {
  id: string;
  tipo: TipoEvento;
  tituloOuResumo: string;
  autorTipo: "interno" | "cliente";
  autorNome: string | null;
  dataHora: string;
  entidadeId: string;
  entidadeTipo: "solicitacao" | "comentario";
};

/** Tipos internos exportados para reuso no Server Component da página. */
export type SolicitacaoRow = {
  id: string;
  titulo: string;
  created_at: string;
  criado_por_id: string | null;
  origem: string;
  usuarios: { nome: string | null } | null;
};

export type ComentarioRow = {
  id: string;
  texto: string;
  created_at: string;
  solicitacao_id: string;
  autor_id: string | null;
  usuarios: { nome: string | null } | null;
};

const TIPOS_VALIDOS: TipoEvento[] = ["solicitacao_criada", "comentario"];

/** Maps raw Supabase response to typed rows; documents the select() contract. */
function toSolicitacaoRows(data: unknown): SolicitacaoRow[] {
  return (Array.isArray(data) ? data : []) as SolicitacaoRow[];
}

/** Maps raw Supabase response to typed rows; documents the select() contract. */
function toComentarioRows(data: unknown): ComentarioRow[] {
  return (Array.isArray(data) ? data : []) as ComentarioRow[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!isInternalBPOUser(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { clienteId } = await params;
  const { searchParams } = new URL(request.url);

  const tipoEventoParam = searchParams.get("tipoEvento") ?? "";
  const tiposFiltro: TipoEvento[] = tipoEventoParam
    ? (tipoEventoParam
        .split(",")
        .map((t) => t.trim())
        .filter((t): t is TipoEvento => TIPOS_VALIDOS.includes(t as TipoEvento)))
    : [];

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const supabase = await createClient();

  // Verificar se o cliente pertence ao BPO do usuário
  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (clienteError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: clienteError.message } },
      { status: 500 }
    );
  }
  if (!cliente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  const eventos: EventoTimeline[] = [];
  const buscarSolicitacoes =
    tiposFiltro.length === 0 || tiposFiltro.includes("solicitacao_criada");
  const buscarComentarios =
    tiposFiltro.length === 0 || tiposFiltro.includes("comentario");

  // IDs de solicitações do cliente — reutilizados para filtrar comentários sem query extra.
  let idssolicitacoes: string[] = [];

  // Buscar solicitações do cliente
  if (buscarSolicitacoes) {
    const { data: solicitacoes, error: solError } = await supabase
      .from("solicitacoes")
      .select("id, titulo, created_at, criado_por_id, origem, usuarios:criado_por_id(nome)")
      .eq("bpo_id", user.bpoId)
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });

    if (solError) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: solError.message } },
        { status: 500 }
      );
    }

    for (const row of toSolicitacaoRows(solicitacoes)) {
      const autorTipo = row.origem === "cliente" ? "cliente" : "interno";
      eventos.push({
        id: `sol-${row.id}`,
        tipo: "solicitacao_criada",
        tituloOuResumo: row.titulo,
        autorTipo,
        autorNome: autorTipo === "interno" ? (row.usuarios?.nome ?? null) : "Cliente",
        dataHora: row.created_at,
        entidadeId: row.id,
        entidadeTipo: "solicitacao",
      });
    }

    // Captura IDs para reutilizar na query de comentários (evita segunda roundtrip ao DB).
    idssolicitacoes = toSolicitacaoRows(solicitacoes).map((r) => r.id);
  }

  // Buscar comentários de solicitações do cliente
  if (buscarComentarios) {
    // Se não buscamos solicitações acima, precisamos dos IDs agora.
    if (!buscarSolicitacoes) {
      idssolicitacoes = await getIdssolicitacoesCliente(supabase, user.bpoId, clienteId);
    }

    if (idssolicitacoes.length > 0) {
      const { data: comentarios, error: comError } = await supabase
        .from("comentarios")
        .select(
          "id, texto, created_at, solicitacao_id, autor_id, usuarios:autor_id(nome)"
        )
        .eq("bpo_id", user.bpoId)
        .in("solicitacao_id", idssolicitacoes)
        .order("created_at", { ascending: false });

      if (comError) {
        return NextResponse.json(
          { data: null, error: { code: "DB_ERROR", message: comError.message } },
          { status: 500 }
        );
      }

      for (const row of toComentarioRows(comentarios)) {
        eventos.push({
          id: `com-${row.id}`,
          tipo: "comentario",
          tituloOuResumo: row.texto.length > 120 ? row.texto.slice(0, 120) + "…" : row.texto,
          autorTipo: "interno",
          autorNome: row.usuarios?.nome ?? null,
          dataHora: row.created_at,
          entidadeId: row.id,
          entidadeTipo: "comentario",
        });
      }
    }
  }

  // Ordenar todos os eventos por dataHora decrescente
  eventos.sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  // TODO (débito técnico): paginação é feita em memória após carregar todos os eventos.
  // Para clientes com grande volume, migrar para paginação via cursor no banco (Story futura).
  const total = eventos.length;
  const offset = (page - 1) * limit;
  const eventosPaginados = eventos.slice(offset, offset + limit);

  return NextResponse.json({
    data: { eventos: eventosPaginados, total, page, limit },
    error: null,
  });
}

async function getIdssolicitacoesCliente(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  bpoId: string,
  clienteId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("solicitacoes")
    .select("id")
    .eq("bpo_id", bpoId)
    .eq("cliente_id", clienteId);
  return (data ?? []).map((r: { id: string }) => r.id);
}
