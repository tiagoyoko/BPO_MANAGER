/**
 * Repositório de integrações ERP.
 * Story 1.5: configurar ERP principal (F360) por cliente.
 * Story 1.6: atualizarConfigF360, rowToIntegracaoErp com token mascarado.
 */
import type { createClient } from "@/lib/supabase/server";
import type { IntegracaoErp, IntegracaoErpRow } from "./types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const COLS =
  "id, bpo_id, cliente_id, tipo_erp, e_principal, ativo, created_at, updated_at, token_f360_encrypted, observacoes, token_configurado_em";

function mascararToken(tokenEncrypted: string | null): string | null {
  if (!tokenEncrypted) return null;
  return "••••••••";
}

export function rowToIntegracaoErp(row: IntegracaoErpRow): IntegracaoErp {
  return {
    id: row.id,
    bpoId: row.bpo_id,
    clienteId: row.cliente_id,
    tipoErp: row.tipo_erp as IntegracaoErp["tipoErp"],
    ePrincipal: row.e_principal,
    ativo: row.ativo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tokenConfigurado: row.token_f360_encrypted != null,
    tokenMascarado: mascararToken(row.token_f360_encrypted),
    observacoes: row.observacoes ?? null,
    tokenConfiguradoEm: row.token_configurado_em ?? null,
  };
}

export async function buscarIntegracoesPorCliente(
  supabase: SupabaseClient,
  clienteId: string,
  bpoId: string
): Promise<IntegracaoErp[]> {
  const { data, error } = await supabase
    .from("integracoes_erp")
    .select(COLS)
    .eq("cliente_id", clienteId)
    .eq("bpo_id", bpoId)
    .order("tipo_erp");

  if (error) throw error;
  return (data ?? []).map(rowToIntegracaoErp);
}

export async function buscarIntegracaoPrincipal(
  supabase: SupabaseClient,
  clienteId: string,
  bpoId: string
): Promise<IntegracaoErp | null> {
  const { data, error } = await supabase
    .from("integracoes_erp")
    .select(COLS)
    .eq("cliente_id", clienteId)
    .eq("bpo_id", bpoId)
    .eq("e_principal", true)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToIntegracaoErp(data) : null;
}

/** Busca a row bruta da integração F360 (para uso em rotas que precisam de token_f360_encrypted). */
export async function buscarIntegracaoF360Row(
  supabase: SupabaseClient,
  clienteId: string,
  bpoId: string
): Promise<IntegracaoErpRow | null> {
  const { data, error } = await supabase
    .from("integracoes_erp")
    .select(COLS)
    .eq("cliente_id", clienteId)
    .eq("bpo_id", bpoId)
    .eq("tipo_erp", "F360")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Busca integração F360 do cliente (única por cliente no MVP). */
export async function buscarIntegracaoF360(
  supabase: SupabaseClient,
  clienteId: string,
  bpoId: string
): Promise<IntegracaoErp | null> {
  const data = await buscarIntegracaoF360Row(supabase, clienteId, bpoId);
  return data ? rowToIntegracaoErp(data) : null;
}

/**
 * Atualiza configuração F360 (token criptografado e observações).
 * Story 1.6. Retorna a integração com token mascarado (nunca plaintext).
 */
export async function atualizarConfigF360(
  supabase: SupabaseClient,
  integracaoId: string,
  bpoId: string,
  tokenEncrypted: string,
  observacoes: string | null
): Promise<IntegracaoErp> {
  const { data, error } = await supabase
    .from("integracoes_erp")
    .update({
      token_f360_encrypted: tokenEncrypted,
      observacoes,
      token_configurado_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", integracaoId)
    .eq("bpo_id", bpoId)
    .select()
    .single();

  if (error) throw error;
  return rowToIntegracaoErp(data);
}
