/**
 * @vitest-environment jsdom
 * Story 2.7: Vista Área de trabalho — colunas recorrentes vs não recorrentes e acessibilidade.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AreaDeTrabalhoClient } from "./area-de-trabalho-client";

describe("AreaDeTrabalhoClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    const hoje = new Date().toISOString().slice(0, 10);
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.includes("/api/clientes/cliente-1/tarefas") && url.includes("dataInicio=") && url.includes("dataFim=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              tarefas: [
                {
                  id: "t-rec-1",
                  titulo: "Rotina diária",
                  dataVencimento: hoje,
                  status: "a_fazer",
                  prioridade: "media",
                  tipoServico: "Contabilidade",
                  responsavelId: "u1",
                  responsavelNome: "Maria",
                  clienteId: "cliente-1",
                  rotinaClienteId: "rc-1",
                },
                {
                  id: "t-pont-1",
                  titulo: "Onboarding doc",
                  dataVencimento: hoje,
                  status: "em_andamento",
                  prioridade: "alta",
                  tipoServico: null,
                  responsavelId: null,
                  responsavelNome: null,
                  clienteId: "cliente-1",
                  rotinaClienteId: null,
                },
              ],
            },
            error: null,
          }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("separa tarefas recorrentes (coluna 1) e não recorrentes (coluna 2)", async () => {
    render(<AreaDeTrabalhoClient clienteId="cliente-1" />);

    await waitFor(() => {
      expect(screen.getByText("Rotina diária")).toBeTruthy();
      expect(screen.getByText("Onboarding doc")).toBeTruthy();
    });

    const col1 = screen.getByRole("region", { name: "Tarefas recorrentes" });
    const col2 = screen.getByRole("region", { name: "Checklist e tarefas não recorrentes" });
    expect(col1).toBeTruthy();
    expect(col2).toBeTruthy();

    expect(col1.textContent).toContain("Rotina diária");
    expect(col1.textContent).not.toContain("Onboarding doc");
    expect(col2.textContent).toContain("Onboarding doc");
    expect(col2.textContent).not.toContain("Rotina diária");
  });

  it("tem aria-label nas três colunas para acessibilidade", async () => {
    render(<AreaDeTrabalhoClient clienteId="cliente-1" />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Tarefas recorrentes" })).toBeTruthy();
    });

    expect(screen.getByRole("region", { name: "Área de trabalho em três colunas" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Tarefas recorrentes" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Checklist e tarefas não recorrentes" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Comunicação com o cliente" })).toBeTruthy();
  });

  it("exibe placeholder na coluna Comunicação (EP3)", async () => {
    render(<AreaDeTrabalhoClient clienteId="cliente-1" />);

    await waitFor(() => {
      expect(screen.getByText(/em construção/i)).toBeTruthy();
    });
    expect(screen.getByText(/Solicitações e mensagens em breve \(EP3\)/)).toBeTruthy();
  });

  it("exibe mensagem de erro quando o fetch falha", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Falha de rede"));
    render(<AreaDeTrabalhoClient clienteId="cliente-1" />);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("Falha de rede");
    });
  });
});
