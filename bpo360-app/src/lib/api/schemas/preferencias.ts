import { z } from "zod";

export const PatchPreferenciasSchema = z.object({
  notificarPorEmail: z.boolean().optional(),
});

export type PatchPreferenciasBody = z.infer<typeof PatchPreferenciasSchema>;
