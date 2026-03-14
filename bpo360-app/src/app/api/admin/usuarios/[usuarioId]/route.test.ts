import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth/rbac", () => ({
  canManageUsers: vi.fn(),
  canManageClienteUsers: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/domain/clientes/repository", () => ({ buscarClientePorIdEBpo: vi.fn() }));

const authModule = await import("@/lib/auth/get-current-user");
const rbacModule = await import("@/lib/auth/rbac");
const supabaseModule = await import("@/lib/supabase/server");
const clientesRepository = await import("@/lib/domain/clientes/repository");

const getCurrentUser = vi.mocked(authModule.getCurrentUser);
const canManageUsers = vi.mocked(rbacModule.canManageUsers);
const canManageClienteUsers = vi.mocked(rbacModule.canManageClienteUsers);
const createClient = vi.mocked(supabaseModule.createClient);
const buscarClientePorIdEBpo = vi.mocked(clientesRepository.buscarClientePorIdEBpo);

const { PATCH } = await import("./route");

const ADMIN = {
  id: "admin-1",
  bpoId: "bpo-1",
  role: "admin_bpo" as const,
  email: "admin@bpo.com",
  clienteId: null,
  nome: "Admin",
};

const GESTOR = {
  id: "gestor-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "gestor@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

function makeSupabaseMock(targetRole: "operador_bpo" | "cliente_final") {
  const selectExistente = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: "u1", bpo_id: "bpo-1", role: targetRole },
        error: null,
      }),
    }),
  });

  const updateChain = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "u1",
            nome: targetRole === "cliente_final" ? "Cliente Atualizado" : "Nome Atualizado",
            email: "u1@bpo.com",
            role: targetRole,
            bpo_id: "bpo-1",
            cliente_id: "cliente-1",
            updated_at: "2026-03-13T11:00:00Z",
          },
          error: null,
        }),
      }),
    }),
  });

  return {
    from: vi.fn().mockReturnValue({
      select: selectExistente,
      update: updateChain,
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/admin/usuarios/[usuarioId]", () => {
  it("retorna 403 quando gestor tenta editar usuário interno", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageUsers.mockReturnValue(false);
    createClient.mockResolvedValue(
      makeSupabaseMock("operador_bpo") as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const req = new Request("http://localhost/api/admin/usuarios/u1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "Nome Atualizado" }),
    });

    const res = await PATCH(req as NextRequest, {
      params: Promise.resolve({ usuarioId: "u1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("retorna 400 quando clienteId não pertence ao mesmo BPO", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    canManageClienteUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      makeSupabaseMock("cliente_final") as unknown as Awaited<ReturnType<typeof createClient>>
    );
    buscarClientePorIdEBpo.mockResolvedValue({ data: null, error: null } as never);

    const req = new Request("http://localhost/api/admin/usuarios/u1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "cliente_final", clienteId: "cliente-outro-bpo" }),
    });

    const res = await PATCH(req as NextRequest, {
      params: Promise.resolve({ usuarioId: "u1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("CLIENTE_INVALIDO");
  });

  it("gestor_bpo atualiza usuário cliente_final do mesmo BPO", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageClienteUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      makeSupabaseMock("cliente_final") as unknown as Awaited<ReturnType<typeof createClient>>
    );
    buscarClientePorIdEBpo.mockResolvedValue({
      data: { id: "cliente-1", bpo_id: "bpo-1" },
      error: null,
    } as never);

    const req = new Request("http://localhost/api/admin/usuarios/u1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Cliente Atualizado",
        role: "cliente_final",
        clienteId: "cliente-1",
      }),
    });

    const res = await PATCH(req as NextRequest, {
      params: Promise.resolve({ usuarioId: "u1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.role).toBe("cliente_final");
    expect(json.data.clienteId).toBe("cliente-1");
  });
});
