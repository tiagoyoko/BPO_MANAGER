/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DetalheSolicitacaoPortal } from "./detalhe-solicitacao-portal";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const SOLICITACAO = {
  id: "sol-1",
  titulo: "Enviar documento",
  descricao: "Detalhe da solicitação",
  tipo: "documento_faltando",
  prioridade: "alta",
  status: "aberta",
  createdAt: "2026-03-14T10:00:00.000Z",
  updatedAt: "2026-03-14T10:00:00.000Z",
};

const ANEXOS = [
  {
    id: "doc-1",
    nomeArquivo: "arquivo.pdf",
    tipoMime: "application/pdf",
    tamanho: 1024,
    createdAt: "2026-03-14T10:00:00.000Z",
  },
];

describe("DetalheSolicitacaoPortal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("abre uma nova aba quando a URL assinada é retornada", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          url: "https://example.com/anexo.pdf",
        },
      }),
    } as Response);

    render(<DetalheSolicitacaoPortal solicitacao={SOLICITACAO} anexos={ANEXOS} />);

    fireEvent.click(screen.getByRole("button", { name: /visualizar/i }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        "https://example.com/anexo.pdf",
        "_blank",
        "noopener,noreferrer"
      );
    });
  });

  it("exibe erro quando a URL assinada falha", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          message: "Não foi possível gerar o link.",
        },
      }),
    } as Response);

    render(<DetalheSolicitacaoPortal solicitacao={SOLICITACAO} anexos={ANEXOS} />);

    fireEvent.click(screen.getByRole("button", { name: /visualizar/i }));

    expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível gerar o link.");
    expect(window.open).not.toHaveBeenCalled();
  });
});
