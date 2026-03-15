import Link from "next/link";

/**
 * Stories 3.2 + 3.5: ponto de entrada do portal com acesso rápido
 * para solicitações e preferências de notificação.
 */
export default function PortalPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Portal do cliente</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acompanhe suas solicitações e ajuste como deseja receber avisos sobre atualizações.
      </p>
      <nav className="mt-6 flex flex-wrap gap-4">
        <Link
          href="/portal/solicitacoes"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Minhas solicitações
        </Link>
        <Link
          href="/portal/preferencias"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Preferências / Notificações
        </Link>
      </nav>
    </main>
  );
}
