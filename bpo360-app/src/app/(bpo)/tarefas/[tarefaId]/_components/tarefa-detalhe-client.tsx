"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { TarefaDetalhe, TarefaChecklistItem } from "@/lib/domain/rotinas/types";

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
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
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

  async function marcarTarefaConcluida() {
    if (!tarefa) return;
    setUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "concluida" }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setTarefa((prev) => (prev ? { ...prev, status: "concluida" } : null));
        setFeedback("Tarefa marcada como concluída.");
      } else {
        setFeedback(json.error?.message ?? "Erro ao concluir.");
      }
    } catch {
      setFeedback("Erro ao concluir.");
    } finally {
      setUpdating(false);
    }
  }

  async function toggleChecklistItem(item: TarefaChecklistItem, novoConcluido: boolean) {
    if (!tarefa) return;
    const tarefaConcluida = tarefa.status === "concluida";
    if (tarefaConcluida) return;
    const desabilitadoObrigatorio = tarefaConcluida && item.obrigatorio && item.concluido;
    if (desabilitadoObrigatorio) return;
    setUpdatingItemId(item.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}/checklist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluido: novoConcluido }),
      });
      const json = await res.json();
      if (res.ok && json.data?.item) {
        const it = json.data.item;
        setTarefa((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            checklist: prev.checklist.map((c) =>
              c.id === item.id
                ? {
                    ...c,
                    concluido: it.concluido,
                    concluidoPor: it.concluidoPor ?? null,
                    concluidoEm: it.concluidoEm ?? null,
                  }
                : c
            ),
          };
        });
      } else {
        setFeedback(json.error?.message ?? "Erro ao atualizar item.");
      }
    } catch {
      setFeedback("Erro ao atualizar item.");
    } finally {
      setUpdatingItemId(null);
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
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 id="checklist-heading" className="text-lg font-medium">
                Checklist
              </h2>
              {tarefa.status !== "concluida" && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={updating}
                  onClick={marcarTarefaConcluida}
                >
                  Marcar tarefa como concluída
                </Button>
              )}
            </div>
            {tarefa.checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item.</p>
            ) : (
              <ul className="space-y-2">
                {tarefa.checklist.map((item) => {
                  const tarefaConcluida = tarefa.status === "concluida";
                  const desabilitarCheckbox = tarefaConcluida || (updatingItemId === item.id);
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Checkbox
                        id={`checklist-${item.id}`}
                        checked={item.concluido}
                        disabled={desabilitarCheckbox}
                        onCheckedChange={(checked) =>
                          toggleChecklistItem(item, checked === true)
                        }
                        aria-label={item.titulo}
                        className="flex-shrink-0 mt-0.5"
                      />
                      <label
                        htmlFor={`checklist-${item.id}`}
                        className={item.concluido ? "text-muted-foreground line-through cursor-pointer" : "cursor-pointer"}
                      >
                        {item.titulo}
                        {item.obrigatorio && (
                          <span className="text-muted-foreground font-normal ml-1">(obrigatório)</span>
                        )}
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
                      </label>
                    </li>
                  );
                })}
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
