"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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

export function TarefasHojeClient() {
  const [tarefas, setTarefas] = useState<TarefaListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tarefas?dataInicio=hoje&dataFim=hoje&limit=100")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setTarefas(json.data?.tarefas ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const porCliente = useMemo(() => {
    const map: Record<string, TarefaListItem[]> = {};
    for (const t of tarefas) {
      const key = t.clienteId;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return Object.entries(map);
  }, [tarefas]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando tarefas de hoje…</p>;
  }

  if (tarefas.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nenhuma tarefa com vencimento hoje.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {tarefas.length} tarefa(s) com vencimento hoje.
      </p>
      <div className="space-y-4">
        {porCliente.map(([clienteId, items]) => (
          <Card key={clienteId}>
            <CardContent className="p-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                <Link
                  href={`/clientes/${clienteId}/tarefas`}
                  className="hover:text-foreground hover:underline"
                >
                  Cliente {clienteId.slice(0, 8)}…
                </Link>
              </h2>
              <ul className="space-y-2">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
                  >
                    <Link
                      href={`/tarefas/${t.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {t.titulo}
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary">
                        {STATUS_LABEL[t.status] ?? t.status}
                      </Badge>
                      <Badge variant="outline">
                        {PRIORIDADE_LABEL[t.prioridade] ?? t.prioridade}
                      </Badge>
                      {t.responsavelNome && (
                        <span className="text-xs text-muted-foreground">
                          {t.responsavelNome}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
