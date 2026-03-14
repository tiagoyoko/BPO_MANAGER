/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ClientesFiltros } from "./clientes-filtros";

describe("ClientesFiltros", () => {
  const defaultProps = {
    onFiltrosChange: vi.fn(),
    responsaveis: [],
    tagsDisponiveis: [],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    defaultProps.onFiltrosChange.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("chama onFiltrosChange com filtros iniciais ao montar", () => {
    render(<ClientesFiltros {...defaultProps} />);
    expect(defaultProps.onFiltrosChange).toHaveBeenCalledWith({
      search: "",
      status: "",
      tags: [],
      responsavelInternoId: "",
    });
  });

  it("aplica debounce de 300ms no campo de busca antes de chamar onFiltrosChange", () => {
    render(<ClientesFiltros {...defaultProps} />);
    defaultProps.onFiltrosChange.mockClear();

    const input = screen.getByPlaceholderText("Buscar por nome ou CNPJ");
    fireEvent.change(input, { target: { value: "acme" } });
    expect(defaultProps.onFiltrosChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: "acme" })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(defaultProps.onFiltrosChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: "acme" })
    );
  });

  it("botão Limpar filtros aparece quando há filtros ativos e reseta ao clicar", () => {
    render(<ClientesFiltros {...defaultProps} />);
    defaultProps.onFiltrosChange.mockClear();

    const statusSelect = screen.getByLabelText(/Filtrar por status/i);
    fireEvent.change(statusSelect, { target: { value: "Pausado" } });
    const limparBtn = screen.getByRole("button", { name: /Limpar filtros/i });
    expect(limparBtn).toBeDefined();

    fireEvent.click(limparBtn);
    expect((statusSelect as HTMLSelectElement).value).toBe("");
  });

  it("callback onFiltrosChange é chamado ao mudar status", () => {
    render(<ClientesFiltros {...defaultProps} />);
    defaultProps.onFiltrosChange.mockClear();

    fireEvent.change(screen.getByLabelText(/Filtrar por status/i), {
      target: { value: "Ativo" },
    });
    expect(defaultProps.onFiltrosChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Ativo" })
    );
  });

  it("renderiza filtro de tags e propaga a tag selecionada", () => {
    render(
      <ClientesFiltros
        {...defaultProps}
        tagsDisponiveis={["Financeiro", "Industria"]}
      />
    );
    defaultProps.onFiltrosChange.mockClear();

    fireEvent.change(screen.getByLabelText(/Filtrar por tag/i), {
      target: { value: "Financeiro" },
    });

    expect(defaultProps.onFiltrosChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ["Financeiro"] })
    );
  });
});
