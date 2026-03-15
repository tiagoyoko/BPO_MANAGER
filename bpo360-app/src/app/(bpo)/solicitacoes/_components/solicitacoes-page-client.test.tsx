/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SolicitacoesPageClient } from "./solicitacoes-page-client";

vi.mock("./solicitacoes-list", () => ({
  SolicitacoesList: ({
    solicitacoes,
  }: {
    solicitacoes: Array<{ id: string; titulo: string }>;
  }) => <div data-testid="solicitacoes-list">{solicitacoes.map((item) => item.titulo).join(",")}</div>,
}));

vi.mock("./nova-solicitacao-form", () => ({
  NovaSolicitacaoForm: ({
    onSucesso,
    onCancelar,
  }: {
    onSucesso: () => void;
    onCancelar: () => void;
  }) => (
    <div>
      <button type="button" onClick={onSucesso}>
        Confirmar criação
      </button>
      <button type="button" onClick={onCancelar}>
        Cancelar formulário
      </button>
    </div>
  ),
}));

describe("SolicitacoesPageClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          solicitacoes: [{ id: "sol-1", titulo: "Primeira solicitação" }],
          total: 1,
          page: 1,
          limit: 20,
        },
        error: null,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recarrega a lista e exibe feedback após criação", async () => {
    render(<SolicitacoesPageClient clientes={[{ id: "cliente-1", nomeFantasia: "Cliente A" }]} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/solicitacoes?page=1&limit=20");
    });

    fireEvent.click(screen.getByRole("button", { name: /\+ nova solicitação/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar criação/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByText("Solicitação criada com sucesso.")).toBeDefined();
  });
});
