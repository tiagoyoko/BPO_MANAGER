"use client";

import { useSearchParams } from "next/navigation";

export function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Erro de autenticação";

  return <p className="text-sm text-muted-foreground">{error}</p>;
}
