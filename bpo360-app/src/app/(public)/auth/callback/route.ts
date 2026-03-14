import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sanitizeAppPath } from "@/lib/auth/navigation";

/**
 * Route Handler para o Auth callback do Supabase (troca de code por sessão).
 * Usado em fluxos OAuth e magic link com PKCE.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeAppPath(requestUrl.searchParams.get("next"), "/");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL("/auth/error?error=No+code+provided", requestUrl.origin),
  );
}
