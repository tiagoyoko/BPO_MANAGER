/**
 * Story 2.3: Painel "Hoje" — tarefas com vencimento hoje para o BPO.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { TarefasHojeClient } from "./_components/tarefas-hoje-client";

export const dynamic = "force-dynamic";

export default async function TarefasHojePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (user.role === "cliente_final") redirect("/portal");

  return (
    <section aria-labelledby="hoje-heading" className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 id="hoje-heading" className="text-xl font-semibold mb-4">
        Tarefas de hoje
      </h1>
      <TarefasHojeClient />
    </section>
  );
}
