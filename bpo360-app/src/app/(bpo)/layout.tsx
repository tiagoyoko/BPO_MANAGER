import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { UserProvider } from "@/lib/auth/user-context";

function BpoLayoutFallback() {
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

async function BpoLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?error=no-profile");
  }

  if (user.role === "cliente_final") {
    redirect("/portal");
  }

  return (
    <UserProvider user={user}>
      <div>
        <p className="sr-only">
          Área BPO – usuário: {user.nome ?? user.email ?? user.id}
        </p>
        {children}
      </div>
    </UserProvider>
  );
}

export default function BpoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<BpoLayoutFallback />}>
      <BpoLayoutContent>{children}</BpoLayoutContent>
    </Suspense>
  );
}
