"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TarefaDetalhe } from "@/lib/domain/rotinas/types";

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

type Props = { tarefaId: string };

export function TarefaDetalheClient({ tarefaId }: Props) {
  const [tarefa, setTarefa] = useState<TarefaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tarefas/${tarefaId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setTarefa(json.data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tarefaId]);

  async function alterarStatus(novoStatus: string) {
    if (!tarefa) return;
    setUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setTarefa((prev) => (prev ? { ...prev, status: json.data.status } : null));
        setFeedback("Status atualizado.");
      } else {
        setFeedback(json.error?.message ?? "Erro ao atualizar.");
      }
    } catch {
      setFeedback("Erro ao atualizar.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!tarefa) {
    return (
      <div>
        <p className="text-muted-foreground">Tarefa não encontrada.</p>
        <Link href="/clientes" className="text-primary hover:underline mt-2 inline-block">
          Voltar aos clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/clientes/${tarefa.clienteId}/tarefas`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tarefas do cliente
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{tarefa.titulo}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Vencimento:{" "}
              {new Date(tarefa.dataVencimento + "T12:00:00").toLocaleDateString("pt-BR")}
              {" · "}
              <Badge variant="secondary">{PRIORIDADE_LABEL[tarefa.prioridade] ?? tarefa.prioridade}</Badge>
              {tarefa.responsavelNome && (
                <span className="ml-2">Responsável: {tarefa.responsavelNome}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Editar status:</span>
            {(["a_fazer", "em_andamento", "concluida", "atrasada"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={tarefa.status === s ? "default" : "outline"}
                size="sm"
                disabled={updating}
                onClick={() => alterarStatus(s)}
              >
                {STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </CardHeader>
        {feedback && (
          <div className="px-6 pb-2">
            <p className="text-sm text-muted-foreground">{feedback}</p>
          </div>
        )}
        <CardContent className="space-y-6">
          <section aria-labelledby="checklist-heading">
            <h2 id="checklist-heading" className="text-lg font-medium mb-2">
              Checklist
            </h2>
            {tarefa.checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item.</p>
            ) : (
              <ul className="space-y-2">
                {tarefa.checklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span
                      className="flex-shrink-0 mt-0.5"
                      aria-hidden
                    >
                      {item.concluido ? "✓" : "○"}
                    </span>
                    <span className={item.concluido ? "text-muted-foreground line-through" : ""}>
                      {item.titulo}
                      {item.descricao && (
                        <span className="block text-muted-foreground text-xs">
                          {item.descricao}
                        </span>
                      )}
                      {item.concluidoEm && (
                        <span className="block text-xs text-muted-foreground">
                          Concluído em{" "}
                          {new Date(item.concluidoEm).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="comentarios-heading">
            <h2 id="comentarios-heading" className="text-lg font-medium mb-2">
              Comentários
            </h2>
            <p className="text-sm text-muted-foreground">Em breve.</p>
          </section>

          <section aria-labelledby="historico-heading">
            <h2 id="historico-heading" className="text-lg font-medium mb-2">
              Histórico de alterações
            </h2>
            {!tarefa.historico?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum registro.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {tarefa.historico.map((h, i) => (
                  <li key={i}>{String(h)}</li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
