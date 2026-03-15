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

const USUARIO_BPO = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "operador_bpo" as const,
  email: "op@bpo.com",
  clienteId: null,
  nome: "Op",
};

const USUARIO_CLIENTE = {
  ...USUARIO_BPO,
  role: "cliente_final" as const,
  clienteId: "cliente-1",
};

describe("GET /api/clientes/[clienteId]/preferencias", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(
      new NextRequest("http://localhost/api/clientes/cliente-1/preferencias"),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 200 e notificarPorEmail true quando não existe linha", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_BPO);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle,
      }),
    } as never);

    const res = await GET(
      new NextRequest("http://localhost/api/clientes/cliente-1/preferencias"),
      { params: Promise.resolve({ clienteId: "cliente-1" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.notificarPorEmail).toBe(true);
  });
});

describe("PATCH /api/clientes/[clienteId]/preferencias", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 403 quando cliente_final tenta alterar outro cliente", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_CLIENTE);
    const res = await PATCH(
      new NextRequest("http://localhost/api/clientes/cliente-outro/preferencias", {
        method: "PATCH",
        body: JSON.stringify({ notificarPorEmail: false }),
      }),
      { params: Promise.resolve({ clienteId: "cliente-outro" }) }
    );
    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});
