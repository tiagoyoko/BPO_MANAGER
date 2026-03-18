/**
 * PATCH: editar usuário interno (nome, role, cliente_id). Apenas admin_bpo, mesmo BPO.
 * Story 8.2 – AC 3, 4.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageClienteUsers, canManageUsers } from "@/lib/auth/rbac";
import type { PapelBpo } from "@/types/domain";
import { validarClienteDoMesmoBpo } from "../_shared";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PatchUsuarioSchema } from "@/lib/api/schemas/admin-usuarios";

const ROLES_INTERNOS: PapelBpo[] = ["admin_bpo", "gestor_bpo", "operador_bpo"];
const ROLE_CLIENTE_FINAL: PapelBpo = "cliente_final";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ usuarioId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  const { usuarioId } = await params;
  if (!usuarioId) return jsonError({ code: "BAD_REQUEST", message: "usuarioId obrigatório." }, 400);

  const parsed = await parseBody(request, PatchUsuarioSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const supabase = await createClient();

  const { data: existente, error: fetchError } = await supabase
    .from("usuarios")
    .select("id, bpo_id, role")
    .eq("id", usuarioId)
    .single();

  if (fetchError || !existente) return jsonError({ code: "NOT_FOUND", message: "Usuário não encontrado." }, 404);

  if (existente.bpo_id !== user.bpoId) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const isClienteFinal = existente.role === ROLE_CLIENTE_FINAL;
  if (isClienteFinal) {
    if (!canManageClienteUsers(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  } else if (!canManageUsers(user)) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    atualizado_por_id: user.id,
  };
  if (body.nome !== undefined) updates.nome = body.nome.trim() || null;
  if (body.role !== undefined) {
    if (isClienteFinal) {
      if (body.role !== ROLE_CLIENTE_FINAL) {
        return jsonError(
          { code: "ROLE_INVALIDO", message: "Usuário cliente_final não pode ser convertido por esta rota." },
          400
        );
      }
    } else if (!ROLES_INTERNOS.includes(body.role)) {
      return jsonError(
        { code: "ROLE_INVALIDO", message: "role deve ser admin_bpo, gestor_bpo ou operador_bpo." },
        400
      );
    }
    updates.role = body.role;
  }
  if (body.clienteId !== undefined) {
    const clienteId = body.clienteId === "" || body.clienteId == null ? null : body.clienteId;
    if (isClienteFinal && !clienteId) {
      return jsonError(
        { code: "CLIENTE_OBRIGATORIO", message: "clienteId é obrigatório para usuário cliente_final." },
        400
      );
    }
    if (clienteId) {
      const clienteValidation = await validarClienteDoMesmoBpo({
        supabase,
        clienteId,
        bpoId: user.bpoId,
      });
      if (!clienteValidation.ok) {
        return clienteValidation.response;
      }
    }
    updates.cliente_id = clienteId;
  }

  const { data: row, error: updateError } = await supabase
    .from("usuarios")
    .update(updates)
    .eq("id", usuarioId)
    .select()
    .single();

  if (updateError) return jsonError({ code: "DB_ERROR", message: updateError.message }, 500);

  return jsonSuccess({
    id: row.id,
    nome: row.nome,
    email: row.email,
    role: row.role,
    bpoId: row.bpo_id,
    clienteId: row.cliente_id ?? null,
    atualizadoEm: row.updated_at,
  });
}
