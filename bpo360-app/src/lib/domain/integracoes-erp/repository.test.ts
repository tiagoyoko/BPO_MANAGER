import { describe, it, expect, vi } from "vitest";
import {
  rowToIntegracaoErp,
  buscarIntegracaoF360Row,
  buscarIntegracaoF360,
  atualizarConfigF360,
} from "./repository";
import type { IntegracaoErpRow } from "./types";

const F360_ROW: IntegracaoErpRow = {
  id: "int-f360",
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

function makeSupabase(selectResult: IntegracaoErpRow | null, updateResult?: IntegracaoErpRow) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: selectResult, error: null });
  const chain = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updateResult ?? selectResult,
              error: null,
            }),
          }),
        }),
      }),
    }),
  };
  return { from: vi.fn().mockReturnValue(chain) };
}

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

  it("buscarIntegracaoF360Row retorna null quando não existe", async () => {
    const supabase = makeSupabase(null) as never;
    const result = await buscarIntegracaoF360Row(supabase, "cliente-1", "bpo-1");
    expect(result).toBeNull();
  });

  it("buscarIntegracaoF360Row retorna a row quando existe", async () => {
    const supabase = makeSupabase(F360_ROW) as never;
    const result = await buscarIntegracaoF360Row(supabase, "cliente-1", "bpo-1");
    expect(result).toEqual(F360_ROW);
  });

  it("buscarIntegracaoF360 retorna IntegracaoErp mapeada ou null", async () => {
    const supabaseNull = makeSupabase(null) as never;
    expect(await buscarIntegracaoF360(supabaseNull, "c", "b")).toBeNull();

    const supabaseWith = makeSupabase(F360_ROW) as never;
    const out = await buscarIntegracaoF360(supabaseWith, "cliente-1", "bpo-1");
    expect(out).not.toBeNull();
    expect(out!.id).toBe(F360_ROW.id);
    expect(out!.tipoErp).toBe("F360");
    expect(out!.tokenConfigurado).toBe(false);
  });

  it("atualizarConfigF360 atualiza e retorna IntegracaoErp", async () => {
    const updatedRow: IntegracaoErpRow = {
      ...F360_ROW,
      token_f360_encrypted: "enc:xxx",
      observacoes: "Obs",
      token_configurado_em: "2026-03-14T14:00:00Z",
      updated_at: "2026-03-14T14:00:00Z",
    };
    const supabase = makeSupabase(F360_ROW, updatedRow) as never;
    const result = await atualizarConfigF360(
      supabase,
      F360_ROW.id,
      "bpo-1",
      "enc:xxx",
      "Obs"
    );
    expect(result.id).toBe(F360_ROW.id);
    expect(result.tokenConfigurado).toBe(true);
    expect(result.tokenMascarado).toBe("••••••••");
    expect(result.observacoes).toBe("Obs");
    expect(result.tokenConfiguradoEm).toBe("2026-03-14T14:00:00Z");
  });
});
