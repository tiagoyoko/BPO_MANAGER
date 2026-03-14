/**
 * Página /admin/usuarios.
 * Story 8.3 – gestão combinada de usuários internos e usuários cliente_final.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageClienteUsers, canManageUsers } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { AdminUsuariosClient } from "./_components/admin-usuarios-client";
import type { ClienteOption, UsuarioListItem } from "./_components/usuarios-table";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");
  if (!canManageClienteUsers(user)) redirect("/");

  const supabase = await createClient();
  const canManageInternal = canManageUsers(user);
  const internosPromise = canManageInternal
    ? supabase
        .from("usuarios")
        .select("id, nome, email, role, cliente_id, created_at, updated_at")
        .eq("bpo_id", user.bpoId)
        .neq("role", "cliente_final")
        .order("nome", { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const clientesUsersPromise = supabase
    .from("usuarios")
    .select("id, nome, email, role, cliente_id, created_at, updated_at")
    .eq("bpo_id", user.bpoId)
    .eq("role", "cliente_final")
    .order("nome", { ascending: true });

  const clientesPromise = supabase
    .from("clientes")
    .select("id, nome_fantasia, razao_social, cnpj")
    .eq("bpo_id", user.bpoId)
    .order("nome_fantasia", { ascending: true });

  const [
    { data, error },
    { data: usuariosClientesRows, error: usuariosClientesError },
    { data: clientesRows, error: clientesError },
  ] = await Promise.all([internosPromise, clientesUsersPromise, clientesPromise]);

  if (error) {
    console.error("[AdminUsuariosPage] erro ao buscar usuarios:", error.message);
  }
  if (usuariosClientesError) {
    console.error(
      "[AdminUsuariosPage] erro ao buscar usuarios cliente_final:",
      usuariosClientesError.message
    );
  }
  if (clientesError) {
    console.error("[AdminUsuariosPage] erro ao buscar clientes:", clientesError.message);
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

  const usuariosClientesIniciais: UsuarioListItem[] = (usuariosClientesRows ?? []).map(
    (row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      role: row.role,
      clienteId: row.cliente_id ?? null,
      criadoEm: row.created_at,
      atualizadoEm: row.updated_at,
    })
  );

  const clientes: ClienteOption[] = (clientesRows ?? []).map((row) => ({
    id: row.id,
    nome: row.nome_fantasia || row.razao_social,
    cnpj: row.cnpj,
  }));

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <AdminUsuariosClient
        usuariosIniciais={usuariosIniciais}
        usuariosClientesIniciais={usuariosClientesIniciais}
        clientes={clientes}
        canManageInternal={canManageInternal}
      />
    </main>
  );
}
