/**
 * PATCH: editar cliente (dados e status). Apenas admin_bpo e gestor_bpo.
 * Story 1.3 — AC 1, 2, 3, 4, 5.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  buscarClientePorIdEBpo,
  buscarUsuarioPorIdEBpo,
} from "@/lib/domain/clientes/repository";
import type { Cliente, ClienteRow } from "@/lib/domain/clientes/types";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { AtualizarClienteSchema } from "@/lib/api/schemas/clientes";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  }
  if (user.role === "operador_bpo" || user.role === "cliente_final") {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado" }, 403);
  }

  const { clienteId } = await params;
  if (!clienteId) {
    return jsonError({ code: "BAD_REQUEST", message: "clienteId obrigatório." }, 400);
  }

  const parsed = await parseBody(request, AtualizarClienteSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const supabase = await createClient();
  const { data: existente, error: fetchError } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (fetchError) {
    console.error("[PATCH /api/clientes/[clienteId]] fetch cliente:", fetchError.message);
    return jsonError(
      { code: "DB_ERROR", message: "Erro ao processar a solicitação. Tente novamente." },
      500
    );
  }

  if (!existente) {
    return jsonError({ code: "NOT_FOUND", message: "Cliente não encontrado." }, 404);
  }

  if (body.responsavelInternoId !== undefined && body.responsavelInternoId !== null && body.responsavelInternoId !== "") {
    const { data: responsavel, error: responsavelError } = await buscarUsuarioPorIdEBpo({
      supabase,
      usuarioId: String(body.responsavelInternoId),
      bpoId: user.bpoId,
    });

    if (responsavelError) {
      console.error(
        "[PATCH /api/clientes/[clienteId]] fetch responsavel:",
        responsavelError.message
      );
      return jsonError(
        { code: "DB_ERROR", message: "Erro ao processar a solicitação. Tente novamente." },
        500
      );
    }

    if (!responsavel) {
      return jsonError(
        { code: "RESPONSAVEL_INVALIDO", message: "responsavelInternoId deve pertencer ao mesmo BPO do usuário autenticado." },
        400
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.razaoSocial !== undefined) updates.razao_social = body.razaoSocial.trim();
  if (body.nomeFantasia !== undefined) updates.nome_fantasia = body.nomeFantasia.trim();
  if (body.email !== undefined) {
    updates.email = body.email.trim().toLowerCase();
  }
  if (body.telefone !== undefined) {
    const t = body.telefone;
    updates.telefone = t === null || t === "" ? null : String(t).trim();
  }
  if (body.responsavelInternoId !== undefined) {
    const r = body.responsavelInternoId;
    updates.responsavel_interno_id = r === null || r === "" ? null : String(r).trim();
  }
  if (body.receitaEstimada !== undefined) {
    updates.receita_estimada = body.receitaEstimada;
  }
  if (body.tags !== undefined) {
    updates.tags = body.tags;
  }
  if (body.status !== undefined) updates.status = body.status;
  // updated_at é gerenciado pelo trigger SQL (set_updated_at)

  if (Object.keys(updates).length === 0) {
    return jsonSuccess(rowToCliente(existente));
  }

  const { data: atualizado, error: updateError } = await supabase
    .from("clientes")
    .update(updates)
    .eq("id", clienteId)
    .eq("bpo_id", user.bpoId)
    .select(
      "id, bpo_id, cnpj, razao_social, nome_fantasia, email, telefone, responsavel_interno_id, receita_estimada, status, tags, created_at, updated_at"
    )
    .single();

  if (updateError) {
    console.error("[PATCH /api/clientes/[clienteId]] update:", updateError.message);
    return jsonError(
      { code: "DB_ERROR", message: "Erro ao processar a solicitação. Tente novamente." },
      500
    );
  }

  return jsonSuccess(rowToCliente(atualizado));
}

function rowToCliente(row: ClienteRow): Cliente {
  return {
    id: row.id,
    bpoId: row.bpo_id,
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia,
    email: row.email,
    telefone: row.telefone ?? null,
    responsavelInternoId: row.responsavel_interno_id ?? null,
    receitaEstimada: row.receita_estimada ?? null,
    status: row.status as Cliente["status"],
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
