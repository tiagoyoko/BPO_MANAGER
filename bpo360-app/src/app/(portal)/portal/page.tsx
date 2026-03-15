import Link from "next/link";

export default function PortalPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Portal do cliente</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acesso isolado por cliente. Solicitações, documentos e notificações serão exibidos aqui nas próximas stories do Epic 3.
      </p>
      <nav className="mt-6 flex flex-wrap gap-4">
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
