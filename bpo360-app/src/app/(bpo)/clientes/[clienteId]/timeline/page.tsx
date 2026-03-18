/**
 * Story 3.3: Página "Comunicação" — timeline de eventos por cliente.
 * Server Component que carrega eventos via API e delega filtros ao cliente.
 */
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import type { EventoTimeline, SolicitacaoRow, ComentarioRow } from "@/app/api/clientes/[clienteId]/timeline/route";
import { TimelineList } from "./_components/timeline-list";

async function carregarTimeline(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bpoId: string,
  clienteId: string
): Promise<EventoTimeline[]> {
  // Buscar solicitações do cliente
  const { data: solicitacoes, error: solError } = await supabase
    .from("solicitacoes")
    .select("id, titulo, created_at, criado_por_id, origem, usuarios:criado_por_id(nome)")
    .eq("bpo_id", bpoId)
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (solError) throw new Error(solError.message);

  const eventos: EventoTimeline[] = [];

  for (const row of (solicitacoes ?? []) as unknown as SolicitacaoRow[]) {
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

  // Buscar IDs de solicitações do cliente para filtrar comentários
  const idssolicitacoes = (solicitacoes ?? []).map((r) => (r as unknown as SolicitacaoRow).id);

  if (idssolicitacoes.length > 0) {
    const { data: comentarios, error: comError } = await supabase
      .from("comentarios")
      .select("id, texto, created_at, solicitacao_id, autor_id, usuarios:autor_id(nome)")
      .eq("bpo_id", bpoId)
      .in("solicitacao_id", idssolicitacoes)
      .order("created_at", { ascending: false });

    if (comError) throw new Error(comError.message);

    for (const row of (comentarios ?? []) as unknown as ComentarioRow[]) {
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

  // Ordenar por dataHora decrescente
  eventos.sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  return eventos;
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (user.role === "cliente_final") notFound();

  const { clienteId } = await params;
  const supabase = await createClient();

  // Verificar se o cliente pertence ao BPO
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (!cliente) notFound();

  let eventos: EventoTimeline[] = [];
  let erroMsg: string | null = null;

  try {
    eventos = await carregarTimeline(supabase, user.bpoId, clienteId);
  } catch (err) {
    console.error("[TimelinePage] Erro ao carregar timeline:", err);
    erroMsg = "Erro ao carregar a timeline. Tente novamente.";
  }

  return (
    <section aria-label="Timeline de comunicação do cliente" className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">Comunicação</h2>

      {erroMsg ? (
        <p className="text-sm text-destructive">{erroMsg}</p>
      ) : (
        <TimelineList eventos={eventos} />
      )}
    </section>
  );
}
