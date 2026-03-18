import { z } from "zod";

const ERP_TIPOS = ["F360"] as const;

export const PostErpSchema = z.object({
  tipoErp: z.enum(ERP_TIPOS),
  ePrincipal: z.boolean().optional(),
});

export type PostErpBody = z.infer<typeof PostErpSchema>;
