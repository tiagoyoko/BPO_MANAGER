/**
 * Story 3.2: GET URL assinada para download/preview de anexo.
 * BPO e cliente_final (só próprio cliente). Expiração curta (ex.: 60s).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";

const BUCKET = "anexos-solicitacoes";
const EXPIRES_IN = 60;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string; anexoId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  const isClienteFinal = user.role === "cliente_final";
  if (!isClienteFinal && !canAccessModelos(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }
  if (isClienteFinal && !user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Cliente não identificado." } },
      { status: 403 }
    );
  }

  const { solicitacaoId, anexoId } = await context.params;
  if (!solicitacaoId || !anexoId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "solicitacaoId e anexoId são obrigatórios." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: sol } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id")
    .eq("id", solicitacaoId)
    .maybeSingle();

  if (!sol) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Solicitação não encontrada." } },
      { status: 404 }
    );
  }
  const solRow = sol as { cliente_id: string };
  if (isClienteFinal && solRow.cliente_id !== user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { data: doc, error: docError } = await supabase
    .from("documentos")
    .select("id, storage_key, solicitacao_id")
    .eq("id", anexoId)
    .eq("solicitacao_id", solicitacaoId)
    .maybeSingle();

  if (docError || !doc) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Anexo não encontrado." } },
      { status: 404 }
    );
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl((doc as { storage_key: string }).storage_key, EXPIRES_IN);

  if (signError) {
    return NextResponse.json(
      { data: null, error: { code: "SIGN_ERROR", message: signError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { url: signed?.signedUrl ?? null, expiresIn: EXPIRES_IN },
    error: null,
  });
}
