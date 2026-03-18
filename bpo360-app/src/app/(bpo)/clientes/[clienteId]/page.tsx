/**
 * Página Resumo do cliente – rotinas (Story 2.2) e placeholder para Epic 5.
 * Story 1.5 — Server Component; aba Configurações em /clientes/[clienteId]/config.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { RotinasClienteSection } from "./_components/rotinas-cliente-section";

export default async function ClienteResumoPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");

  const { clienteId } = await params;
  const podeAplicarRotina =
    user.role === "admin_bpo" || user.role === "gestor_bpo" || user.role === "operador_bpo";

  return (
    <section aria-label="Resumo do cliente" className="space-y-6">
      {podeAplicarRotina && <RotinasClienteSection clienteId={clienteId} />}
      <p className="text-sm text-muted-foreground">
        Visão 360 do cliente será implementada nas stories do Epic 5 (indicadores, tarefas, timeline).
      </p>
    </section>
  );
}
