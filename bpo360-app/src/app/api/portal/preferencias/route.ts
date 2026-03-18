/**
 * Story 3.5: GET/PATCH /api/portal/preferencias
 * Cliente_final: lê e atualiza preferências do próprio cliente (cliente_id do usuário).
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PatchPreferenciasSchema } from "@/lib/api/schemas/preferencias";

export type PreferenciasPortal = {
  clienteId: string;
  notificarPorEmail: boolean;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (user.role !== "cliente_final" || !user.clienteId) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso apenas para cliente final." }, 403);
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("cliente_preferencias")
    .select("cliente_id, notificar_por_email")
    .eq("cliente_id", user.clienteId)
    .maybeSingle();

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);

  const notificarPorEmail = row
    ? (row as { notificar_por_email: boolean }).notificar_por_email
    : true;

  return jsonSuccess({ clienteId: user.clienteId, notificarPorEmail } satisfies PreferenciasPortal);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (user.role !== "cliente_final" || !user.clienteId) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso apenas para cliente final." }, 403);
  }

  const parsed = await parseBody(request, PatchPreferenciasSchema);
  if (!parsed.success) return parsed.response;
  const notificarPorEmail = parsed.data.notificarPorEmail;

  if (notificarPorEmail === undefined) return GET();

  const supabase = await createClient();
  const { error: upsertError } = await supabase
    .from("cliente_preferencias")
    .upsert(
      {
        cliente_id: user.clienteId,
        notificar_por_email: notificarPorEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cliente_id" }
    );

  if (upsertError) return jsonError({ code: "DB_ERROR", message: upsertError.message }, 500);

  return jsonSuccess({ clienteId: user.clienteId, notificarPorEmail } satisfies PreferenciasPortal);
}
