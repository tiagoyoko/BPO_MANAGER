/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErpConfigClient } from "./erp-config-client";
import type { IntegracaoErp } from "@/lib/domain/integracoes-erp/types";

const clienteId = "cliente-1";

const INTEGRACAO_F360: IntegracaoErp = {
  id: "int-1",
  bpoId: "bpo-1",
  clienteId: "cliente-1",
  tipoErp: "F360",
  ePrincipal: true,
  ativo: true,
  createdAt: "2026-03-14T00:00:00Z",
  updatedAt: "2026-03-14T00:00:00Z",
  tokenConfigurado: false,
  tokenMascarado: null,
  observacoes: null,
  tokenConfiguradoEm: null,
};

describe("ErpConfigClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("exibe Nenhum ERP configurado quando integracoes está vazio", () => {
    render(
      <ErpConfigClient
        integracoes={[]}
        clienteId={clienteId}
        userRole="gestor_bpo"
      />
    );
    expect(screen.getByText(/Nenhum ERP configurado/i)).toBeDefined();
  });

  it("exibe botão Configurar F360 quando vazio e gestor_bpo", () => {
    render(
      <ErpConfigClient
        integracoes={[]}
        clienteId={clienteId}
        userRole="gestor_bpo"
      />
    );
    expect(screen.getByRole("button", { name: /Configurar F360/i })).toBeDefined();
  });

  it("não exibe botão Salvar/Configurar quando operador_bpo e sem ERPs", () => {
    render(
      <ErpConfigClient
        integracoes={[]}
        clienteId={clienteId}
        userRole="operador_bpo"
      />
    );
    expect(screen.getByText(/Nenhum ERP configurado/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Configurar F360/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Salvar configuração ERP/i })).toBeNull();
  });

  it("exibe Integração F360 ativa quando já existe F360", () => {
    render(
      <ErpConfigClient
        integracoes={[INTEGRACAO_F360]}
        clienteId={clienteId}
        userRole="gestor_bpo"
      />
    );
    expect(screen.getByText(/Integração F360 ativa/i)).toBeDefined();
    expect(screen.getByText(/Configuração básica salva/i)).toBeDefined();
  });

  it("modo readonly para operador_bpo não exibe botão Salvar quando tem F360", () => {
    render(
      <ErpConfigClient
        integracoes={[INTEGRACAO_F360]}
        clienteId={clienteId}
        userRole="operador_bpo"
      />
    );
    expect(screen.getByText(/Integração F360 ativa/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Salvar configuração ERP/i })).toBeNull();
  });

  it("ao salvar com sucesso exibe toast de sucesso e atualiza estado", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { integracao: INTEGRACAO_F360 },
          error: null,
        }),
    } as Response);

    render(
      <ErpConfigClient
        integracoes={[]}
        clienteId={clienteId}
        userRole="gestor_bpo"
      />
    );

    const btn = screen.getByRole("button", { name: /Configurar F360/i });
    fireEvent.click(btn);

    await screen.findByText(/Configuração ERP salva/i);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `/api/clientes/${clienteId}/erp`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("ao erro na API exibe toast de erro", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: "DB_ERROR", message: "Falha no banco." },
        }),
    } as Response);

    render(
      <ErpConfigClient
        integracoes={[]}
        clienteId={clienteId}
        userRole="admin_bpo"
      />
    );

    const btn = screen.getByRole("button", { name: /Configurar F360/i });
    fireEvent.click(btn);

    await screen.findByText(/Erro ao salvar/i);
  });
});
