/**
 * Story 2.3: Página Tarefas do cliente — calendário e lista com filtros.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import { TarefasClienteClient } from "./_components/tarefas-cliente-client";

export default async function TarefasClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (user.role === "cliente_final") redirect("/portal");

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });
  if (error || !cliente) notFound();

  return (
    <section aria-labelledby="tarefas-heading" className="space-y-4">
      <h2 id="tarefas-heading" className="text-lg font-medium">
        Tarefas
      </h2>
      <TarefasClienteClient clienteId={clienteId} />
    </section>
  );
}
