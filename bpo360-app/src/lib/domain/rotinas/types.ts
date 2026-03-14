/**
 * Tipos de domínio para Modelos de Rotina (Story 2.1).
 * Biblioteca de modelos reutilizáveis com checklists.
 */

export const PERIODICIDADES = ["diaria", "semanal", "mensal", "custom"] as const;
export type Periodicidade = (typeof PERIODICIDADES)[number];

export function isPeriodicidadeValida(value: string): value is Periodicidade {
  return PERIODICIDADES.includes(value as Periodicidade);
}

/** Item do checklist do modelo (camelCase para API). */
export type RotinaModeloChecklistItem = {
  titulo: string;
  descricao?: string | null;
  obrigatorio: boolean;
  ordem?: number; // enviado na criação; servidor pode preencher por índice
};

/** Linha da tabela rotina_modelo_checklist_itens (snake_case). */
export type RotinaModeloChecklistItemRow = {
  id: string;
  rotina_modelo_id: string;
  titulo: string;
  descricao: string | null;
  obrigatorio: boolean;
  ordem: number;
};

/** Modelo de rotina (camelCase para API). */
export type RotinaModelo = {
  id: string;
  nome: string;
  descricao: string | null;
  periodicidade: Periodicidade;
  tipoServico: string | null;
  itensChecklist: RotinaModeloChecklistItem[];
  criadoEm: string;
  atualizadoEm?: string;
};

/** Linha da tabela rotinas_modelo (snake_case). */
export type RotinaModeloRow = {
  id: string;
  bpo_id: string;
  nome: string;
  descricao: string | null;
  periodicidade: string;
  tipo_servico: string | null;
  created_at: string;
  updated_at: string;
  criado_por_id: string | null;
};

/** Item do checklist no payload de criação/atualização (API). */
export type NovoItemChecklistInput = {
  titulo: string;
  descricao?: string | null;
  obrigatorio?: boolean;
};

/** Payload POST /api/modelos. */
export type NovoRotinaModeloInput = {
  nome: string;
  descricao?: string | null;
  periodicidade: Periodicidade;
  tipoServico?: string | null;
  itensChecklist: NovoItemChecklistInput[];
};

/** Payload PATCH /api/modelos/[id]. */
export type AtualizarRotinaModeloInput = {
  nome?: string;
  descricao?: string | null;
  periodicidade?: Periodicidade;
  tipoServico?: string | null;
  itensChecklist?: NovoItemChecklistInput[];
};

/** Resposta de listagem: modelo resumido (sem itens). */
export type RotinaModeloResumo = {
  id: string;
  nome: string;
  descricao: string | null;
  periodicidade: Periodicidade;
  tipoServico: string | null;
  qtdItensChecklist: number;
  criadoEm: string;
};
