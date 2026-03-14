/**
 * @vitest-environment jsdom
 */
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RotinasClienteSection } from "./rotinas-cliente-section";

describe("RotinasClienteSection", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/clientes/cliente-1/rotinas")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              rotinas: [
                {
                  id: "rotina-1",
                  clienteId: "cliente-1",
                  rotinaModeloId: "modelo-1",
                  dataInicio: "2026-03-14",
                  frequencia: "mensal",
                  responsavelPadraoId: "user-1",
                  prioridade: "media",
                  criadoEm: "2026-03-14T00:00:00.000Z",
                  atualizadoEm: "2026-03-14T00:00:00.000Z",
                },
              ],
            },
            error: null,
          }),
        });
      }

      if (url.includes("/api/modelos")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              modelos: [
                {
                  id: "modelo-1",
                  nome: "Rotina mensal",
                  descricao: null,
                  periodicidade: "mensal",
                  tipoServico: null,
                  qtdItensChecklist: 0,
                  criadoEm: "2026-03-14T00:00:00.000Z",
                },
              ],
            },
            error: null,
          }),
        });
      }

      if (url.includes("/api/admin/usuarios?paraAtribuicao=1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ id: "user-1", nome: "Ana", email: "ana@bpo.com" }],
            error: null,
          }),
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("carrega usuários com o filtro paraAtribuicao para permitir edição em massa por gestor", async () => {
    render(<RotinasClienteSection clienteId="cliente-1" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/usuarios?paraAtribuicao=1");
    });
  });
});
