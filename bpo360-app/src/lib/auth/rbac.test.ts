import { describe, it, expect } from "vitest";
import {
  canAccessAdmin,
  canManageUsers,
  canAccessCliente,
} from "./rbac";
import type { CurrentUser } from "@/types/domain";

function user(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "u1",
    email: "u@bpo.local",
    bpoId: "b1",
    role: "operador_bpo",
    clienteId: null,
    nome: "Op",
    ...overrides,
  };
}

describe("rbac", () => {
  describe("canAccessAdmin", () => {
    it("retorna true apenas para admin_bpo", () => {
      expect(canAccessAdmin(user({ role: "admin_bpo" }))).toBe(true);
      expect(canAccessAdmin(user({ role: "gestor_bpo" }))).toBe(false);
      expect(canAccessAdmin(user({ role: "operador_bpo" }))).toBe(false);
      expect(canAccessAdmin(user({ role: "cliente_final" }))).toBe(false);
    });
  });

  describe("canManageUsers", () => {
    it("retorna true apenas para admin_bpo", () => {
      expect(canManageUsers(user({ role: "admin_bpo" }))).toBe(true);
      expect(canManageUsers(user({ role: "gestor_bpo" }))).toBe(false);
    });
  });

  describe("canAccessCliente", () => {
    it("cliente_final só acessa o próprio cliente_id", () => {
      const cf = user({ role: "cliente_final", clienteId: "c1" });
      expect(canAccessCliente(cf, "c1")).toBe(true);
      expect(canAccessCliente(cf, "c2")).toBe(false);
    });

    it("admin_bpo e gestor_bpo acessam qualquer cliente (RLS filtra por bpo)", () => {
      expect(canAccessCliente(user({ role: "admin_bpo" }), "c1")).toBe(true);
      expect(canAccessCliente(user({ role: "gestor_bpo" }), "c1")).toBe(true);
      expect(canAccessCliente(user({ role: "operador_bpo" }), "c1")).toBe(true);
    });
  });
});
