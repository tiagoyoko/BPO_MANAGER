/**
 * Story 3.2: Portal – detalhe da solicitação e listagem/download/preview de anexos.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetalheSolicitacaoPortal } from "./_components/detalhe-solicitacao-portal";

type Props = { params: Promise<{ id: string }> };

export default async function PortalSolicitacaoDetalhePage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (user.role !== "cliente_final" || !user.clienteId) redirect("/");

  const { id } = await params;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("solicitacoes")
    .select("id, titulo, descricao, tipo, prioridade, status, created_at, updated_at")
    .eq("id", id)
    .eq("cliente_id", user.clienteId)
    .maybeSingle();

  if (error || !row) notFound();

  const { data: anexosRows } = await supabase
    .from("documentos")
    .select("id, nome_arquivo, tipo_mime, tamanho, created_at")
    .eq("solicitacao_id", id)
    .order("created_at", { ascending: true });

  const anexos = (anexosRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    nomeArquivo: r.nome_arquivo as string,
    tipoMime: r.tipo_mime as string,
    tamanho: Number(r.tamanho),
    createdAt: r.created_at as string,
  }));

  const solicitacao = {
    id: (row as Record<string, unknown>).id as string,
    titulo: (row as Record<string, unknown>).titulo as string,
    descricao: (row as Record<string, unknown>).descricao as string | null,
    tipo: (row as Record<string, unknown>).tipo as string,
    prioridade: (row as Record<string, unknown>).prioridade as string,
    status: (row as Record<string, unknown>).status as string,
    createdAt: (row as Record<string, unknown>).created_at as string,
    updatedAt: (row as Record<string, unknown>).updated_at as string,
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <DetalheSolicitacaoPortal solicitacao={solicitacao} anexos={anexos} />
    </main>
  );
}
