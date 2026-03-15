/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SolicitacoesPortalClient } from "./solicitacoes-portal-client";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

describe("SolicitacoesPortalClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exibe botao Nova solicitacao apontando para a rota dedicada", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          total: 0,
          solicitacoes: [],
        },
      }),
    } as Response);

    render(<SolicitacoesPortalClient />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/solicitacoes?limit=50");
    });

    const cta = await screen.findByRole("link", { name: /\+ nova solicitação/i });
    expect(cta.getAttribute("href")).toBe("/portal/solicitacoes/nova");
    expect(screen.getByText("Nenhuma solicitação encontrada.")).toBeDefined();
  });

  it("lista solicitacoes do cliente com link para o detalhe", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          total: 1,
          solicitacoes: [
            {
              id: "sol-1",
              titulo: "Enviar extrato bancário",
              status: "aberta",
              createdAt: "2026-03-14T10:00:00.000Z",
            },
          ],
        },
      }),
    } as Response);

    render(<SolicitacoesPortalClient />);

    expect(await screen.findByText("Enviar extrato bancário")).toBeDefined();
    const detalhe = screen.getByRole("link", { name: /enviar extrato bancário/i });
    expect(detalhe.getAttribute("href")).toBe("/portal/solicitacoes/sol-1");
  });

  it("exibe erro de carregamento sem mascarar como lista vazia", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          message: "Falha ao carregar solicitações.",
        },
      }),
    } as Response);

    render(<SolicitacoesPortalClient />);

    expect((await screen.findByRole("alert")).textContent).toContain("Falha ao carregar solicitações.");
    expect(screen.queryByText("Nenhuma solicitação encontrada.")).toBeNull();
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeDefined();
  });
});
