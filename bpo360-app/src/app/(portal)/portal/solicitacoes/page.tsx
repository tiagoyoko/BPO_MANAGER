/**
 * Story 3.2: Portal – lista de solicitações do cliente e botão Nova solicitação.
 */
import { SolicitacoesPortalClient } from "./_components/solicitacoes-portal-client";

export const dynamic = "force-dynamic";

export default function PortalSolicitacoesPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Minhas solicitações</h1>
      <SolicitacoesPortalClient />
    </main>
  );
}
