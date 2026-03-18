/**
 * Story 3.5: POST /api/solicitacoes/[solicitacaoId]/comentarios
 * Adiciona comentário à solicitação; dispara notificação se solicitação de origem "cliente".
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import { notificarClienteSolicitacaoAtualizada } from "@/lib/domain/notificacoes/notificar-cliente-solicitacao";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { PostComentarioSchema } from "@/lib/api/schemas/comentarios";

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
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return jsonError({ code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." }, 400);
  }

  const parsed = await parseBody(request, PostComentarioSchema);
  if (!parsed.success) return parsed.response;
  const texto = parsed.data.texto.trim();

  const supabase = await createClient();

  const { data: sol, error: solError } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, origem")
    .eq("id", solicitacaoId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (solError) return jsonError({ code: "DB_ERROR", message: solError.message }, 500);
  if (!sol) return jsonError({ code: "NOT_FOUND", message: "Solicitação não encontrada." }, 404);

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

  if (insertError) return jsonError({ code: "DB_ERROR", message: insertError.message }, 500);

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

  return jsonSuccess(
    {
      id: row.id,
      solicitacaoId: row.solicitacao_id,
      texto: row.texto,
      autorId: row.autor_id,
      createdAt: row.created_at,
    } satisfies ComentarioResponse,
    201
  );
}
