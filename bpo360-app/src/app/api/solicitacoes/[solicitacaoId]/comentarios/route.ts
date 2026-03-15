/**
 * Story 3.5: POST /api/solicitacoes/[solicitacaoId]/comentarios
 * Adiciona comentário à solicitação; dispara notificação se solicitação de origem "cliente".
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { notificarClienteSolicitacaoAtualizada } from "@/lib/domain/notificacoes/notificar-cliente-solicitacao";

export type PostComentarioBody = {
  texto: string;
};

export type ComentarioResponse = {
  id: string;
  solicitacaoId: string;
  texto: string;
  autorId: string | null;
  createdAt: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAccessModelos(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." } },
      { status: 400 }
    );
  }

  let body: PostComentarioBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const texto = typeof body.texto === "string" ? body.texto.trim() : "";
  if (!texto) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "VALIDATION", message: "texto é obrigatório e não pode ser vazio." },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: sol, error: solError } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, origem")
    .eq("id", solicitacaoId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (solError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: solError.message } },
      { status: 500 }
    );
  }
  if (!sol) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Solicitação não encontrada." } },
      { status: 404 }
    );
  }

  const { data: inserido, error: insertError } = await supabase
    .from("comentarios")
    .insert({
      bpo_id: user.bpoId,
      solicitacao_id: solicitacaoId,
      autor_id: user.id,
      texto,
    })
    .select("id, solicitacao_id, texto, autor_id, created_at")
    .single();

  if (insertError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  const row = inserido as {
    id: string;
    solicitacao_id: string;
    texto: string;
    autor_id: string | null;
    created_at: string;
  };

  if ((sol as { origem: string }).origem === "cliente") {
    await notificarClienteSolicitacaoAtualizada(supabase, {
      clienteId: (sol as { cliente_id: string }).cliente_id,
      solicitacaoId,
      tipoEvento: "comentario",
      origemSolicitacao: (sol as { origem: string }).origem,
    });
  }

  return NextResponse.json(
    {
      data: {
        id: row.id,
        solicitacaoId: row.solicitacao_id,
        texto: row.texto,
        autorId: row.autor_id,
        createdAt: row.created_at,
      } satisfies ComentarioResponse,
      error: null,
    },
    { status: 201 }
  );
}
