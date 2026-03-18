/**
 * Layout do detalhe do cliente: header com nome e abas Resumo / Configurações.
 * Story 1.5 — shell reutilizável entre page e config/page.
 */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";

export default async function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clienteId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (error || !cliente) notFound();

  const row = cliente as { razao_social: string; nome_fantasia: string };
  const nome = row.razao_social || row.nome_fantasia || "Cliente";
  const podeVerConfig = user.role !== "cliente_final";

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{nome}</h1>
        <nav className="mt-3 flex gap-4 border-b border-border" aria-label="Abas do cliente">
          <Link
            href={`/clientes/${clienteId}`}
            className="border-b-2 border-transparent px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[active]:border-primary data-[active]:text-foreground"
          >
            Resumo
          </Link>
          {podeVerConfig && (
            <>
              <Link
                href={`/clientes/${clienteId}/area-de-trabalho`}
                className="border-b-2 border-transparent px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[active]:border-primary data-[active]:text-foreground"
              >
                Área de trabalho
              </Link>
              <Link
                href={`/clientes/${clienteId}/tarefas`}
                className="border-b-2 border-transparent px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[active]:border-primary data-[active]:text-foreground"
              >
                Tarefas
              </Link>
              <Link
                href={`/clientes/${clienteId}/timeline`}
                className="border-b-2 border-transparent px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[active]:border-primary data-[active]:text-foreground"
              >
                Comunicação
              </Link>
              <Link
                href={`/clientes/${clienteId}/config`}
                className="border-b-2 border-transparent px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[active]:border-primary data-[active]:text-foreground"
              >
                Configurações
              </Link>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
