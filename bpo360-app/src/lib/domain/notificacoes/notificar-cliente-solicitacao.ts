/**
 * Story 3.5: Ponto de extensão para notificar cliente quando solicitação é atualizada
 * (comentário ou mudança de status).
 * Opção A (MVP): não envia e-mail; chama extensão com payload definido para implementação futura.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type TipoEventoNotificacao = "comentario" | "status_alterado";

export type PayloadNotificacaoSolicitacao = {
  clienteId: string;
  solicitacaoId: string;
  tipoEvento: TipoEventoNotificacao;
  destinatarioEmails: string[];
  portalPath: string;
  resumo: string;
};

/** Feature flag: notificações por e-mail ativas globalmente (env). */
export function notificacoesEmailAtivas(): boolean {
  const v = process.env.NOTIFICACOES_EMAIL_ATIVO;
  if (v === "false" || v === "0") return false;
  return true;
}

/**
 * Busca e-mails dos usuários cliente_final vinculados ao cliente_id.
 * Regra: todos com role cliente_final e cliente_id = clienteId (documentado na story).
 */
export async function obterEmailsDestino(
  supabase: SupabaseClient,
  clienteId: string
): Promise<string[]> {
  const { data: rows, error } = await supabase
    .from("usuarios")
    .select("email")
    .eq("cliente_id", clienteId)
    .eq("role", "cliente_final")
    .not("email", "is", null);

  if (error) return [];
  const emails = (rows ?? [])
    .map((r: { email: string | null }) => r.email)
    .filter((e): e is string => typeof e === "string" && e.length > 0);
  return [...new Set(emails)];
}

/**
 * Verifica se o cliente tem notificação por e-mail habilitada.
 * Se não existir linha em cliente_preferencias, considera true (default).
 */
export async function clienteQuerNotificacaoEmail(
  supabase: SupabaseClient,
  clienteId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("cliente_preferencias")
    .select("notificar_por_email")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (error || !data) return true;
  return (data as { notificar_por_email: boolean }).notificar_por_email === true;
}

/**
 * Ponto de extensão: chamado após comentário ou alteração de status em solicitação de origem "cliente".
 * MVP (Opção A): não envia e-mail; apenas log com payload para implementação futura.
 */
export function enviarNotificacaoSolicitacaoAtualizada(
  payload: PayloadNotificacaoSolicitacao
): void {
  if (process.env.NODE_ENV !== "test") {
    console.info("[notificacoes] solicitacao_atualizada", payload);
  }
  // Futuro: enfileirar job ou chamar Edge Function / Resend com payload.destinatarioEmails
}

/**
 * Orquestra: verifica preferências e flag global; se ok, obtém e-mails e chama o ponto de extensão.
 * Chamar após persistir comentário ou atualizar status da solicitação (apenas quando origem === 'cliente').
 */
export async function notificarClienteSolicitacaoAtualizada(
  supabase: SupabaseClient,
  params: {
    clienteId: string;
    solicitacaoId: string;
    tipoEvento: TipoEventoNotificacao;
    origemSolicitacao: string;
  }
): Promise<void> {
  if (params.origemSolicitacao !== "cliente") return;
  if (!notificacoesEmailAtivas()) return;

  const querNotificar = await clienteQuerNotificacaoEmail(supabase, params.clienteId);
  if (!querNotificar) return;

  const destinatarioEmails = await obterEmailsDestino(supabase, params.clienteId);
  if (destinatarioEmails.length === 0) return;

  const portalPath = `/portal/solicitacoes/${params.solicitacaoId}`;
  const resumo =
    params.tipoEvento === "comentario"
      ? `Sua solicitacao #${params.solicitacaoId} recebeu uma nova resposta.`
      : `Sua solicitacao #${params.solicitacaoId} teve o status atualizado.`;

  enviarNotificacaoSolicitacaoAtualizada({
    clienteId: params.clienteId,
    solicitacaoId: params.solicitacaoId,
    tipoEvento: params.tipoEvento,
    destinatarioEmails,
    portalPath,
    resumo,
  });
}
