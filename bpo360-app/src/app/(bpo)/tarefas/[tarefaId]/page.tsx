/**
 * Story 2.3: Página de detalhe da tarefa — checklist, comentários (em breve), histórico, editar status.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TarefaDetalheClient } from "./_components/tarefa-detalhe-client";

export default async function TarefaDetalhePage({
  params,
}: {
  params: Promise<{ tarefaId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (user.role === "cliente_final") redirect("/portal");

  const { tarefaId } = await params;
  const supabase = await createClient();
  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("id, bpo_id")
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (!tarefa) notFound();

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <TarefaDetalheClient tarefaId={tarefaId} />
    </div>
  );
}
