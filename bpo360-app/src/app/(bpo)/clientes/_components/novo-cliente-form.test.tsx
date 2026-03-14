/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NovoClienteForm } from "./novo-cliente-form";
import type { Cliente } from "@/lib/domain/clientes/types";

const CLIENTE_EDIT: Cliente = {
  id: "cliente-1",
  bpoId: "bpo-1",
  cnpj: "11222333000181",
  razaoSocial: "Empresa Teste Ltda",
  nomeFantasia: "Empresa Teste",
  email: "contato@empresa.com",
  telefone: null,
  responsavelInternoId: null,
  receitaEstimada: null,
  status: "Ativo",
  tags: [],
  createdAt: "2026-03-13T00:00:00Z",
  updatedAt: "2026-03-13T00:00:00Z",
};

describe("NovoClienteForm", () => {
  it("em modo edição exibe CNPJ como somente leitura", () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    render(
      <NovoClienteForm
        clienteInicial={CLIENTE_EDIT}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
    const cnpjInput = document.getElementById("cnpj") as HTMLInputElement | null;
    expect(cnpjInput).not.toBeNull();
    expect(cnpjInput?.readOnly).toBe(true);
    expect(cnpjInput?.disabled).toBe(true);
  });

  it("em modo edição exibe campo Status com opções", () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    render(
      <NovoClienteForm
        clienteInicial={CLIENTE_EDIT}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    expect(statusSelect).toBeDefined();
    expect((statusSelect as HTMLSelectElement).value).toBe("Ativo");
    expect(screen.getByText("Encerrado")).toBeDefined();
  });

  it("em modo criação não exibe campo Status", () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    render(<NovoClienteForm onSuccess={onSuccess} onCancel={onCancel} />);
    const statusSelect = screen.queryByRole("combobox", { name: /status/i });
    expect(statusSelect).toBeNull();
  });
});
