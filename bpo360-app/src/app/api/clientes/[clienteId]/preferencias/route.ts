/**
 * Story 3.5: GET/PATCH /api/clientes/[clienteId]/preferencias
 * BPO: leitura e atualização de preferências do cliente.
 * Campos: notificarPorEmail.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos, canAccessCliente } from "@/lib/auth/rbac";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PatchPreferenciasSchema } from "@/lib/api/schemas/preferencias";

export type PreferenciasCliente = {
  clienteId: string;
  notificarPorEmail: boolean;
};

export type PatchPreferenciasBody = {
  notificarPorEmail?: boolean;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user) && user.role !== "cliente_final") {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }

  const { clienteId } = await context.params;
  if (!clienteId) return jsonError({ code: "BAD_REQUEST", message: "clienteId é obrigatório." }, 400);
  if (!canAccessCliente(user, clienteId)) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado a este cliente." }, 403);
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("cliente_preferencias")
    .select("cliente_id, notificar_por_email")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);

  const notificarPorEmail = row
    ? (row as { notificar_por_email: boolean }).notificar_por_email
    : true;

  return jsonSuccess({ clienteId, notificarPorEmail } satisfies PreferenciasCliente);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user) && user.role !== "cliente_final") {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }

  const { clienteId } = await context.params;
  if (!clienteId) return jsonError({ code: "BAD_REQUEST", message: "clienteId é obrigatório." }, 400);
  if (!canAccessCliente(user, clienteId)) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado a este cliente." }, 403);
  }

  const parsed = await parseBody(request, PatchPreferenciasSchema);
  if (!parsed.success) return parsed.response;
  const notificarPorEmail = parsed.data.notificarPorEmail;

  const supabase = await createClient();

  if (notificarPorEmail === undefined) {
    const { data: row, error: getError } = await supabase
      .from("cliente_preferencias")
      .select("cliente_id, notificar_por_email")
      .eq("cliente_id", clienteId)
      .maybeSingle();
    if (getError) return jsonError({ code: "DB_ERROR", message: getError.message }, 500);
    const val = row ? (row as { notificar_por_email: boolean }).notificar_por_email : true;
    return jsonSuccess({ clienteId, notificarPorEmail: val } satisfies PreferenciasCliente);
  }

  const { error: upsertError } = await supabase
    .from("cliente_preferencias")
    .upsert(
      {
        cliente_id: clienteId,
        notificar_por_email: notificarPorEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cliente_id" }
    );

  if (upsertError) return jsonError({ code: "DB_ERROR", message: upsertError.message }, 500);

  return jsonSuccess({ clienteId, notificarPorEmail } satisfies PreferenciasCliente);
}
