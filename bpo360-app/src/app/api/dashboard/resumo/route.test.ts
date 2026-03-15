import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { getCurrentUser } = await import("@/lib/auth/get-current-user") as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = await import("@/lib/supabase/server") as {
  createClient: ReturnType<typeof vi.fn>;
};

const { GET } = await import("./route");

const GESTOR = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "gestor@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

function createCountBuilder(count: number, error: { message: string } | null = null) {
  const result = { count, error };
  const secondEq = vi.fn().mockResolvedValue(result);
  const firstEq = vi.fn().mockReturnValue({
    eq: secondEq,
    then: (onFulfilled: (value: typeof result) => unknown) => Promise.resolve(result).then(onFulfilled),
  });

  return {
    eq: firstEq,
  };
}

describe("GET /api/dashboard/resumo", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando o papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-2",
      bpoId: "bpo-1",
      role: "cliente_final" as const,
      email: "cliente@empresa.com",
      clienteId: "cli-1",
      nome: "Cliente",
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("retorna contagens agregadas por status e ERP", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);

    const clientesSelect = vi
      .fn()
      .mockReturnValueOnce(createCountBuilder(12))
      .mockReturnValueOnce(createCountBuilder(7))
      .mockReturnValueOnce(createCountBuilder(2))
      .mockReturnValueOnce(createCountBuilder(2))
      .mockReturnValueOnce(createCountBuilder(1));

    const integracoesSelect = vi
      .fn()
      .mockReturnValueOnce(createCountBuilder(3))
      .mockReturnValueOnce(createCountBuilder(2));

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "clientes") {
          return { select: clientesSelect };
        }

        if (table === "integracoes_erp") {
          return { select: integracoesSelect };
        }

        throw new Error(`Tabela inesperada: ${table}`);
      }),
    } as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toEqual({
      totalClientes: 12,
      clientesPorStatus: {
        ativo: 7,
        emImplantacao: 2,
        pausado: 2,
        encerrado: 1,
      },
      clientesPorErpStatus: {
        naoConfigurado: 7,
        configBasicaSalva: 2,
        integracaoAtiva: 3,
      },
    });
  });

  it("retorna 500 com código amigável quando a consulta falha", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);

    const failingBuilder = {
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: "db offline" },
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "clientes") {
          return {
            select: vi.fn().mockReturnValue(failingBuilder),
          };
        }

        return {
          select: vi.fn().mockReturnValue(createCountBuilder(0)),
        };
      }),
    } as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe("DB_ERROR");
  });
});
