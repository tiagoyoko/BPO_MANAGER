import type { CurrentUser } from "@/types/domain";

/**
 * Guards RBAC reutilizados em RLS, API e UI.
 * Story 8.1 – isolamento por papel e cliente_final.
 */

/** Papéis que podem acessar a biblioteca de modelos de rotina (Story 2.1). */
export const ROLES_MODELOS = ["admin_bpo", "gestor_bpo", "operador_bpo"] as const;

export function canAccessModelos(user: CurrentUser): boolean {
  return ROLES_MODELOS.includes(user.role as (typeof ROLES_MODELOS)[number]);
}

export function canAccessAdmin(user: CurrentUser): boolean {
  return user.role === "admin_bpo";
}

export function canManageUsers(user: CurrentUser): boolean {
  return user.role === "admin_bpo";
}

export function canManageClienteUsers(user: CurrentUser): boolean {
  return user.role === "admin_bpo" || user.role === "gestor_bpo";
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

/** Story 2.5: apenas admin_bpo ou gestor_bpo podem usar atribuição em massa. */
export function canAssignMass(user: CurrentUser): boolean {
  return user.role === "admin_bpo" || user.role === "gestor_bpo";
}

/** Story 3.3: usuários BPO internos (bloqueia cliente_final). Usar em endpoints de comunicação/timeline. */
export function isInternalBPOUser(user: CurrentUser): boolean {
  return ROLES_MODELOS.includes(user.role as (typeof ROLES_MODELOS)[number]);
}
