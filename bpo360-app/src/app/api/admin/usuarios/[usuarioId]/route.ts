/**
 * PATCH: editar usuário interno (nome, role, cliente_id). Apenas admin_bpo, mesmo BPO.
 * Story 8.2 – AC 3, 4.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageUsers } from "@/lib/auth/rbac";
import type { PapelBpo } from "@/types/domain";
import { validarClienteDoMesmoBpo } from "../_shared";

const ROLES_INTERNOS: PapelBpo[] = ["admin_bpo", "gestor_bpo", "operador_bpo"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ usuarioId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canManageUsers(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { usuarioId } = await params;
  if (!usuarioId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "usuarioId obrigatório." } },
      { status: 400 }
    );
  }

  let body: { nome?: string; role?: PapelBpo; clienteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: existente, error: fetchError } = await supabase
    .from("usuarios")
    .select("id, bpo_id")
    .eq("id", usuarioId)
    .single();

  if (fetchError || !existente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Usuário não encontrado." } },
      { status: 404 }
    );
  }

  if (existente.bpo_id !== user.bpoId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    atualizado_por_id: user.id,
  };
  if (body.nome !== undefined) updates.nome = body.nome.trim();
  if (body.role !== undefined) {
    if (!ROLES_INTERNOS.includes(body.role)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "ROLE_INVALIDO",
            message: "role deve ser admin_bpo, gestor_bpo ou operador_bpo.",
          },
        },
        { status: 400 }
      );
    }
    updates.role = body.role;
  }
  if (body.clienteId !== undefined) {
    const clienteId = body.clienteId === "" || body.clienteId == null ? null : body.clienteId;
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

  if (updateError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      id: row.id,
      nome: row.nome,
      email: row.email,
      role: row.role,
      bpoId: row.bpo_id,
      clienteId: row.cliente_id ?? null,
      atualizadoEm: row.updated_at,
    },
    error: null,
  });
}
