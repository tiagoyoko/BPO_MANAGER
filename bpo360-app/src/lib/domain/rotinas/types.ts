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

// ─── Story 2.2: Rotina por cliente e tarefas ─────────────────────────────────

export const FREQUENCIAS = ["diaria", "semanal", "mensal", "custom"] as const;
export type Frequencia = (typeof FREQUENCIAS)[number];

export const PRIORIDADES = ["baixa", "media", "alta", "urgente"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export const STATUS_TAREFA = ["a_fazer", "em_andamento", "concluida", "atrasada", "bloqueada"] as const;
export type StatusTarefa = (typeof STATUS_TAREFA)[number];

/** Payload POST aplicar modelo a cliente. */
export type AplicarRotinaInput = {
  rotinaModeloId: string;
  dataInicio: string; // YYYY-MM-DD
  frequencia?: Frequencia;
  responsavelPadraoId?: string | null;
  prioridade?: Prioridade;
};

/** Rotina aplicada a um cliente (API). */
export type RotinaCliente = {
  id: string;
  clienteId: string;
  rotinaModeloId: string;
  dataInicio: string;
  frequencia: Frequencia;
  responsavelPadraoId: string | null;
  prioridade: Prioridade;
  criadoEm: string;
  atualizadoEm: string;
};

/** Linha tabela rotinas_cliente (snake_case). */
export type RotinaClienteRow = {
  id: string;
  bpo_id: string;
  cliente_id: string;
  rotina_modelo_id: string;
  data_inicio: string;
  frequencia: string;
  responsavel_padrao_id: string | null;
  prioridade: string;
  created_at: string;
  updated_at: string;
};

// ─── Story 2.3: Listagem e detalhe de tarefas ─────────────────────────────────

/** Item de tarefa na listagem (API). */
export type TarefaListItem = {
  id: string;
  titulo: string;
  dataVencimento: string;
  status: string;
  prioridade: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  clienteId: string;
  rotinaClienteId: string | null;
};

/** Item de checklist no detalhe da tarefa (API). */
export type TarefaChecklistItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  obrigatorio: boolean;
  ordem: number;
  concluido: boolean;
  concluidoPor: string | null;
  concluidoPorNome?: string | null;
  concluidoEm: string | null;
};

export type TarefaHistoricoItem = {
  id: string;
  itemId: string;
  itemTitulo: string;
  acao: "marcar" | "desmarcar";
  usuarioId: string | null;
  usuarioNome: string | null;
  ocorridoEm: string;
};

/** Detalhe de tarefa (API). */
export type TarefaDetalhe = {
  id: string;
  titulo: string;
  dataVencimento: string;
  status: string;
  prioridade: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  clienteId: string;
  rotinaClienteId: string | null;
  criadoEm: string;
  atualizadoEm: string;
  checklist: TarefaChecklistItem[];
  comentarios?: unknown[];
  historico?: TarefaHistoricoItem[];
};
