"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TarefaListItem } from "@/lib/domain/rotinas/types";

const STATUS_LABEL: Record<string, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
  bloqueada: "Bloqueada",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

type Props = { clienteId: string };

function getHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AreaDeTrabalhoClient({ clienteId }: Props) {
  const [dataHoje] = useState(() => getHoje());
  const [tarefas, setTarefas] = useState<TarefaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ dataInicio: dataHoje, dataFim: dataHoje });
    setLoading(true);
    setErro(null);
    fetch(`/api/clientes/${clienteId}/tarefas?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Não autenticado." : r.status === 403 ? "Acesso negado." : "Falha ao carregar tarefas.");
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          if (json?.error) setErro(json.error?.message ?? "Erro ao carregar tarefas.");
          else setTarefas(json.data?.tarefas ?? []);
        }
      })
      .catch((e) => {
        if (!cancelled) setErro(e instanceof Error ? e.message : "Erro ao carregar tarefas.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clienteId, dataHoje]);

  const tarefasRecorrentes = useMemo(
    () => tarefas.filter((t) => t.rotinaClienteId != null),
    [tarefas]
  );
  const tarefasNaoRecorrentes = useMemo(
    () => tarefas.filter((t) => t.rotinaClienteId == null),
    [tarefas]
  );

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" aria-busy="true">
        Carregando área de trabalho…
      </p>
    );
  }

  if (erro) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {erro}
      </p>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      role="region"
      aria-label="Área de trabalho em três colunas"
    >
      {/* Coluna 1 – Tarefas recorrentes (desktop ≥1024px; empilha em viewport menor) */}
      <section
        aria-label="Tarefas recorrentes"
        className="flex flex-col rounded-lg border border-border bg-card min-h-0"
      >
        <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          Tarefas recorrentes
        </h3>
        <div className="flex-1 overflow-auto p-4">
          {tarefasRecorrentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa recorrente para hoje.</p>
          ) : (
            <ul className="space-y-2">
              {tarefasRecorrentes.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tarefas/${t.id}`}
                    className="text-primary hover:underline font-medium block"
                  >
                    {t.titulo}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{STATUS_LABEL[t.status] ?? t.status}</Badge>
                    <Badge variant="outline">{PRIORIDADE_LABEL[t.prioridade] ?? t.prioridade}</Badge>
                    {t.tipoServico && <Badge variant="outline">{t.tipoServico}</Badge>}
                    <span className="text-muted-foreground">{t.dataVencimento}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Coluna 2 – Checklist / Não recorrentes */}
      <section
        aria-label="Checklist e tarefas não recorrentes"
        className="flex flex-col rounded-lg border border-border bg-card min-h-0"
      >
        <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          Checklist / Não recorrentes
        </h3>
        <div className="flex-1 overflow-auto p-4">
          {tarefasNaoRecorrentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma demanda pontual para hoje.</p>
          ) : (
            <ul className="space-y-2">
              {tarefasNaoRecorrentes.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tarefas/${t.id}`}
                    className="text-primary hover:underline font-medium block"
                  >
                    {t.titulo}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{STATUS_LABEL[t.status] ?? t.status}</Badge>
                    <Badge variant="outline">{PRIORIDADE_LABEL[t.prioridade] ?? t.prioridade}</Badge>
                    {t.responsavelNome && (
                      <span className="text-muted-foreground">{t.responsavelNome}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Coluna 3 – Comunicação (placeholder até EP3) */}
      <section
        aria-label="Comunicação com o cliente"
        className="flex flex-col rounded-lg border border-border bg-muted/30 min-h-0"
      >
        <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          Comunicação com o cliente
        </h3>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Comunicação com o cliente (em construção)
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Solicitações e mensagens em breve (EP3)
          </p>
        </div>
      </section>
    </div>
  );
}
