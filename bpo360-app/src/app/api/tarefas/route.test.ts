/**
 * Story 2.3: Testes GET /api/tarefas — listar tarefas com filtros e isolamento BPO.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

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
  email: "g@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const TAREFAS_ROWS = [
  {
    id: "t1",
    titulo: "Tarefa 1",
    data_vencimento: "2026-03-15",
    status: "a_fazer",
    prioridade: "alta",
    responsavel_id: "u1",
    cliente_id: "c1",
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
  return { from, select };
}

describe("GET /api/tarefas", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/tarefas"));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error?.code).toBe("UNAUTHORIZED");
  });

  it("retorna 403 quando papel é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      ...GESTOR,
      role: "cliente_final" as const,
      clienteId: "c1",
    });
    const res = await GET(new NextRequest("http://localhost/api/tarefas"));
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("retorna 200 com tarefas, total, page e limit para gestor", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseForTarefas();
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await GET(
      new NextRequest("http://localhost/api/tarefas?page=1&limit=20")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data).toBeDefined();
    expect(json.data.tarefas).toBeInstanceOf(Array);
    expect(json.data.total).toBe(1);
    expect(json.data.page).toBe(1);
    expect(json.data.limit).toBe(20);
    expect(json.data.tarefas[0].id).toBe("t1");
    expect(json.data.tarefas[0].titulo).toBe("Tarefa 1");
    expect(json.data.tarefas[0].dataVencimento).toBe("2026-03-15");
    expect(json.data.tarefas[0].clienteId).toBe("c1");
    expect(json.data.tarefas[0].rotinaClienteId).toBe("rc1");
  });

  it("aplica filtro clienteId e período quando informados", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseForTarefas();
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    await GET(
      new NextRequest(
        "http://localhost/api/tarefas?clienteId=c1&dataInicio=2026-03-01&dataFim=2026-03-31&status=a_fazer&responsavelId=u1&prioridade=alta"
      )
    );

    expect(supabase.from).toHaveBeenCalledWith("tarefas");
    const selectCall = (supabase as { select: ReturnType<typeof vi.fn> }).select;
    expect(selectCall).toHaveBeenCalled();
  });
});
