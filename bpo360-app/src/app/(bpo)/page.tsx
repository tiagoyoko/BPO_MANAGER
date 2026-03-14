import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function BpoHomePage() {
  const user = await getCurrentUser();
  if (user?.role === "cliente_final") {
    redirect("/portal");
  }

  return (
    <main>
      <h1>Dashboard gestor (em construção)</h1>
    </main>
  );
}
