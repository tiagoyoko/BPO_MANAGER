/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BpoHomeDashboardClient } from "./bpo-home-dashboard-client";
import type { CurrentUser } from "@/types/domain";

vi.mock("@/components/feedback/feedback-toast", () => ({
  FeedbackToast: ({ title, message, open }: { title: string; message?: string; open: boolean }) =>
    open ? (
      <div role="status">
        <span>{title}</span>
        <span>{message}</span>
      </div>
    ) : null,
}));

const USER: CurrentUser = {
  id: "user-1",
  email: "gestor@bpo.com",
  bpoId: "bpo-1",
  role: "gestor_bpo",
  clienteId: null,
  nome: "Gestor",
};

describe("BpoHomeDashboardClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exibe loading e depois renderiza os cards e atalhos", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
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
        },
        error: null,
      }),
    });

    render(<BpoHomeDashboardClient user={USER} />);

    expect(screen.getByText(/carregando resumo da carteira/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /painel da carteira/i })).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard/resumo");
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByRole("link", { name: /carteira de clientes/i }).getAttribute("href")).toBe("/clientes");
    expect(screen.getByRole("link", { name: /integrações/i }).getAttribute("href")).toBe("/integacoes");
  });

  it("exibe mensagem amigável quando a API falha", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: {
          code: "DB_ERROR",
          message: "db offline",
        },
      }),
    });

    render(<BpoHomeDashboardClient user={USER} />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeDefined();
    });

    expect(screen.getByText(/não foi possível carregar o resumo/i)).toBeDefined();
    expect(screen.getByText(/erro ao acessar os dados/i)).toBeDefined();
  });
});
