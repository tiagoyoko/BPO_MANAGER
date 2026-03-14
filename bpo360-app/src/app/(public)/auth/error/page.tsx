import Link from "next/link";
import { Suspense } from "react";
import { AuthErrorContent } from "./auth-error-content";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
        <AuthErrorContent />
      </Suspense>
      <Link href="/login" className="text-sm underline underline-offset-4">
        Voltar ao login
      </Link>
    </div>
  );
}
