/**
 * Story 3.5: GET/PATCH /api/portal/preferencias
 * Cliente_final: lê e atualiza preferências do próprio cliente (cliente_id do usuário).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type PreferenciasPortal = {
  clienteId: string;
  notificarPorEmail: boolean;
};

export type PatchPreferenciasPortalBody = {
  notificarPorEmail?: boolean;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (user.role !== "cliente_final" || !user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso apenas para cliente final." } },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("cliente_preferencias")
    .select("cliente_id, notificar_por_email")
    .eq("cliente_id", user.clienteId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const notificarPorEmail = row
    ? (row as { notificar_por_email: boolean }).notificar_por_email
    : true;

  return NextResponse.json({
    data: {
      clienteId: user.clienteId,
      notificarPorEmail,
    } satisfies PreferenciasPortal,
    error: null,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (user.role !== "cliente_final" || !user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso apenas para cliente final." } },
      { status: 403 }
    );
  }

  let body: PatchPreferenciasPortalBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const notificarPorEmail = body.notificarPorEmail;
  if (notificarPorEmail !== undefined && typeof notificarPorEmail !== "boolean") {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION",
          message: "notificarPorEmail deve ser um booleano.",
        },
      },
      { status: 400 }
    );
  }

  if (notificarPorEmail === undefined) {
    return GET();
  }

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

  if (upsertError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: upsertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { clienteId: user.clienteId, notificarPorEmail } satisfies PreferenciasPortal,
    error: null,
  });
}
