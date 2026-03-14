/**
 * GET: listar integrações ERP do cliente. POST: criar/atualizar (upsert).
 * Story 1.5 — AC 2, 3, 4, 5.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import {
  buscarIntegracoesPorCliente,
  rowToIntegracaoErp,
} from "@/lib/domain/integracoes-erp/repository";
import { ERP_TIPOS_VALIDOS } from "@/lib/domain/integracoes-erp/types";

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
  const { data: cliente, error: fetchClienteError } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (fetchClienteError) {
    console.error("[GET /api/clientes/[clienteId]/erp] fetch cliente:", fetchClienteError.message);
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: "Erro ao processar a solicitação." } },
      { status: 500 }
    );
  }
  if (!cliente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  try {
    const integracoes = await buscarIntegracoesPorCliente(
      supabase,
      clienteId,
      user.bpoId
    );
    return NextResponse.json({
      data: { integracoes },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/clientes/[clienteId]/erp]", err);
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: "Erro ao processar a solicitação." } },
      { status: 500 }
    );
  }
}

export async function POST(
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
  const { data: cliente, error: fetchClienteError } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (fetchClienteError) {
    console.error("[POST /api/clientes/[clienteId]/erp] fetch cliente:", fetchClienteError.message);
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: "Erro ao processar a solicitação." } },
      { status: 500 }
    );
  }
  if (!cliente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  let body: { tipoErp?: string; ePrincipal?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const tipoErp = body.tipoErp;
  const ePrincipal = body.ePrincipal ?? true;

  if (!tipoErp || !ERP_TIPOS_VALIDOS.includes(tipoErp as "F360")) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_ERP_TIPO", message: "Tipo de ERP inválido." } },
      { status: 400 }
    );
  }

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
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const integracao = rowToIntegracaoErp(upserted);
  return NextResponse.json(
    { data: { integracao }, error: null },
    { status: existente ? 200 : 201 }
  );
}
