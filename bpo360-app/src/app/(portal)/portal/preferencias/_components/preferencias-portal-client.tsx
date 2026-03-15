"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Preferencias = {
  clienteId: string;
  notificarPorEmail: boolean;
};

export function PreferenciasPortalClient({
  className = "",
}: {
  className?: string;
}) {
  const [preferencias, setPreferencias] = useState<Preferencias | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portal/preferencias");
        const json = await res.json();
        if (cancelled) return;
        if (json.error) {
          setError(json.error.message ?? "Erro ao carregar preferências.");
          return;
        }
        setPreferencias(json.data ?? null);
      } catch {
        if (!cancelled) setError("Falha ao carregar preferências.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (notificarPorEmail: boolean) => {
    if (!preferencias) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/preferencias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificarPorEmail }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error.message ?? "Erro ao salvar.");
        return;
      }
      setPreferencias(json.data ?? preferencias);
    } catch {
      setError("Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (error && !preferencias) {
    return (
      <div className={className}>
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/portal" className="mt-2 inline-block text-sm underline">
          Voltar ao portal
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Notificações</h2>
        <label className="mt-3 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={preferencias?.notificarPorEmail ?? true}
            disabled={saving}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm">
            Receber e-mail quando minha solicitação for respondida ou concluída
          </span>
        </label>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </section>
      <Link
        href="/portal"
        className="mt-4 inline-block text-sm text-muted-foreground underline hover:text-foreground"
      >
        Voltar ao portal
      </Link>
    </div>
  );
}
