/**
 * GET: lista usuários internos do BPO (exclui cliente_final).
 * POST: cria usuário interno (Auth + usuarios). Apenas admin_bpo.
 * Story 8.2 – AC 1, 2, 4.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageUsers } from "@/lib/auth/rbac";
import type { PapelBpo } from "@/types/domain";
import { validarClienteDoMesmoBpo } from "./_shared";

const ROLES_INTERNOS: PapelBpo[] = ["admin_bpo", "gestor_bpo", "operador_bpo"];

function rowToUsuario(row: Record<string, unknown>) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    role: row.role,
    clienteId: row.cliente_id ?? null,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  };
}

export async function GET() {
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, role, cliente_id, created_at, updated_at")
    .eq("bpo_id", user.bpoId)
    .neq("role", "cliente_final")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const list = (data ?? []).map(rowToUsuario);
  return NextResponse.json({ data: list, error: null });
}

export async function POST(request: NextRequest) {
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

  let body: { nome: string; email: string; role: PapelBpo; clienteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const { nome, email, role } = body;
  if (!nome?.trim() || !email?.trim() || !role) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CAMPOS_OBRIGATORIOS",
          message: "nome, email e role são obrigatórios.",
        },
      },
      { status: 400 }
    );
  }

  if (!ROLES_INTERNOS.includes(role)) {
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

  const adminClient = createAdminClient();
  const serverClient = await createClient();

  if (role === "operador_bpo" && body.clienteId) {
    const clienteValidation = await validarClienteDoMesmoBpo({
      supabase: serverClient,
      clienteId: body.clienteId,
      bpoId: user.bpoId,
    });
    if (!clienteValidation.ok) {
      return clienteValidation.response;
    }
  }

  const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    email_confirm: true,
    user_metadata: { nome: nome.trim() },
  });

  if (createError || !authUser.user) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "AUTH_ERROR",
          message: createError?.message ?? "Falha ao criar usuário no Auth.",
        },
      },
      { status: 400 }
    );
  }

  const insertPayload = {
    id: authUser.user.id,
    bpo_id: user.bpoId,
    role,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    cliente_id: role === "operador_bpo" && body.clienteId ? body.clienteId : null,
    criado_por_id: user.id,
  };

  const { data: row, error: insertError } = await serverClient
    .from("usuarios")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    try {
      await adminClient.auth.admin.deleteUser(authUser.user.id);
    } catch {
      // best effort rollback
    }
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: {
        id: row.id,
        nome: row.nome,
        email: row.email,
        role: row.role,
        bpoId: row.bpo_id,
        clienteId: row.cliente_id ?? null,
        criadoEm: row.created_at,
      },
      error: null,
    },
    { status: 201 }
  );
}
