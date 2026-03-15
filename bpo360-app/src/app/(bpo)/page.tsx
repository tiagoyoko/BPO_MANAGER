import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { BpoHomeDashboardClient } from "./_components/bpo-home-dashboard-client";

export default async function BpoHomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?error=no-profile");
  }

  if (user?.role === "cliente_final") {
    redirect("/portal");
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <BpoHomeDashboardClient user={user} />
    </main>
  );
}
