import { z } from "zod";

const PAPEIS_BPO = ["admin_bpo", "gestor_bpo", "operador_bpo", "cliente_final"] as const;

export const PostUsuarioSchema = z
  .object({
    nome: z.string().optional(),
    email: z.string().email("email é obrigatório e deve ser válido"),
    role: z.enum(PAPEIS_BPO),
    clienteId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "cliente_final") return true;
      return data.nome != null && String(data.nome).trim().length > 0;
    },
    { message: "nome é obrigatório para usuários internos", path: ["nome"] }
  )
  .refine(
    (data) => {
      if (data.role !== "cliente_final") return true;
      return data.clienteId != null && data.clienteId.trim().length > 0;
    },
    { message: "clienteId é obrigatório para usuário cliente_final.", path: ["clienteId"] }
  );

export const PatchUsuarioSchema = z.object({
  nome: z.string().optional(),
  role: z.enum(PAPEIS_BPO).optional(),
  clienteId: z.string().uuid().nullable().optional(),
});

export type PostUsuarioBody = z.infer<typeof PostUsuarioSchema>;
export type PatchUsuarioBody = z.infer<typeof PatchUsuarioSchema>;
