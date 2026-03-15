/**
 * Story 3.5: GET/PATCH /api/clientes/[clienteId]/preferencias
 * BPO: leitura e atualização de preferências do cliente.
 * Campos: notificarPorEmail.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos, canAccessCliente } from "@/lib/auth/rbac";

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
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAccessModelos(user) && user.role !== "cliente_final") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { clienteId } = await context.params;
  if (!clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "clienteId é obrigatório." } },
      { status: 400 }
    );
  }
  if (!canAccessCliente(user, clienteId)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado a este cliente." } },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("cliente_preferencias")
    .select("cliente_id, notificar_por_email")
    .eq("cliente_id", clienteId)
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
      clienteId,
      notificarPorEmail,
    } satisfies PreferenciasCliente,
    error: null,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAccessModelos(user) && user.role !== "cliente_final") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { clienteId } = await context.params;
  if (!clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "clienteId é obrigatório." } },
      { status: 400 }
    );
  }
  if (!canAccessCliente(user, clienteId)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado a este cliente." } },
      { status: 403 }
    );
  }

  let body: PatchPreferenciasBody;
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

  const supabase = await createClient();

  if (notificarPorEmail === undefined) {
    const { data: row, error: getError } = await supabase
      .from("cliente_preferencias")
      .select("cliente_id, notificar_por_email")
      .eq("cliente_id", clienteId)
      .maybeSingle();
    if (getError) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: getError.message } },
        { status: 500 }
      );
    }
    const val = row ? (row as { notificar_por_email: boolean }).notificar_por_email : true;
    return NextResponse.json({
      data: { clienteId, notificarPorEmail: val } satisfies PreferenciasCliente,
      error: null,
    });
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

  if (upsertError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: upsertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { clienteId, notificarPorEmail } satisfies PreferenciasCliente,
    error: null,
  });
}
