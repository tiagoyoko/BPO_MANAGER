import { z } from "zod";

const TIPOS_VALIDOS = ["documento_faltando", "duvida", "ajuste", "outro"] as const;
const PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"] as const;
const STATUS_VALIDOS = ["aberta", "em_andamento", "resolvida", "fechada"] as const;

export const PostSolicitacaoSchema = z.object({
  clienteId: z.string().uuid().optional(), // omitido quando origem é cliente_final
  titulo: z.string().min(1).max(500),
  descricao: z.string().min(1),
  tipo: z.enum(TIPOS_VALIDOS),
  prioridade: z.enum(PRIORIDADES_VALIDAS),
  tarefaId: z.string().uuid().nullable().optional(),
});

export const PatchSolicitacaoSchema = z.object({
  status: z.enum(STATUS_VALIDOS).optional(),
});

export type PostSolicitacaoBody = z.infer<typeof PostSolicitacaoSchema>;
export type PatchSolicitacaoBody = z.infer<typeof PatchSolicitacaoSchema>;
