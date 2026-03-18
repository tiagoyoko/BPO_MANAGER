import { z } from "zod";

const STATUS_CLIENTE = ["Ativo", "Em implantação", "Pausado", "Encerrado"] as const;

export const NovoClienteSchema = z.object({
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  razaoSocial: z.string().min(1, "Razão social é obrigatória"),
  nomeFantasia: z.string().min(1, "Nome fantasia é obrigatório"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().nullable().optional(),
  responsavelInternoId: z.string().nullable().optional(),
  receitaEstimada: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const AtualizarClienteSchema = z
  .object({
    razaoSocial: z.string().optional(),
    nomeFantasia: z.string().optional(),
    email: z.string().email().optional(),
    telefone: z.string().nullable().optional(),
    responsavelInternoId: z.string().nullable().optional(),
    receitaEstimada: z.number().nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(STATUS_CLIENTE).optional(),
  })
  .strict(); // rejeita cnpj e outros campos não permitidos

export type NovoClienteInput = z.infer<typeof NovoClienteSchema>;
export type AtualizarClienteInput = z.infer<typeof AtualizarClienteSchema>;
