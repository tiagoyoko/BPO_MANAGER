/**
 * Story 3.1/3.4: Detalhe da solicitação com seção Documentos.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetalheSolicitacaoClient } from "./_components/detalhe-solicitacao-client";
import type { SolicitacaoDetalhe } from "@/app/api/solicitacoes/route";

export default async function SolicitacaoDetalhePage({
  params,
}: {
  params: Promise<{ solicitacaoId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (user.role === "cliente_final") redirect("/portal");

  const { solicitacaoId } = await params;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, titulo, descricao, tipo, prioridade, tarefa_id, status, created_at, updated_at, criado_por_id, origem, clientes(nome_fantasia)")
    .eq("id", solicitacaoId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (error || !row) notFound();

  const r = row as {
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
  const solicitacao: SolicitacaoDetalhe = {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <DetalheSolicitacaoClient
        solicitacaoId={solicitacaoId}
        solicitacao={solicitacao}
      />
    </div>
  );
}
