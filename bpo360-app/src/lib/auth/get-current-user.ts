import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/types/domain";

/**
 * Obtém o usuário autenticado e seu perfil (bpo_id, role, cliente_id).
 * Retorna null se não houver sessão ou se não existir linha em usuarios.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: row, error: profileError } = await supabase
    .from("usuarios")
    .select("id, bpo_id, role, cliente_id, nome, email")
    .eq("id", user.id)
    .single();

  if (profileError || !row) return null;

  return {
    id: row.id,
    email: row.email ?? user.email ?? null,
    bpoId: row.bpo_id,
    role: row.role as CurrentUser["role"],
    clienteId: row.cliente_id,
    nome: row.nome,
  };
}
