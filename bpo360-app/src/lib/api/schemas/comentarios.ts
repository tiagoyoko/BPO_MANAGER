import { z } from "zod";

export const PostComentarioSchema = z.object({
  texto: z.string().min(1, "texto é obrigatório e não pode ser vazio"),
});

export type PostComentarioBody = z.infer<typeof PostComentarioSchema>;
