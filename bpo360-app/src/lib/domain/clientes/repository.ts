import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type BuscarClientePorCnpjParams = {
  supabase: SupabaseClient;
  bpoId: string;
  cnpj: string;
};

export async function buscarClientePorCnpjEBpo({
  supabase,
  bpoId,
  cnpj,
}: BuscarClientePorCnpjParams) {
  return supabase
    .from("clientes")
    .select("id")
    .eq("bpo_id", bpoId)
    .eq("cnpj", cnpj)
    .maybeSingle();
}

type BuscarClientePorIdEBpoParams = {
  supabase: SupabaseClient;
  clienteId: string;
  bpoId: string;
};

const COLS_CLIENTE =
  "id, bpo_id, cnpj, razao_social, nome_fantasia, email, telefone, responsavel_interno_id, receita_estimada, status, tags, created_at, updated_at";

export async function buscarClientePorIdEBpo({
  supabase,
  clienteId,
  bpoId,
}: BuscarClientePorIdEBpoParams) {
  return supabase
    .from("clientes")
    .select(COLS_CLIENTE)
    .eq("id", clienteId)
    .eq("bpo_id", bpoId)
    .maybeSingle();
}

type BuscarUsuarioPorIdEBpoParams = {
  supabase: SupabaseClient;
  usuarioId: string;
  bpoId: string;
};

export async function buscarUsuarioPorIdEBpo({
  supabase,
  usuarioId,
  bpoId,
}: BuscarUsuarioPorIdEBpoParams) {
  return supabase
    .from("usuarios")
    .select("id")
    .eq("id", usuarioId)
    .eq("bpo_id", bpoId)
    .maybeSingle();
}
