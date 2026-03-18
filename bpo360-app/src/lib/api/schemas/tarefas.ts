import { z } from "zod";

const STATUS_TAREFA = ["a_fazer", "em_andamento", "concluida", "atrasada", "bloqueada"] as const;

export const PatchTarefaSchema = z.object({
  status: z.enum(STATUS_TAREFA),
});

export const PatchChecklistItemSchema = z.object({
  concluido: z.boolean(),
});

export const AtribuirMassaSchema = z.object({
  tarefaIds: z.array(z.string()).min(1, "tarefaIds é obrigatório e não vazio"),
  responsavelId: z.string().min(1, "responsavelId é obrigatório"),
});

export type PatchTarefaBody = z.infer<typeof PatchTarefaSchema>;
export type PatchChecklistItemBody = z.infer<typeof PatchChecklistItemSchema>;
export type AtribuirMassaBody = z.infer<typeof AtribuirMassaSchema>;
