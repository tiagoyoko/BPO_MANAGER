import { z } from "zod";

const FREQUENCIAS = ["diaria", "semanal", "mensal", "custom"] as const;
const PRIORIDADES = ["baixa", "media", "alta", "urgente"] as const;

export const AplicarRotinaSchema = z.object({
  rotinaModeloId: z.string().uuid(),
  dataInicio: z.string().min(1, "dataInicio é obrigatório"),
  frequencia: z.enum(FREQUENCIAS).optional(),
  responsavelPadraoId: z.string().uuid().nullable().optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
});

export const RotinasEmMassaSchema = z
  .object({
    rotinaClienteIds: z.array(z.string()).min(1, "rotinaClienteIds é obrigatório e não vazio"),
    prioridade: z.enum(PRIORIDADES).optional(),
    responsavelPadraoId: z.string().uuid().nullable().optional(),
    frequencia: z.enum(FREQUENCIAS).optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .refine(
    (data) =>
      data.prioridade !== undefined ||
      data.responsavelPadraoId !== undefined ||
      data.frequencia !== undefined ||
      data.dataInicio !== undefined,
    { message: "Informe ao menos um campo para atualizar (prioridade, responsavelPadraoId, frequencia, dataInicio)." }
  );

export type AplicarRotinaBody = z.infer<typeof AplicarRotinaSchema>;
export type RotinasEmMassaBody = z.infer<typeof RotinasEmMassaSchema>;
