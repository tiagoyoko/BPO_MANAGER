/**
 * Página /admin/usuarios – apenas admin_bpo.
 * Story 8.2 – AC 1, 4: lista usuários internos (exclui cliente_final).
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageUsers } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { AdminUsuariosClient } from "./_components/admin-usuarios-client";
import type { UsuarioListItem } from "./_components/usuarios-table";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (!canManageUsers(user)) redirect("/");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, role, cliente_id, created_at, updated_at")
    .eq("bpo_id", user.bpoId)
    .neq("role", "cliente_final")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[AdminUsuariosPage] erro ao buscar usuarios:", error.message);
  }

  const usuariosIniciais: UsuarioListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    email: row.email,
    role: row.role,
    clienteId: row.cliente_id ?? null,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  }));

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <AdminUsuariosClient usuariosIniciais={usuariosIniciais} />
    </main>
  );
}
