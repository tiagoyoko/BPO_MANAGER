/**
 * Página Resumo do cliente – placeholder (expandir em EP5 com indicadores e tarefas).
 * Story 1.5 — Server Component; aba Configurações em /clientes/[clienteId]/config.
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClienteResumoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");

  return (
    <section aria-label="Resumo do cliente">
      <p className="text-sm text-muted-foreground">
        Visão 360 do cliente será implementada nas stories do Epic 5 (indicadores, tarefas, timeline).
      </p>
    </section>
  );
}
