/**
 * GET: configuração F360 mascarada. PUT: salvar/atualizar token (criptografado).
 * Story 1.6 — nunca expor token em JSON nem em logs.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import {
  buscarIntegracaoF360,
  atualizarConfigF360,
} from "@/lib/domain/integracoes-erp/repository";
import { decrypt, encrypt } from "@/lib/security/crypto";

const COLS =
  "id, bpo_id, cliente_id, tipo_erp, e_principal, ativo, created_at, updated_at, token_f360_encrypted, observacoes, token_configurado_em";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (user.role === "cliente_final") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error: errCliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (errCliente || !cliente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  const { data: row, error } = await supabase
    .from("integracoes_erp")
    .select(COLS)
    .eq("cliente_id", clienteId)
    .eq("bpo_id", user.bpoId)
    .eq("tipo_erp", "F360")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: "Erro ao processar a solicitação." } },
      { status: 500 }
    );
  }
  if (!row) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Integração F360 não configurada." } },
      { status: 404 }
    );
  }

  let tokenMascarado: string | null = null;
  if (row.token_f360_encrypted) {
    try {
      const plain = decrypt(row.token_f360_encrypted);
      tokenMascarado = "••••••••" + plain.slice(-4);
    } catch {
      return NextResponse.json(
        { data: null, error: { code: "CRYPTO_ERROR", message: "Erro ao processar configuração." } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    data: {
      id: row.id,
      tipoErp: row.tipo_erp,
      ativo: row.ativo,
      tokenConfigurado: row.token_f360_encrypted != null,
      tokenMascarado,
      observacoes: row.observacoes ?? null,
      tokenConfiguradoEm: row.token_configurado_em ?? null,
    },
    error: null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!["admin_bpo", "gestor_bpo"].includes(user.role)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error: errCliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (errCliente || !cliente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  const integracao = await buscarIntegracaoF360(supabase, clienteId, user.bpoId);
  if (!integracao) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Integração F360 não configurada. Configure o ERP F360 primeiro." } },
      { status: 404 }
    );
  }

  let body: { token?: string; observacoes?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json(
      { data: null, error: { code: "TOKEN_REQUIRED", message: "Token F360 é obrigatório." } },
      { status: 400 }
    );
  }

  const observacoes = body.observacoes != null ? (typeof body.observacoes === "string" ? body.observacoes : null) : null;

  let tokenEncrypted: string;
  try {
    tokenEncrypted = encrypt(token);
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CRYPTO_ERROR", message: "Erro ao salvar configuração." } },
      { status: 500 }
    );
  }

  try {
    const atualizada = await atualizarConfigF360(
      supabase,
      integracao.id,
      user.bpoId,
      tokenEncrypted,
      observacoes
    );
    return NextResponse.json({ data: { integracao: atualizada }, error: null }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: "Erro ao salvar configuração." } },
      { status: 500 }
    );
  }
}
