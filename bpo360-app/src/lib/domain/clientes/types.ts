/**
 * Tipos de domínio para Clientes BPO.
 * Story 1.2: cadastro e listagem de clientes.
 */

/** Valores possíveis de status do cliente (apenas 'Ativo' ao criar; demais vêm na 1.3). */
export type StatusCliente = "Ativo" | "Em implantação" | "Pausado" | "Encerrado";

/** Status de configuração ERP por cliente (Story 1.7). */
export type ErpStatusCliente =
  | "nao_configurado"
  | "config_basica_salva"
  | "integracao_ativa";

/** Detalhes de ERP para exibição (tooltip); nunca incluir token. */
export type ErpDetalhesCliente = {
  tipoErp: string;
  ultimaAlteracao: string | null; // ISO 8601 ou null
};

/** Linha da tabela `clientes` retornada pelo Supabase (snake_case). Usar em rowToCliente para tipagem segura. */
export type ClienteRow = {
  id: string;
  bpo_id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string | null;
  responsavel_interno_id: string | null;
  receita_estimada: number | null;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

/** Linha da tabela `clientes` mapeada para camelCase. */
export type Cliente = {
  id: string;
  bpoId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  telefone: string | null;
  responsavelInternoId: string | null;
  receitaEstimada: number | null;
  status: StatusCliente;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Story 1.7: status ERP computado no GET /api/clientes */
  erpStatus?: ErpStatusCliente;
  /** Story 1.7: tipo ERP + data alteração (nunca token) */
  erpDetalhes?: ErpDetalhesCliente | null;
};

/** Payload de entrada para criação de cliente (POST /api/clientes). */
export type NovoClienteInput = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  telefone?: string | null;
  responsavelInternoId?: string | null;
  receitaEstimada?: number | null;
  tags?: string[];
};

/** Payload de entrada para edição de cliente (PATCH /api/clientes/[clienteId]). CNPJ não é aceito. */
export type AtualizarClienteInput = {
  razaoSocial?: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string | null;
  responsavelInternoId?: string | null;
  receitaEstimada?: number | null;
  tags?: string[];
  status?: StatusCliente;
};
