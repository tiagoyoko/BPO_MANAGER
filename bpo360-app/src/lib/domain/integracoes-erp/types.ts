/**
 * Tipos de domínio para Integrações ERP.
 * Story 1.5: configurar ERP principal (F360) por cliente.
 * Story 1.6: configuração F360 (token mascarado, observações).
 */

export type ErpTipo = "F360";

export const ERP_TIPOS_VALIDOS: ErpTipo[] = ["F360"];

export type IntegracaoErpRow = {
  id: string;
  bpo_id: string;
  cliente_id: string;
  tipo_erp: string;
  e_principal: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  token_f360_encrypted: string | null;
  observacoes: string | null;
  token_configurado_em: string | null;
};

export type IntegracaoErp = {
  id: string;
  bpoId: string;
  clienteId: string;
  tipoErp: ErpTipo;
  ePrincipal: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  tokenConfigurado: boolean;
  tokenMascarado: string | null;
  observacoes: string | null;
  tokenConfiguradoEm: string | null;
};

export type NovaIntegracaoErpInput = {
  tipoErp: ErpTipo;
  ePrincipal?: boolean;
  ativo?: boolean;
};

export type AtualizarIntegracaoErpInput = {
  ePrincipal?: boolean;
  ativo?: boolean;
};

/** Payload para configuração F360 (token + observações). Story 1.6 */
export type ConfigF360Input = {
  token: string;
  observacoes?: string | null;
};
