/**
 * GET: lista usuários internos do BPO (exclui cliente_final).
 * POST: cria usuário interno (Auth + usuarios). Apenas admin_bpo.
 * Story 8.2 – AC 1, 2, 4.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageClienteUsers, canManageUsers } from "@/lib/auth/rbac";
import type { PapelBpo } from "@/types/domain";
import { validarClienteDoMesmoBpo } from "./_shared";

const ROLES_INTERNOS: PapelBpo[] = ["admin_bpo", "gestor_bpo", "operador_bpo"];
const ROLE_CLIENTE_FINAL: PapelBpo = "cliente_final";

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

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }

  const requestUrl = new URL(request.url);
  const tipo = requestUrl.searchParams.get("tipo") ?? "interno";
  const clienteId = requestUrl.searchParams.get("clienteId");
  const paraAtribuicao = requestUrl.searchParams.get("paraAtribuicao") === "1";

  if (!["interno", "cliente"].includes(tipo)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "tipo inválido." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const baseQuery = supabase
    .from("usuarios")
    .select("id, nome, email, role, cliente_id, created_at, updated_at")
    .eq("bpo_id", user.bpoId);

  const query =
    tipo === "cliente"
      ? clienteId
        ? baseQuery.eq("role", ROLE_CLIENTE_FINAL).eq("cliente_id", clienteId)
        : baseQuery.eq("role", ROLE_CLIENTE_FINAL)
      : baseQuery.neq("role", ROLE_CLIENTE_FINAL);

  if (tipo === "cliente") {
    if (!canManageClienteUsers(user)) {
      return NextResponse.json(
        { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
        { status: 403 }
      );
    }
  } else {
    if (paraAtribuicao) {
      if (!canManageClienteUsers(user)) {
        return NextResponse.json(
          { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
          { status: 403 }
        );
      }
    } else if (!canManageUsers(user)) {
      return NextResponse.json(
        { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
        { status: 403 }
      );
    }
  }

  const { data, error } = await query.order("nome", { ascending: true });

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
  let body: { nome?: string; email?: string; role?: PapelBpo; clienteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const nome = body.nome?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role;

  if (!email || !role) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CAMPOS_OBRIGATORIOS",
          message: "email e role são obrigatórios.",
        },
      },
      { status: 400 }
    );
  }

  const isClienteFinal = role === ROLE_CLIENTE_FINAL;
  if (!isClienteFinal && !nome) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CAMPOS_OBRIGATORIOS",
          message: "nome é obrigatório para usuários internos.",
        },
      },
      { status: 400 }
    );
  }

  if (isClienteFinal) {
    if (!canManageClienteUsers(user)) {
      return NextResponse.json(
        { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
        { status: 403 }
      );
    }
  } else {
    if (!canManageUsers(user)) {
      return NextResponse.json(
        { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
        { status: 403 }
      );
    }

    if (!ROLES_INTERNOS.includes(role)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "ROLE_INVALIDO",
            message: "role deve ser admin_bpo, gestor_bpo, operador_bpo ou cliente_final.",
          },
        },
        { status: 400 }
      );
    }
  }

  const adminClient = createAdminClient();
  const serverClient = await createClient();

  if (isClienteFinal && !body.clienteId?.trim()) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CLIENTE_OBRIGATORIO",
          message: "clienteId é obrigatório para usuário cliente_final.",
        },
      },
      { status: 400 }
    );
  }

  if ((role === "operador_bpo" || isClienteFinal) && body.clienteId) {
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
    email,
    email_confirm: true,
    user_metadata: { nome: nome || null },
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
    nome: nome || null,
    email,
    cliente_id:
      role === "operador_bpo" || role === ROLE_CLIENTE_FINAL
        ? (body.clienteId?.trim() ?? null)
        : null,
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
