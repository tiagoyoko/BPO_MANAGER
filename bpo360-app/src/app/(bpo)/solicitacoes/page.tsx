/**
 * Story 3.1: Página de solicitações – lista + "Nova solicitação"
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SolicitacoesPageClient } from "./_components/solicitacoes-page-client";

type ClienteOption = { id: string; nomeFantasia: string };

export default async function SolicitacoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");

  const supabase = await createClient();
  const { data: clientesRows } = await supabase
    .from("clientes")
    .select("id, nome_fantasia")
    .eq("bpo_id", user.bpoId)
    .order("nome_fantasia", { ascending: true });

  const clientes: ClienteOption[] = (clientesRows ?? []).map((r) => ({
    id: r.id as string,
    nomeFantasia: (r.nome_fantasia as string) || "",
  }));

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <SolicitacoesPageClient clientes={clientes} />
    </main>
  );
}
