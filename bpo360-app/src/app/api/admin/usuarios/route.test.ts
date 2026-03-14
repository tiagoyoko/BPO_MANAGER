/**
 * Testes de integração/API para GET e POST /api/admin/usuarios.
 * Story 8.3 – usuários internos seguem admin-only; cliente_final pode ser gerido por admin_bpo e gestor_bpo.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth/rbac", () => ({
  canManageUsers: vi.fn(),
  canManageClienteUsers: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/domain/clientes/repository", () => ({ buscarClientePorIdEBpo: vi.fn() }));

const authModule = await import("@/lib/auth/get-current-user");
const rbacModule = await import("@/lib/auth/rbac");
const supabaseModule = await import("@/lib/supabase/server");
const adminModule = await import("@/lib/supabase/admin");
const clientesRepository = await import("@/lib/domain/clientes/repository");

const getCurrentUser = vi.mocked(authModule.getCurrentUser);
const canManageUsers = vi.mocked(rbacModule.canManageUsers);
const canManageClienteUsers = vi.mocked(rbacModule.canManageClienteUsers);
const createClient = vi.mocked(supabaseModule.createClient);
const createAdminClient = vi.mocked(adminModule.createAdminClient);
const buscarClientePorIdEBpo = vi.mocked(clientesRepository.buscarClientePorIdEBpo);

const { GET, POST } = await import("./route");

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

const CLIENTE_ROWS = [
  {
    id: "u3",
    nome: "Cliente Final",
    email: "cliente@empresa.com",
    role: "cliente_final",
    cliente_id: "cliente-1",
    created_at: "2026-03-13T10:00:00Z",
    updated_at: "2026-03-13T10:00:00Z",
  },
];

const INTERNOS_ROWS = [
  {
    id: "u1",
    nome: "Op",
    email: "op@bpo.com",
    role: "operador_bpo",
    cliente_id: null,
    created_at: "2026-03-13T10:00:00Z",
    updated_at: "2026-03-13T10:00:00Z",
  },
  {
    id: "u2",
    nome: "Gestor",
    email: "gestor@bpo.com",
    role: "gestor_bpo",
    cliente_id: null,
    created_at: "2026-03-13T10:00:00Z",
    updated_at: "2026-03-13T10:00:00Z",
  },
];

function makeSelectQueryMock(rows: unknown[]) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    order: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };

  return query;
}

function makeServerClientMock(createdRole: string) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "user-new",
              bpo_id: "bpo-1",
              role: createdRole,
              nome: createdRole === "cliente_final" ? null : "Novo",
              email: "novo@bpo.com",
              cliente_id: "cliente-1",
              created_at: "2026-03-13T10:00:00Z",
            },
            error: null,
          }),
        }),
      }),
    }),
  };
}

function makeAdminClientMock() {
  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-new" } },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/usuarios", () => {
  it("retorna 403 quando gestor tenta listar usuários internos", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageUsers.mockReturnValue(false);
    createClient.mockResolvedValue(
      { from: vi.fn().mockReturnValue(makeSelectQueryMock(INTERNOS_ROWS)) } as never
    );

    const req = new Request("http://localhost/api/admin/usuarios");
    const res = await GET(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("retorna 200 e lista apenas usuário cliente_final para gestor no tipo=cliente", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageClienteUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      { from: vi.fn().mockReturnValue(makeSelectQueryMock(CLIENTE_ROWS)) } as never
    );

    const req = new Request("http://localhost/api/admin/usuarios?tipo=cliente");
    const res = await GET(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].role).toBe("cliente_final");
  });

  it("retorna 200 e lista usuários internos quando admin_bpo", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    canManageUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      { from: vi.fn().mockReturnValue(makeSelectQueryMock(INTERNOS_ROWS)) } as never
    );

    const req = new Request("http://localhost/api/admin/usuarios");
    const res = await GET(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toHaveLength(2);
    expect(json.data.every((u: { role: string }) => u.role !== "cliente_final")).toBe(true);
  });
});

describe("POST /api/admin/usuarios", () => {
  it("retorna 403 quando gestor tenta criar usuário interno", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageUsers.mockReturnValue(false);

    const req = new Request("http://localhost/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Novo",
        email: "novo@bpo.com",
        role: "operador_bpo",
      }),
    });

    const res = await POST(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("retorna 400 quando gestor cria cliente_final para cliente de outro BPO", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageClienteUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      makeServerClientMock("cliente_final") as unknown as Awaited<ReturnType<typeof createClient>>
    );
    createAdminClient.mockReturnValue(
      makeAdminClientMock() as unknown as ReturnType<typeof createAdminClient>
    );
    buscarClientePorIdEBpo.mockResolvedValue({ data: null, error: null } as never);

    const req = new Request("http://localhost/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "novo@bpo.com",
        role: "cliente_final",
        clienteId: "cliente-outro-bpo",
      }),
    });

    const res = await POST(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("CLIENTE_INVALIDO");
  });

  it("gestor_bpo cria usuário cliente_final para cliente do mesmo BPO", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageClienteUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      makeServerClientMock("cliente_final") as unknown as Awaited<ReturnType<typeof createClient>>
    );
    const adminClientMock = makeAdminClientMock();
    createAdminClient.mockReturnValue(
      adminClientMock as unknown as ReturnType<typeof createAdminClient>
    );
    buscarClientePorIdEBpo.mockResolvedValue({
      data: { id: "cliente-1", bpo_id: "bpo-1" },
      error: null,
    } as never);

    const req = new Request("http://localhost/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "novo@bpo.com",
        role: "cliente_final",
        clienteId: "cliente-1",
      }),
    });

    const res = await POST(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.role).toBe("cliente_final");
    expect(adminClientMock.auth.admin.createUser).toHaveBeenCalled();
  });
});
