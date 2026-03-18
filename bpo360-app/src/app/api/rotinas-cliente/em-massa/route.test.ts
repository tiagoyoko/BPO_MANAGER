/**
 * Story 2.6: Testes PATCH /api/rotinas-cliente/em-massa.
 * AC: apenas rotinas do BPO; gestor/admin podem; operador 403; tarefas existentes não alteradas (apenas rotinas_cliente).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/domain/clientes/repository", () => ({
  buscarUsuarioPorIdEBpo: vi.fn(),
}));

const { getCurrentUser } = await import("@/lib/auth/get-current-user") as {
  getCurrentUser: ReturnType<typeof vi.fn>;
};
const { createClient } = await import("@/lib/supabase/server") as {
  createClient: ReturnType<typeof vi.fn>;
};
const { buscarUsuarioPorIdEBpo } = await import("@/lib/domain/clientes/repository") as unknown as {
  buscarUsuarioPorIdEBpo: ReturnType<typeof vi.fn>;
};

const { PATCH } = await import("./route");

const GESTOR = {
  id: "user-gestor",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "g@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const OPERADOR = {
  id: "user-op",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Operador",
};

const ADMIN = {
  id: "user-admin",
  bpoId: "bpo-1",
  role: "admin_bpo" as const,
  email: "a@bpo.com",
  clienteId: null,
  nome: "Admin",
};

function createSupabaseRotinasDoBpo(rotinas: { id: string; bpo_id: string }[]) {
  const select = vi.fn().mockReturnValue({
    in: vi.fn().mockResolvedValue({ data: rotinas, error: null }),
  });
  const update = vi.fn().mockReturnValue({
    in: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: rotinas.map((r) => ({ ...r, prioridade: "alta" })),
          error: null,
        }),
      }),
    }),
  });
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "rotinas_cliente") {
      return { select, update };
    }
    return {};
  });
  return { from, select, update };
}

function createSupabaseRotinaOutroBpo() {
  const select = vi.fn().mockReturnValue({
    in: vi.fn().mockResolvedValue({
      data: [{ id: "rc-1", bpo_id: "bpo-2" }],
      error: null,
    }),
  });
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "rotinas_cliente") return { select };
    return {};
  });
  return { from, select };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
  vi.mocked(buscarUsuarioPorIdEBpo).mockResolvedValue({ data: { id: "resp-1" }, error: null });
  vi.mocked(createClient).mockResolvedValue(
    createSupabaseRotinasDoBpo([{ id: "rc-1", bpo_id: "bpo-1" }]) as never
  );
});

describe("PATCH /api/rotinas-cliente/em-massa", () => {
  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], prioridade: "alta" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("retorna 403 quando operador (apenas gestor ou admin podem)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(OPERADOR);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], prioridade: "alta" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error?.message).toMatch(/gestor ou admin/i);
  });

  it("gestor pode chamar API com sucesso", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseRotinasDoBpo([{ id: "rc-1", bpo_id: "bpo-1" }]);
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], prioridade: "alta" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data?.atualizadas).toBe(1);
    expect(json.data?.rotinas).toHaveLength(1);
    expect(json.error).toBeNull();
  });

  it("admin pode chamar API com sucesso", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(ADMIN);
    const supabase = createSupabaseRotinasDoBpo([{ id: "rc-1", bpo_id: "bpo-1" }]);
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], frequencia: "mensal" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it("retorna 400 quando rotinaClienteIds vazio ou ausente", async () => {
    const req1 = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ prioridade: "alta" }),
    });
    const res1 = await PATCH(req1);
    expect(res1.status).toBe(400);

    const req2 = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: [], prioridade: "alta" }),
    });
    const res2 = await PATCH(req2);
    expect(res2.status).toBe(400);
  });

  it("retorna 400 quando nenhum campo para atualizar", async () => {
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"] }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message).toMatch(/ao menos um campo/i);
  });

  it("retorna 400 quando rotina pertence a outro BPO", async () => {
    vi.mocked(createClient).mockResolvedValue(createSupabaseRotinaOutroBpo() as never);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], prioridade: "alta" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.idsInvalidos).toContain("rc-1");
  });

  it("retorna 400 quando responsavelPadraoId de outro BPO", async () => {
    vi.mocked(buscarUsuarioPorIdEBpo).mockResolvedValue({ data: null, error: null });
    const supabase = createSupabaseRotinasDoBpo([{ id: "rc-1", bpo_id: "bpo-1" }]);
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], responsavelPadraoId: "outro-bpo-user" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message).toMatch(/mesmo BPO/i);
  });

  it("permite limpar responsavelPadraoId quando enviado como null", async () => {
    const supabase = createSupabaseRotinasDoBpo([{ id: "rc-1", bpo_id: "bpo-1" }]);
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], responsavelPadraoId: null }),
    });

    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(buscarUsuarioPorIdEBpo).not.toHaveBeenCalled();
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ responsavel_padrao_id: null })
    );
  });

  it("atualiza apenas rotinas_cliente (não chama update em tarefas)", async () => {
    const supabase = createSupabaseRotinasDoBpo([{ id: "rc-1", bpo_id: "bpo-1" }]);
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/rotinas-cliente/em-massa", {
      method: "PATCH",
      body: JSON.stringify({ rotinaClienteIds: ["rc-1"], prioridade: "alta" }),
    });
    await PATCH(req);
    expect(supabase.from).toHaveBeenCalledWith("rotinas_cliente");
    expect(supabase.from).not.toHaveBeenCalledWith("tarefas");
    expect(supabase.update).toHaveBeenCalled();
  });
});
