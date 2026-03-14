import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { UserProvider } from "@/lib/auth/user-context";

export default async function BpoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?error=no-profile");
  }

  return (
    <UserProvider user={user}>
      <div>
        <p className="sr-only">Área BPO – usuário: {user.nome ?? user.email ?? user.id}</p>
        {children}
      </div>
    </UserProvider>
  );
}
