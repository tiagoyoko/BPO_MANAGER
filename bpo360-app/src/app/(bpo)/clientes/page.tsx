/**
 * Página de clientes – lista + botão "Novo cliente"
 * Story 1.2 / 1.4: Server Component; Client Component faz fetch com filtros e paginação.
 */
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { ClientesPageClient } from "./_components/clientes-page-client";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");

  const supabase = await createClient();
  const [{ data: responsaveisRows }, { data: tagsRows }] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id, nome")
      .eq("bpo_id", user.bpoId)
      .neq("role", "cliente_final")
      .order("nome", { ascending: true }),
    supabase.from("clientes").select("tags").eq("bpo_id", user.bpoId),
  ]);

  const responsaveis = (responsaveisRows ?? []).map((r) => ({
    id: r.id as string,
    nome: (r.nome as string | null) ?? null,
  }));
  const tagsDisponiveis = Array.from(
    new Set(
      (tagsRows ?? []).flatMap((row) =>
        Array.isArray(row.tags)
          ? row.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
          : []
      )
    )
  ).sort((left, right) => left.localeCompare(right, "pt-BR"));

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <ClientesPageClient
        user={user}
        responsaveis={responsaveis}
        tagsDisponiveis={tagsDisponiveis}
      />
    </main>
  );
}
