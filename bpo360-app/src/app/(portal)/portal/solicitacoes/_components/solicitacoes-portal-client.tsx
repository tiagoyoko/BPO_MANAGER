"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { SolicitacaoListItem } from "@/app/api/solicitacoes/route";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
  fechada: "Fechada",
};

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function SolicitacoesPortalClient() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const fetchSolicitacoes = useCallback(async () => {
    setIsLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/solicitacoes?limit=50");
      const json = await res.json();
      if (!res.ok) {
        setSolicitacoes([]);
        setTotal(0);
        setErro(json.error?.message ?? "Erro ao carregar solicitações.");
        setIsLoading(false);
        return;
      }
      setSolicitacoes(json.data?.solicitacoes ?? []);
      setTotal(json.data?.total ?? 0);
      setIsLoading(false);
    } catch {
      setSolicitacoes([]);
      setTotal(0);
      setErro("Erro ao carregar solicitações.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center" role="status" aria-live="polite">
        Carregando solicitações…
      </p>
    );
  }

  return (
    <div role="region" aria-label="Lista de solicitações">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {total} solicitação(ões)
        </p>
        <Link
          href="/portal/solicitacoes/nova"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nova solicitação
        </Link>
      </div>

      {erro ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
          <p className="text-destructive">{erro}</p>
          <button
            type="button"
            onClick={fetchSolicitacoes}
            className="mt-2 text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!erro && solicitacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhuma solicitação encontrada.
        </p>
      ) : null}

      {!erro && solicitacoes.length > 0 ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {solicitacoes.map((s) => (
            <li key={s.id} className="px-4 py-3 hover:bg-muted/50">
              <Link
                href={`/portal/solicitacoes/${s.id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-ring rounded"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium truncate">{s.titulo}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {STATUS_LABEL[s.status] ?? s.status} · {formatarData(s.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ID: {s.id.slice(0, 8)}…
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
