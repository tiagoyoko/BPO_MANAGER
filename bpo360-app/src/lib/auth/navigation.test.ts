import { describe, expect, it } from "vitest";
import { isRoleAllowedForPath, sanitizeAppPath } from "./navigation";

describe("sanitizeAppPath", () => {
  it("aceita caminhos internos relativos à aplicação", () => {
    expect(sanitizeAppPath("/clientes")).toBe("/clientes");
    expect(sanitizeAppPath("/admin/usuarios?tab=ativos")).toBe(
      "/admin/usuarios?tab=ativos"
    );
  });

  it("rejeita URLs externas ou inválidas", () => {
    expect(sanitizeAppPath("https://evil.example")).toBe("/");
    expect(sanitizeAppPath("//evil.example")).toBe("/");
    expect(sanitizeAppPath("admin")).toBe("/");
    expect(sanitizeAppPath(null)).toBe("/");
  });
});

describe("isRoleAllowedForPath", () => {
  it("permite caminhos sem regra explícita", () => {
    expect(isRoleAllowedForPath("/", "operador_bpo")).toBe(true);
    expect(isRoleAllowedForPath("/clientes", "cliente_final")).toBe(true);
  });

  it("restringe /admin a admin_bpo", () => {
    expect(isRoleAllowedForPath("/admin", "admin_bpo")).toBe(true);
    expect(isRoleAllowedForPath("/admin", "gestor_bpo")).toBe(false);
    expect(isRoleAllowedForPath("/admin/usuarios", "operador_bpo")).toBe(false);
    expect(isRoleAllowedForPath("/admin/usuarios", null)).toBe(false);
  });
});
