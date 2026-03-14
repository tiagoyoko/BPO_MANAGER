import type { CurrentUser } from "@/types/domain";

/**
 * Guards RBAC reutilizados em RLS, API e UI.
 * Story 8.1 – isolamento por papel e cliente_final.
 */

export function canAccessAdmin(user: CurrentUser): boolean {
  return user.role === "admin_bpo";
}

export function canManageUsers(user: CurrentUser): boolean {
  return user.role === "admin_bpo";
}

/**
 * cliente_final só acessa o próprio cliente_id; demais papéis acessam todos do BPO (RLS filtra).
 */
export function canAccessCliente(
  user: CurrentUser,
  clienteId: string
): boolean {
  if (user.role === "cliente_final") {
    return user.clienteId === clienteId;
  }
  return true;
}
