/**
 * Página de configurações do cliente – ERP principal (F360) e parâmetros (story 1.6).
 * Story 1.5 — Server Component; carrega ERPs e renderiza ErpConfigClient.
 */
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import { buscarIntegracoesPorCliente } from "@/lib/domain/integracoes-erp/repository";
import { ErpConfigClient } from "./_components/erp-config-client";

export const dynamic = "force-dynamic";

export default async function ClienteConfigPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");

  if (user.role === "cliente_final") {
    redirect("/clientes");
  }

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error: errCliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (errCliente || !cliente) notFound();

  let integracoes: Awaited<ReturnType<typeof buscarIntegracoesPorCliente>> = [];
  try {
    integracoes = await buscarIntegracoesPorCliente(supabase, clienteId, user.bpoId);
  } catch {
    integracoes = [];
  }

  return (
    <section aria-label="Configurações do cliente">
      <ErpConfigClient
        integracoes={integracoes}
        clienteId={clienteId}
        userRole={user.role}
      />
    </section>
  );
}
