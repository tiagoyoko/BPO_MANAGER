/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { F360TokenForm } from "./f360-token-form";

const defaultProps = {
  integracaoId: "int-1",
  clienteId: "cliente-1",
  userRole: "gestor_bpo",
  tokenConfigurado: false,
  tokenMascarado: null,
  observacoes: null,
};

describe("F360TokenForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { tokenMascarado: "••••••••", observacoes: null }, error: null }),
      } as Response)
    );
  });

  it("exibe formulário de token quando token não configurado", () => {
    render(<F360TokenForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/token gerado no painel F360/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Salvar configuração/i })).toBeDefined();
  });

  it("exibe modo display com token mascarado quando tokenConfigurado", async () => {
    render(
      <F360TokenForm
        {...defaultProps}
        tokenConfigurado
        tokenMascarado="••••••••abcd"
      />
    );
    await screen.findByText(/••••••••abcd/);
    expect(screen.getByText(/Alterar token/)).toBeDefined();
    expect(screen.getAllByText(/Configuração básica salva/).length).toBeGreaterThan(0);
  });

  it("toggle para edição: Alterar token exibe campo de entrada", async () => {
    render(
      <F360TokenForm
        {...defaultProps}
        tokenConfigurado
        tokenMascarado="••••••••"
      />
    );
    await screen.findByText(/Alterar token/);
    fireEvent.click(screen.getByText(/Alterar token/));
    expect(screen.getByPlaceholderText(/token gerado no painel F360/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Salvar configuração/i })).toBeDefined();
  });

  it("validação token vazio: exibe erro e não chama API", async () => {
    const fetchMock = vi.mocked(fetch);
    render(<F360TokenForm {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Salvar configuração/i }));
    expect(screen.getByText(/Token F360 é obrigatório/)).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submit com sucesso: chama PUT e exibe toast", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            integracao: {
              tokenConfigurado: true,
              tokenMascarado: "••••••••",
              observacoes: null,
            },
          },
          error: null,
        }),
    } as Response);

    render(<F360TokenForm {...defaultProps} />);
    const input = screen.getByPlaceholderText(/token gerado no painel F360/i);
    fireEvent.change(input, { target: { value: "meu-token" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar configuração/i }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toMatch(/Configuração básica salva/);
    expect(status.textContent).toMatch(/Integração técnica pendente/);
    expect(fetch).toHaveBeenCalledWith(
      "/api/clientes/cliente-1/erp/f360",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ token: "meu-token", observacoes: null }),
      })
    );
  });

  it("tratamento de erro: exibe toast de erro quando API falha", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: "CRYPTO_ERROR", message: "Erro ao salvar." },
        }),
    } as Response);

    render(<F360TokenForm {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/token gerado no painel F360/i), {
      target: { value: "token" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar configuração/i }));

    await screen.findByRole("status");
    expect(screen.getByText("Erro ao salvar")).toBeDefined();
  });

  it("modo readonly para operador_bpo: não exibe botão Alterar token nem Salvar", async () => {
    render(
      <F360TokenForm
        {...defaultProps}
        userRole="operador_bpo"
        tokenConfigurado
        tokenMascarado="••••••••"
      />
    );
    await screen.findByText(/••••••••/);
    expect(screen.queryByText(/Alterar token/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Salvar configuração/i })).toBeNull();
  });

  it("exibe observações quando preenchidas", async () => {
    render(
      <F360TokenForm
        {...defaultProps}
        tokenConfigurado
        tokenMascarado="••••••••"
        observacoes="Ambiente homologação"
      />
    );
    await screen.findByText(/Ambiente homologação/);
  });
});
