/**
 * Story 2.3: Testes GET /api/clientes/[clienteId]/tarefas — listar tarefas do cliente.
 * Evidência: filtros aplicados; cliente_final só acessa próprio cliente; 404 quando cliente não encontrado.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/domain/clientes/repository", () => ({
  buscarClientePorIdEBpo: vi.fn(),
}));

const { getCurrentUser } = await import("@/lib/auth/get-current-user") as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = await import("@/lib/supabase/server") as {
  createClient: ReturnType<typeof vi.fn>;
};
const { buscarClientePorIdEBpo } = await import("@/lib/domain/clientes/repository") as unknown as {
  buscarClientePorIdEBpo: ReturnType<typeof vi.fn>;
};

const { GET } = await import("./route");

const GESTOR = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "g@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const CLIENTE_FINAL = {
  ...GESTOR,
  role: "cliente_final" as const,
  clienteId: "cliente-1",
};

const TAREFAS_ROWS = [
  {
    id: "t1",
    titulo: "Tarefa 1",
    data_vencimento: "2026-03-15",
    status: "a_fazer",
    prioridade: "alta",
    responsavel_id: "u1",
    cliente_id: "cliente-1",
    rotina_cliente_id: "rc1",
  },
];

function createSupabaseForTarefas(tarefas: unknown[] = TAREFAS_ROWS, total = 1) {
  const range = vi.fn().mockResolvedValue({
    data: tarefas,
    error: null,
    count: total,
  });
  const order = vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ range }) });
  const chain = {
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order,
  };
  const select = vi.fn().mockReturnValue(chain);
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "usuarios") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: "u1", nome: "Operador" }],
            error: null,
          }),
        }),
      };
    }
    return { select };
  });
  return { from };
}

describe("GET /api/clientes/[clienteId]/tarefas", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
    vi.mocked(buscarClientePorIdEBpo).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new NextRequest("http://localhost/api/clientes/c1/tarefas"),
      { params: Promise.resolve({ clienteId: "c1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error?.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando cliente_final acessa outro cliente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    const res = await GET(
      new NextRequest("http://localhost/api/clientes/outro-cliente/tarefas"),
      { params: Promise.resolve({ clienteId: "outro-cliente" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("retorna 404 quando cliente não encontrado ou outro BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    vi.mocked(buscarClientePorIdEBpo).mockResolvedValue({ data: null, error: null });

    const res = await GET(
      new NextRequest("http://localhost/api/clientes/cliente-1/tarefas"),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.error?.message).toContain("Cliente não encontrado");
  });

  it("retorna 200 com tarefas do cliente para gestor", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    vi.mocked(buscarClientePorIdEBpo).mockResolvedValue({
      data: { id: "cliente-1", bpo_id: "bpo-1" },
      error: null,
    });
    const supabase = createSupabaseForTarefas();
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await GET(
      new NextRequest("http://localhost/api/clientes/cliente-1/tarefas?dataInicio=2026-03-01&dataFim=2026-03-31"),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.tarefas).toHaveLength(1);
    expect(json.data.tarefas[0].clienteId).toBe("cliente-1");
    expect(json.data.total).toBe(1);
  });

  it("retorna 200 quando cliente_final acessa próprio cliente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(CLIENTE_FINAL);
    vi.mocked(buscarClientePorIdEBpo).mockResolvedValue({
      data: { id: "cliente-1", bpo_id: "bpo-1" },
      error: null,
    });
    const supabase = createSupabaseForTarefas();
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await GET(
      new NextRequest("http://localhost/api/clientes/cliente-1/tarefas"),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.tarefas).toBeDefined();
  });
});
