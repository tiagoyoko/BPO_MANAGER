export default function BpoLoading() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      aria-busy="true"
      aria-label="Carregando"
    >
      <span className="text-muted-foreground">Carregando…</span>
    </div>
  );
}
