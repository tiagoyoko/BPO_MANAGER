import { describe, it, expect } from "vitest";
import { rowToIntegracaoErp } from "./repository";
import type { IntegracaoErpRow } from "./types";

describe("integracoes-erp repository", () => {
  it("rowToIntegracaoErp mapeia snake_case para camelCase", () => {
    const row: IntegracaoErpRow = {
      id: "int-1",
      bpo_id: "bpo-1",
      cliente_id: "cliente-1",
      tipo_erp: "F360",
      e_principal: true,
      ativo: true,
      created_at: "2026-03-14T10:00:00Z",
      updated_at: "2026-03-14T10:00:00Z",
      token_f360_encrypted: null,
      observacoes: null,
      token_configurado_em: null,
    };
    const out = rowToIntegracaoErp(row);
    expect(out.id).toBe("int-1");
    expect(out.bpoId).toBe("bpo-1");
    expect(out.clienteId).toBe("cliente-1");
    expect(out.tipoErp).toBe("F360");
    expect(out.ePrincipal).toBe(true);
    expect(out.ativo).toBe(true);
    expect(out.createdAt).toBe(row.created_at);
    expect(out.updatedAt).toBe(row.updated_at);
    expect(out.tokenConfigurado).toBe(false);
    expect(out.tokenMascarado).toBeNull();
    expect(out.observacoes).toBeNull();
    expect(out.tokenConfiguradoEm).toBeNull();
  });

  it("rowToIntegracaoErp mapeia token_f360_encrypted para tokenConfigurado e tokenMascarado", () => {
    const row: IntegracaoErpRow = {
      id: "int-2",
      bpo_id: "bpo-1",
      cliente_id: "cliente-1",
      tipo_erp: "F360",
      e_principal: true,
      ativo: true,
      created_at: "2026-03-14T10:00:00Z",
      updated_at: "2026-03-14T10:00:00Z",
      token_f360_encrypted: "iv:tag:enc",
      observacoes: "Obs",
      token_configurado_em: "2026-03-14T12:00:00Z",
    };
    const out = rowToIntegracaoErp(row);
    expect(out.tokenConfigurado).toBe(true);
    expect(out.tokenMascarado).toBe("••••••••");
    expect(out.observacoes).toBe("Obs");
    expect(out.tokenConfiguradoEm).toBe("2026-03-14T12:00:00Z");
  });
});
