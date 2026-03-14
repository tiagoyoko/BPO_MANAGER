import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { UserProvider } from "@/lib/auth/user-context";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?error=no-profile");
  }

  if (user.role !== "cliente_final" || !user.clienteId) {
    redirect("/");
  }

  return (
    <UserProvider user={user}>
      <div>
        <p className="sr-only">Portal do cliente – cliente: {user.clienteId}</p>
        {children}
      </div>
    </UserProvider>
  );
}
