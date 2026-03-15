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

const USUARIO_CLIENTE = {
  id: "user-1",
  bpoId: "bpo-1",
  role: "cliente_final" as const,
  email: "cliente@empresa.com",
  clienteId: "cliente-1",
  nome: "Cliente",
};

describe("GET /api/portal/preferencias", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 403 quando não é cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      ...USUARIO_CLIENTE,
      role: "operador_bpo",
      clienteId: null,
    });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(403);
  });

  it("retorna 200 com notificarPorEmail quando cliente_final", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_CLIENTE);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { cliente_id: "cliente-1", notificar_por_email: false },
          error: null,
        }),
      }),
    } as never);

    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.clienteId).toBe("cliente-1");
    expect(json.data.notificarPorEmail).toBe(false);
  });
});

describe("PATCH /api/portal/preferencias", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(createClient).mockReset();
  });

  it("retorna 400 quando notificarPorEmail não é boolean", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USUARIO_CLIENTE);
    const res = await PATCH(
      new NextRequest("http://localhost/api/portal/preferencias", {
        method: "PATCH",
        body: JSON.stringify({ notificarPorEmail: "yes" }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION");
  });
});
