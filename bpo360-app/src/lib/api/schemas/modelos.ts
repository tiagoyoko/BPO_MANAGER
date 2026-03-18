import { z } from "zod";

const PERIODICIDADES = ["diaria", "semanal", "mensal", "custom"] as const;

export const NovoItemChecklistSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().nullable().optional(),
  obrigatorio: z.boolean().optional(),
});

export const NovoRotinaModeloSchema = z.object({
  nome: z.string().min(1, "nome é obrigatório"),
  descricao: z.string().nullable().optional(),
  periodicidade: z.enum(PERIODICIDADES),
  tipoServico: z.string().nullable().optional(),
  itensChecklist: z.array(NovoItemChecklistSchema),
});

export const AtualizarRotinaModeloSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().nullable().optional(),
  periodicidade: z.enum(PERIODICIDADES).optional(),
  tipoServico: z.string().nullable().optional(),
  itensChecklist: z.array(NovoItemChecklistSchema).optional(),
});

export type NovoItemChecklistInput = z.infer<typeof NovoItemChecklistSchema>;
export type NovoRotinaModeloInput = z.infer<typeof NovoRotinaModeloSchema>;
export type AtualizarRotinaModeloInput = z.infer<typeof AtualizarRotinaModeloSchema>;
