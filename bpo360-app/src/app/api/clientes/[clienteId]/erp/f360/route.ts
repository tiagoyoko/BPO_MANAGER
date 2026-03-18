/**
 * GET: configuração F360 mascarada. PUT: salvar/atualizar token (criptografado).
 * Story 1.6 — nunca expor token em JSON nem em logs.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import {
  buscarIntegracaoF360Row,
  buscarIntegracaoF360,
  atualizarConfigF360,
} from "@/lib/domain/integracoes-erp/repository";
import { decrypt, encrypt } from "@/lib/security/crypto";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PutF360ConfigSchema } from "@/lib/api/schemas/f360";

function logErroCrypto(contexto: "get" | "put", error: unknown) {
  console.error(`[f360-config:${contexto}] crypto failure`, {
    error: error instanceof Error ? error.message : "unknown",
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (user.role === "cliente_final") return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error: errCliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (errCliente || !cliente) return jsonError({ code: "NOT_FOUND", message: "Cliente não encontrado." }, 404);

  let row: Awaited<ReturnType<typeof buscarIntegracaoF360Row>>;
  try {
    row = await buscarIntegracaoF360Row(supabase, clienteId, user.bpoId);
  } catch {
    return jsonError({ code: "DB_ERROR", message: "Erro ao processar a solicitação." }, 500);
  }
  if (!row) return jsonError({ code: "NOT_FOUND", message: "Integração F360 não configurada." }, 404);

  let tokenMascarado: string | null = null;
  if (row.token_f360_encrypted) {
    try {
      const plain = decrypt(row.token_f360_encrypted);
      tokenMascarado = "••••••••" + plain.slice(-4);
    } catch (error) {
      logErroCrypto("get", error);
      return jsonError({ code: "CRYPTO_ERROR", message: "Erro ao processar configuração." }, 500);
    }
  }

  return jsonSuccess({
    id: row.id,
    tipoErp: row.tipo_erp,
    ativo: row.ativo,
    tokenConfigurado: row.token_f360_encrypted != null,
    tokenMascarado,
    observacoes: row.observacoes ?? null,
    tokenConfiguradoEm: row.token_configurado_em ?? null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!["admin_bpo", "gestor_bpo"].includes(user.role)) {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error: errCliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (errCliente || !cliente) return jsonError({ code: "NOT_FOUND", message: "Cliente não encontrado." }, 404);

  const integracao = await buscarIntegracaoF360(supabase, clienteId, user.bpoId);
  if (!integracao) {
    return jsonError(
      { code: "NOT_FOUND", message: "Integração F360 não configurada. Configure o ERP F360 primeiro." },
      404
    );
  }

  const parsed = await parseBody(request, PutF360ConfigSchema);
  if (!parsed.success) return parsed.response;
  const { token, observacoes } = parsed.data;

  let tokenEncrypted: string;
  try {
    tokenEncrypted = encrypt(token);
  } catch (error) {
    logErroCrypto("put", error);
    return jsonError({ code: "CRYPTO_ERROR", message: "Erro ao salvar configuração." }, 500);
  }

  try {
    const atualizada = await atualizarConfigF360(
      supabase,
      integracao.id,
      user.bpoId,
      tokenEncrypted,
      observacoes ?? null
    );
    const tokenMascaradoComUltimos4 = "••••••••" + token.slice(-4);
    const integracaoResposta = { ...atualizada, tokenMascarado: tokenMascaradoComUltimos4 };
    return jsonSuccess({ integracao: integracaoResposta });
  } catch {
    return jsonError({ code: "DB_ERROR", message: "Erro ao salvar configuração." }, 500);
  }
}
