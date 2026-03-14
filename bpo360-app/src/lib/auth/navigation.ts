import type { PapelBpo } from "@/types/domain";

const DEFAULT_APP_PATH = "/";

const ROLE_ROUTE_RULES: Array<{
  prefix: string;
  allowedRoles: PapelBpo[];
}> = [
  {
    prefix: "/admin/usuarios",
    allowedRoles: ["admin_bpo", "gestor_bpo"],
  },
  {
    prefix: "/admin",
    allowedRoles: ["admin_bpo"],
  },
  {
    prefix: "/portal",
    allowedRoles: ["cliente_final"],
  },
];

export function sanitizeAppPath(
  value: string | null | undefined,
  fallback = DEFAULT_APP_PATH
): string {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function isRoleAllowedForPath(
  pathname: string,
  role: PapelBpo | null | undefined
): boolean {
  const rule = ROLE_ROUTE_RULES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!rule) {
    return true;
  }

  if (!role) {
    return false;
  }

  return rule.allowedRoles.includes(role);
}
