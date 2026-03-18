/**
 * GET: listar integrações ERP do cliente. POST: criar/atualizar (upsert).
 * Story 1.5 — AC 2, 3, 4, 5.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import {
  buscarIntegracoesPorCliente,
  rowToIntegracaoErp,
} from "@/lib/domain/integracoes-erp/repository";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PostErpSchema } from "@/lib/api/schemas/erp";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (user.role === "cliente_final") return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error: fetchClienteError } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (fetchClienteError) {
    console.error("[GET /api/clientes/[clienteId]/erp] fetch cliente:", fetchClienteError.message);
    return jsonError({ code: "DB_ERROR", message: "Erro ao processar a solicitação." }, 500);
  }
  if (!cliente) return jsonError({ code: "NOT_FOUND", message: "Cliente não encontrado." }, 404);

  try {
    const integracoes = await buscarIntegracoesPorCliente(
      supabase,
      clienteId,
      user.bpoId
    );
    return jsonSuccess({ integracoes });
  } catch (err) {
    console.error("[GET /api/clientes/[clienteId]/erp]", err);
    return jsonError({ code: "DB_ERROR", message: "Erro ao processar a solicitação." }, 500);
  }
}

export async function POST(
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
  const { data: cliente, error: fetchClienteError } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (fetchClienteError) {
    console.error("[POST /api/clientes/[clienteId]/erp] fetch cliente:", fetchClienteError.message);
    return jsonError({ code: "DB_ERROR", message: "Erro ao processar a solicitação." }, 500);
  }
  if (!cliente) return jsonError({ code: "NOT_FOUND", message: "Cliente não encontrado." }, 404);

  const parsed = await parseBody(request, PostErpSchema);
  if (!parsed.success) return parsed.response;
  const { tipoErp, ePrincipal = true } = parsed.data;

  const { data: existente } = await supabase
    .from("integracoes_erp")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("tipo_erp", tipoErp)
    .maybeSingle();

  const row = {
    bpo_id: user.bpoId,
    cliente_id: clienteId,
    tipo_erp: tipoErp,
    e_principal: ePrincipal,
    ativo: true,
  };

  const { data: upserted, error } = await supabase
    .from("integracoes_erp")
    .upsert(row, { onConflict: "cliente_id,tipo_erp" })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/clientes/[clienteId]/erp] upsert:", error.message);
    return jsonError({ code: "DB_ERROR", message: error.message }, 500);
  }

  const integracao = rowToIntegracaoErp(upserted);
  return jsonSuccess({ integracao }, existente ? 200 : 201);
}
