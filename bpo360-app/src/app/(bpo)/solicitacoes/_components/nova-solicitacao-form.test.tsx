/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NovaSolicitacaoForm } from "./nova-solicitacao-form";

describe("NovaSolicitacaoForm", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("carrega tarefas do cliente selecionado e envia POST da solicitação", async () => {
    const onSucesso = vi.fn();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            tarefas: [{ id: "tarefa-1", titulo: "Fechar caixa", dataVencimento: "2026-03-20" }],
          },
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: "sol-1" },
          error: null,
        }),
      });

    render(
      <NovaSolicitacaoForm
        clientes={[{ id: "cliente-1", nomeFantasia: "Cliente A" }]}
        onSucesso={onSucesso}
        onCancelar={() => undefined}
      />
    );

    fireEvent.change(screen.getByLabelText(/cliente/i), {
      target: { value: "cliente-1" },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/clientes/cliente-1/tarefas?limit=50");
    });

    fireEvent.change(screen.getByLabelText(/título/i), {
      target: { value: "  NF de janeiro  " },
    });
    fireEvent.change(screen.getByLabelText(/tipo/i), {
      target: { value: "documento_faltando" },
    });
    fireEvent.change(screen.getByLabelText(/prioridade/i), {
      target: { value: "alta" },
    });
    fireEvent.change(screen.getByLabelText(/vincular à tarefa/i), {
      target: { value: "tarefa-1" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /salvar/i }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [, request] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/solicitacoes",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(typeof request.body === "string" ? request.body : JSON.stringify(request.body));
    expect(body).toMatchObject({
      clienteId: "cliente-1",
      titulo: "NF de janeiro",
      tipo: "documento_faltando",
      prioridade: "alta",
      tarefaId: "tarefa-1",
    });
    expect(typeof body.descricao).toBe("string");
    expect(body.descricao.length).toBeGreaterThanOrEqual(1);
    expect(onSucesso).toHaveBeenCalledTimes(1);
  });
});
