/**
 * Testes de integração/API para GET e POST /api/admin/usuarios.
 * Story 8.2 – Task 6: guard admin_bpo, GET exclui cliente_final.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth/rbac", () => ({ canManageUsers: vi.fn() }));
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/usuarios", () => {
  it("retorna 403 quando papel não é admin_bpo", async () => {
    getCurrentUser.mockResolvedValue(GESTOR);
    canManageUsers.mockReturnValue(false);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
    expect(json.error?.message).toBe("Acesso negado.");
  });

  it("retorna 200 e lista sem cliente_final quando admin_bpo", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    canManageUsers.mockReturnValue(true);
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: INTERNOS_ROWS, error: null }),
    });
    createClient.mockResolvedValue(
      { from: fromMock } as unknown as Awaited<ReturnType<typeof supabaseModule.createClient>>
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toHaveLength(2);
    expect(json.data.every((u: { role: string }) => u.role !== "cliente_final")).toBe(true);
  });
});

describe("POST /api/admin/usuarios", () => {
  function makeServerClientMock() {
    return {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-new",
                bpo_id: "bpo-1",
                role: "operador_bpo",
                nome: "Novo",
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

  it("retorna 403 quando papel não é admin_bpo", async () => {
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
    expect(json.error?.message).toBe("Acesso negado.");
  });

  it("retorna 400 quando operador_bpo recebe clienteId de outro BPO", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    canManageUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      makeServerClientMock() as unknown as Awaited<ReturnType<typeof createClient>>
    );
    createAdminClient.mockReturnValue(
      makeAdminClientMock() as unknown as ReturnType<typeof createAdminClient>
    );
    buscarClientePorIdEBpo.mockResolvedValue({ data: null, error: null } as never);

    const req = new Request("http://localhost/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: "Novo",
        email: "novo@bpo.com",
        role: "operador_bpo",
        clienteId: "cliente-outro-bpo",
      }),
    });

    const res = await POST(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("CLIENTE_INVALIDO");
  });

  it("cria usuário com sucesso quando clienteId pertence ao mesmo BPO", async () => {
    getCurrentUser.mockResolvedValue(ADMIN);
    canManageUsers.mockReturnValue(true);
    createClient.mockResolvedValue(
      makeServerClientMock() as unknown as Awaited<ReturnType<typeof createClient>>
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
        nome: "Novo",
        email: "novo@bpo.com",
        role: "operador_bpo",
        clienteId: "cliente-1",
      }),
    });

    const res = await POST(req as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.error).toBeNull();
    expect(json.data.id).toBe("user-new");
    expect(adminClientMock.auth.admin.createUser).toHaveBeenCalled();
  });
});
