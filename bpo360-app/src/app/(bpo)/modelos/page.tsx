/**
 * Página Biblioteca de modelos de rotina – Story 2.1
 * Lista modelos do BPO + botão "Novo modelo" que abre formulário/modal.
 * Acesso restrito a admin_bpo, gestor_bpo, operador_bpo (AC3).
 */
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { ModelosPageClient } from "./_components/modelos-page-client";

export default async function ModelosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (!canAccessModelos(user)) redirect("/");

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <ModelosPageClient user={user} />
    </main>
  );
}
