import { z } from "zod";

export const PutF360ConfigSchema = z.object({
  token: z.string().min(1, "Token F360 é obrigatório"),
  observacoes: z.string().nullable().optional(),
});

export type PutF360ConfigBody = z.infer<typeof PutF360ConfigSchema>;
