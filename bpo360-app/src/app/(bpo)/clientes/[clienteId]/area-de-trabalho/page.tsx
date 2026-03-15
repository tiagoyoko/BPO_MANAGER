/**
 * Story 2.7: Vista Área de trabalho do cliente (3 colunas).
 * Recorrentes | Checklist/Pontuais | Comunicação.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import { AreaDeTrabalhoClient } from "./_components/area-de-trabalho-client";

export const dynamic = "force-dynamic";

export default async function AreaDeTrabalhoPage({
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
    <section aria-labelledby="area-trabalho-heading" className="space-y-4">
      <h2 id="area-trabalho-heading" className="text-lg font-medium">
        Área de trabalho
      </h2>
      <AreaDeTrabalhoClient clienteId={clienteId} />
    </section>
  );
}
