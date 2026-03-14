/**
 * Story 1.7: Cálculo de status e detalhes ERP por cliente.
 * Nunca expõe token_f360_encrypted.
 */

import type { ErpDetalhesCliente, ErpStatusCliente } from "./types";

export type IntegracaoErpRow = {
  id?: string;
  tipo_erp: string;
  ativo: boolean;
  token_configurado_em: string | null;
};

export function computarErpStatus(integracoes: IntegracaoErpRow[] | null | undefined): ErpStatusCliente {
  if (!integracoes || integracoes.length === 0) return "nao_configurado";
  if (integracoes.some((e) => e.ativo)) return "integracao_ativa";
  return "config_basica_salva";
}

export function computarErpDetalhes(
  integracoes: IntegracaoErpRow[] | null | undefined
): ErpDetalhesCliente | null {
  if (!integracoes || integracoes.length === 0) return null;
  const principal = integracoes.find((e) => e.ativo) ?? integracoes[0];
  return {
    tipoErp: principal.tipo_erp,
    ultimaAlteracao: principal.token_configurado_em,
  };
}
