/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SolicitacoesList } from "./solicitacoes-list";

describe("SolicitacoesList", () => {
  it("renderiza colunas e valores formatados da solicitação", () => {
    render(
      <SolicitacoesList
        solicitacoes={[
          {
            id: "12345678-abcd",
            clienteId: "cliente-1",
            clienteNome: "Cliente A",
            titulo: "NF pendente",
            descricao: null,
            tipo: "documento_faltando",
            prioridade: "alta",
            tarefaId: null,
            status: "aberta",
            createdAt: "2026-03-14T10:00:00Z",
            updatedAt: "2026-03-14T10:00:00Z",
            criadoPorId: "user-1",
            origem: "interno",
          },
        ]}
        total={1}
        page={1}
        limit={20}
        onPageChange={() => undefined}
      />
    );

    expect(screen.getByText("Identificador")).toBeDefined();
    expect(screen.getByText("Cliente")).toBeDefined();
    expect(screen.getByText("NF pendente")).toBeDefined();
    expect(screen.getByText("Documento faltando")).toBeDefined();
    expect(screen.getByText("Alta")).toBeDefined();
    expect(screen.getByText("Aberta")).toBeDefined();
    expect(screen.getByText("14/03/2026")).toBeDefined();
  });
});
