/**
 * Story 2.3: Testes GET/PATCH /api/tarefas/[tarefaId] — detalhe e atualização de status.
 * Evidência: GET retorna tarefa com checklist; usuário de outro BPO recebe 404.
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

const { GET, PATCH } = await import("./route");

const GESTOR = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "gestor_bpo" as const,
  email: "g@bpo.com",
  clienteId: null,
  nome: "Gestor",
};

const TAREFA_ROW = {
  id: "tarefa-1",
  titulo: "Conferir conciliação",
  data_vencimento: "2026-03-15",
  status: "a_fazer",
  prioridade: "media",
  responsavel_id: "u1",
  cliente_id: "c1",
  rotina_cliente_id: "rc1",
  created_at: "2026-03-14T10:00:00Z",
  updated_at: "2026-03-14T10:00:00Z",
  bpo_id: "bpo-1",
};

const CHECKLIST_ROWS = [
  {
    id: "ci1",
    titulo: "Item 1",
    descricao: null,
    obrigatorio: true,
    ordem: 0,
    concluido: false,
    concluido_por_id: null,
    concluido_em: null,
  },
];

function createSupabaseForGetTarefa(tarefa: unknown = TAREFA_ROW, checklist: unknown[] = CHECKLIST_ROWS) {
  const single = vi.fn().mockResolvedValue({ data: tarefa, error: null });
  const maybeSingle = vi.fn().mockResolvedValue({ data: tarefa, error: null });
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "tarefa_checklist_itens") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: checklist, error: null }),
          }),
        }),
      };
    }
    if (table === "usuarios") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { nome: "Operador" }, error: null }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      }),
    };
  });
  return { from };
}

function createSupabaseForPatch(updated: unknown = { ...TAREFA_ROW, status: "em_andamento" }) {
  const single = vi.fn().mockResolvedValue({ data: updated, error: null });
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) }),
  });
  const from = vi.fn().mockReturnValue({ update });
  return { from };
}

describe("GET /api/tarefas/[tarefaId]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new NextRequest("http://localhost/api/tarefas/t1"),
      { params: Promise.resolve({ tarefaId: "t1" }) }
    );
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
    const res = await GET(
      new NextRequest("http://localhost/api/tarefas/t1"),
      { params: Promise.resolve({ tarefaId: "t1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("retorna 404 quando tarefa não existe ou é de outro BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseForGetTarefa(null, []);
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await GET(
      new NextRequest("http://localhost/api/tarefas/outra"),
      { params: Promise.resolve({ tarefaId: "outra" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error?.code).toBe("NOT_FOUND");
  });

  it("retorna 200 com tarefa e checklist para gestor do mesmo BPO", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseForGetTarefa();
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await GET(
      new NextRequest("http://localhost/api/tarefas/tarefa-1"),
      { params: Promise.resolve({ tarefaId: "tarefa-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.id).toBe("tarefa-1");
    expect(json.data.titulo).toBe("Conferir conciliação");
    expect(json.data.checklist).toHaveLength(1);
    expect(json.data.checklist[0].titulo).toBe("Item 1");
    expect(json.data.comentarios).toEqual([]);
    expect(json.data.historico).toEqual([]);
  });
});

describe("PATCH /api/tarefas/[tarefaId]", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/t1", {
        method: "PATCH",
        body: JSON.stringify({ status: "em_andamento" }),
      }),
      { params: Promise.resolve({ tarefaId: "t1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error?.code).toBe("UNAUTHORIZED");
  });

  it("retorna 400 quando status inválido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/t1", {
        method: "PATCH",
        body: JSON.stringify({ status: "invalido" }),
      }),
      { params: Promise.resolve({ tarefaId: "t1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error?.code).toBe("STATUS_INVALIDO");
  });

  it("retorna 200 e atualiza status da tarefa", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const updated = { ...TAREFA_ROW, status: "em_andamento" };
    const supabase = createSupabaseForPatch(updated);
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const res = await PATCH(
      new NextRequest("http://localhost/api/tarefas/tarefa-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "em_andamento" }),
      }),
      { params: Promise.resolve({ tarefaId: "tarefa-1" }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.error).toBeNull();
    expect(json.data.status).toBe("em_andamento");
  });
});
