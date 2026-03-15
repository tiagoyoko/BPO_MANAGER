import { PreferenciasPortalClient } from "./_components/preferencias-portal-client";

export default function PortalPreferenciasPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Preferências</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure como deseja receber avisos sobre suas solicitações.
      </p>
      <PreferenciasPortalClient className="mt-6" />
    </main>
  );
}
