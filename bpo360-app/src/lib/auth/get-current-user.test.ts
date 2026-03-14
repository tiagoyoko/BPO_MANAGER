import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser } from "./get-current-user";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server") as { createClient: ReturnType<typeof vi.fn> };

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("retorna null quando não há usuário Auth", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "not signed in" },
        }),
      },
      from: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("retorna null quando não existe perfil em usuarios", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "uid-1", email: "a@b.co" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "no row" },
            }),
          }),
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("retorna CurrentUser quando há sessão e perfil em usuarios", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "uid-1", email: "a@b.co" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "uid-1",
                bpo_id: "bpo-1",
                role: "admin_bpo",
                cliente_id: null,
                nome: "Admin",
                email: "a@b.co",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await getCurrentUser();
    expect(result).toEqual({
      id: "uid-1",
      email: "a@b.co",
      bpoId: "bpo-1",
      role: "admin_bpo",
      clienteId: null,
      nome: "Admin",
    });
  });
});
