/**
 * Cliente Supabase com service role (Admin API).
 * USAR APENAS server-side (API routes / Server Actions). NUNCA expor ao browser.
 * Story 8.2 – criação de usuários no Auth e inserção em usuarios.
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para createAdminClient"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
