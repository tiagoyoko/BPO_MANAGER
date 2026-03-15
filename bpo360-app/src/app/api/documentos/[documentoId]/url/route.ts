/**
 * Story 3.4: GET URL assinada para download/preview do documento.
 * Verifica permissão via documento (bpo_id/cliente_id) antes de gerar signed URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";

const EXPIRES_IN = 60; // segundos

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ documentoId: string }> }
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

  const { documentoId } = await context.params;
  if (!documentoId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "documentoId é obrigatório." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: doc, error: docError } = await supabase
    .from("documentos")
    .select("id, storage_key, bpo_id, cliente_id")
    .eq("id", documentoId)
    .maybeSingle();

  if (docError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: docError.message } },
      { status: 500 }
    );
  }
  if (!doc) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Documento não encontrado." } },
      { status: 404 }
    );
  }
  const row = doc as { id: string; storage_key: string; bpo_id: string; cliente_id: string };
  if (isClienteFinal && row.cliente_id !== user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado a este documento." } },
      { status: 403 }
    );
  }
  if (!isClienteFinal && row.bpo_id !== user.bpoId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado a este documento." } },
      { status: 403 }
    );
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("anexos-solicitacoes")
    .createSignedUrl(row.storage_key, EXPIRES_IN);

  if (signError) {
    return NextResponse.json(
      { data: null, error: { code: "SIGN_ERROR", message: signError.message } },
      { status: 500 }
    );
  }
  if (!signed?.signedUrl) {
    return NextResponse.json(
      { data: null, error: { code: "SIGN_ERROR", message: "URL assinada não gerada." } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { url: signed.signedUrl, expiresIn: EXPIRES_IN },
    error: null,
  });
}
