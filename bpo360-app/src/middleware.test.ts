/**
 * Testes de integração do middleware (Story 8.1).
 * Garante: redirecionamento para /login sem sessão; redirecionamento para / quando papel insuficiente em /admin/*.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

const supabaseSsrModule = await import("@supabase/ssr");
const createServerClient = vi.mocked(supabaseSsrModule.createServerClient);

async function loadMiddleware() {
  const { middleware } = await import("./middleware");
  return middleware;
}

function createMockRequest(pathname: string, origin = "http://localhost:3000") {
  return new NextRequest(`${origin}${pathname}`);
}

describe("middleware", () => {
  beforeEach(() => {
    vi.mocked(createServerClient).mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("permite acesso a rotas públicas sem sessão", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
      from: vi.fn(),
    } as unknown as ReturnType<typeof createServerClient>);

    const middleware = await loadMiddleware();
    const request = createMockRequest("/login");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona para /login com next quando não há sessão em rota protegida", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
      from: vi.fn(),
    } as unknown as ReturnType<typeof createServerClient>);

    const middleware = await loadMiddleware();
    const request = createMockRequest("/clientes");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("next=");
    expect(decodeURIComponent(location ?? "")).toContain("/clientes");
  });

  it("redireciona para / quando sessão existe mas papel não permite /admin/*", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: { user: { id: "user-1" } },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: "gestor_bpo" },
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServerClient>);

    const middleware = await loadMiddleware();
    const request = createMockRequest("/admin/usuarios");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toMatch(/\/$/);
  });

  it("permite acesso a /admin quando sessão tem role admin_bpo", async () => {
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: { user: { id: "admin-1" } },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: "admin_bpo" },
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServerClient>);

    const middleware = await loadMiddleware();
    const request = createMockRequest("/admin/usuarios");
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
