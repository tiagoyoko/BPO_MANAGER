/**
 * Story 2.5: Testes POST /api/tarefas/atribuir-massa.
 * AC: gestor/admin podem; operador 403; responsavelId mesmo BPO; falhas pontuais.
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

const { POST } = await import("./route");

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

function createSupabaseResponsavel(responsavel: { id: string; bpo_id: string; role: string } | null) {
  const single = vi.fn().mockResolvedValue(
    responsavel ? { data: responsavel, error: null } : { data: null, error: { message: "not found" } }
  );
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "usuarios") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single }),
        }),
      };
    }
    if (table === "tarefas") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "t1",
                responsavel_id: "old",
                bpo_id: "bpo-1",
              },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "tarefa_historico") {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    return {};
  });
  return { from };
}

function createSupabaseHistoricoFalha() {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
  const insertHistorico = vi.fn().mockResolvedValue({ error: { message: "historico insert failed" } });
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "usuarios") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "resp-1", bpo_id: "bpo-1", role: "operador_bpo" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "tarefas") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "t1", responsavel_id: "old", bpo_id: "bpo-1" },
              error: null,
            }),
          }),
        }),
        update,
      };
    }
    if (table === "tarefa_historico") {
      return { insert: insertHistorico };
    }
    return {};
  });
  return { from, update, insertHistorico };
}

function createSupabaseTarefaOutroBpo() {
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "usuarios") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "resp-1", bpo_id: "bpo-1", role: "operador_bpo" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "tarefas") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "t1", responsavel_id: null, bpo_id: "bpo-2" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "tarefa_historico") {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    return {};
  });
  return { from };
}

function createSupabaseUpdateOk() {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "usuarios") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "resp-1", bpo_id: "bpo-1", role: "operador_bpo" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "tarefas") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "t1", responsavel_id: "old", bpo_id: "bpo-1" },
              error: null,
            }),
          }),
        }),
        update,
      };
    }
    if (table === "tarefa_historico") {
      return { insert };
    }
    return {};
  });
  return { from, update, insert };
}

beforeEach(() => {
  vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
  vi.mocked(createClient).mockResolvedValue(createSupabaseResponsavel({ id: "resp-1", bpo_id: "bpo-1", role: "operador_bpo" }) as never);
});

describe("POST /api/tarefas/atribuir-massa", () => {
  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 403 quando operador (apenas gestor ou admin podem)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(OPERADOR);
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("gestor pode chamar API com sucesso", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseUpdateOk();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data?.sucesso).toBe(1);
    expect(json.data?.falhas).toEqual([]);
  });

  it("admin pode chamar API (gestor/operador como responsável)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(ADMIN);
    const supabase = createSupabaseUpdateOk();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data?.sucesso).toBe(1);
  });

  it("retorna 400 quando body inválido ou faltando tarefaIds/responsavelId", async () => {
    const req1 = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    const req2 = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: [], responsavelId: "r1" }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("retorna 400 quando responsavelId é de outro BPO", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseResponsavel({ id: "resp-2", bpo_id: "bpo-2", role: "operador_bpo" }) as never
    );
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-2" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message).toMatch(/mesmo BPO/i);
  });

  it("retorna 400 quando responsavelId é admin_bpo (apenas operador ou gestor)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseResponsavel({ id: "resp-admin", bpo_id: "bpo-1", role: "admin_bpo" }) as never
    );
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-admin" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.message).toMatch(/operador ou gestor|não admin/i);
  });

  it("tarefas de outro BPO vão para falhas e não atualiza", async () => {
    vi.mocked(createClient).mockResolvedValue(createSupabaseTarefaOutroBpo() as never);
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data?.sucesso).toBe(0);
    expect(json.data?.falhas).toHaveLength(1);
    expect(json.data?.falhas[0].motivo).toMatch(/outro BPO/i);
  });

  it("falha ao gravar tarefa_historico conta como falha da tarefa e não incrementa sucesso", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(GESTOR);
    const supabase = createSupabaseHistoricoFalha();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    const req = new NextRequest("http://localhost/api/tarefas/atribuir-massa", {
      method: "POST",
      body: JSON.stringify({ tarefaIds: ["t1"], responsavelId: "resp-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data?.sucesso).toBe(0);
    expect(json.data?.falhas).toHaveLength(1);
    expect(json.data?.falhas[0].tarefaId).toBe("t1");
    expect(json.data?.falhas[0].motivo).toMatch(/histórico/i);
  });
});
