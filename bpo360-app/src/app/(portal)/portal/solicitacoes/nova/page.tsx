/**
 * Story 3.2: Portal – formulário Nova solicitação (assunto, descrição, anexos).
 */
import Link from "next/link";
import { NovaSolicitacaoPortalForm } from "../_components/nova-solicitacao-portal-form";

export const dynamic = "force-dynamic";

export default function PortalNovaSolicitacaoPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-xl">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/portal/solicitacoes" className="hover:underline">
          ← Voltar às solicitações
        </Link>
      </nav>
      <h1 className="text-xl font-semibold mb-4">Nova solicitação</h1>
      <NovaSolicitacaoPortalForm />
    </main>
  );
}
