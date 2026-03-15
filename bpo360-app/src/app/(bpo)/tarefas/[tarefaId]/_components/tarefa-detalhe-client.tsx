"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentosSection } from "@/components/documentos-section";
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
  const [pendingChecklistItemId, setPendingChecklistItemId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [highlightedMissingIds, setHighlightedMissingIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tarefas/${tarefaId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setTarefa(json.data ?? null);
        setHighlightedMissingIds([]);
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
    if (novoStatus === "concluida") {
      setHighlightedMissingIds(
        tarefa.checklist.filter((item) => item.obrigatorio && !item.concluido).map((item) => item.id)
      );
    }
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setTarefa((prev) => (prev ? { ...prev, status: json.data.status } : null));
        setHighlightedMissingIds([]);
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

  async function toggleChecklistItem(itemId: string, concluido: boolean) {
    if (!tarefa) return;

    setPendingChecklistItemId(itemId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/tarefas/${tarefaId}/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluido }),
      });
      const json = await res.json();

      if (res.ok && json.data?.item) {
        setTarefa((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            checklist: prev.checklist.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    concluido: json.data.item.concluido,
                    concluidoPor: json.data.item.concluidoPor,
                    concluidoPorNome: json.data.item.concluidoPorNome,
                    concluidoEm: json.data.item.concluidoEm,
                  }
                : item
            ),
            historico: [
              {
                id: `${itemId}-${Date.now()}`,
                itemId,
                itemTitulo: prev.checklist.find((item) => item.id === itemId)?.titulo ?? "Item",
                acao: concluido ? "marcar" : "desmarcar",
                usuarioId: json.data.item.concluidoPor ?? prev.historico?.[0]?.usuarioId ?? null,
                usuarioNome:
                  json.data.item.concluidoPorNome ?? (!concluido ? "Você" : prev.historico?.[0]?.usuarioNome ?? null),
                ocorridoEm: json.data.item.concluidoEm ?? new Date().toISOString(),
              },
              ...(prev.historico ?? []),
            ],
          };
        });
        setHighlightedMissingIds((prev) => prev.filter((id) => id !== itemId));
      } else {
        setFeedback(json.error?.message ?? "Erro ao atualizar checklist.");
      }
    } catch {
      setFeedback("Erro ao atualizar checklist.");
    } finally {
      setPendingChecklistItemId(null);
    }
  }

  const itensObrigatoriosPendentes =
    tarefa?.checklist.filter((item) => item.obrigatorio && !item.concluido).map((item) => item.id) ?? [];
  const todosObrigatoriosConcluidos = itensObrigatoriosPendentes.length === 0;

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
                    className={`rounded-md border px-3 py-2 text-sm ${
                      highlightedMissingIds.includes(item.id) ? "border-destructive bg-destructive/5" : "border-border"
                    }`}
                  >
                    <label className="flex items-start gap-3">
                      <Checkbox
                        checked={item.concluido}
                        disabled={
                          updating ||
                          pendingChecklistItemId === item.id ||
                          tarefa.status === "concluida"
                        }
                        onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
                        aria-label={`Marcar ${item.titulo}`}
                        className="mt-0.5"
                      />
                      <span className={item.concluido ? "text-muted-foreground line-through" : ""}>
                        <span className="font-medium">
                          {item.titulo}
                          {item.obrigatorio ? " • Obrigatório" : " • Opcional"}
                        </span>
                        {item.descricao && (
                          <span className="block text-muted-foreground text-xs">
                            {item.descricao}
                          </span>
                        )}
                        {item.concluidoEm && (
                          <span className="block text-xs text-muted-foreground">
                            Concluído por {item.concluidoPorNome ?? item.concluidoPor ?? "usuário"} em{" "}
                            {new Date(item.concluidoEm).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {tarefa.status !== "concluida" && (
              <div className="mt-4 flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {todosObrigatoriosConcluidos
                    ? "Todos os itens obrigatórios foram concluídos. Você já pode marcar a tarefa como concluída."
                    : "Conclua todos os itens obrigatórios para liberar a conclusão da tarefa."}
                </p>
                <div>
                  <Button type="button" onClick={() => alterarStatus("concluida")} disabled={updating}>
                    Marcar tarefa como concluída
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="solicitacoes-heading">
            <h2 id="solicitacoes-heading" className="text-lg font-medium mb-2">
              Solicitações relacionadas
            </h2>
            {!tarefa.solicitacoesRelacionadas?.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma solicitação vinculada a esta tarefa.</p>
            ) : (
              <>
                {tarefa.solicitacoesAbertasCount != null && tarefa.solicitacoesAbertasCount > 0 && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {tarefa.solicitacoesAbertasCount} solicitação(ões) aberta(s).
                  </p>
                )}
                <ul className="space-y-1 text-sm">
                  {tarefa.solicitacoesRelacionadas.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/solicitacoes/${s.id}`}
                        className="text-primary hover:underline"
                      >
                        {s.titulo}
                      </Link>
                      <span className="text-muted-foreground ml-2">({s.status})</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        aberta em {new Date(s.dataAbertura).toLocaleDateString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="documentos-heading">
            <h2 id="documentos-heading" className="sr-only">
              Documentos
            </h2>
            <DocumentosSection
              listAndUploadUrl={`/api/tarefas/${tarefaId}/documentos`}
              title="Documentos"
            />
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
                {tarefa.historico.map((h) => (
                  <li key={h.id}>
                    {h.usuarioNome ?? "Usuário"} {h.acao === "marcar" ? "marcou" : "desmarcou"} &quot;{h.itemTitulo}&quot; em{" "}
                    {new Date(h.ocorridoEm).toLocaleString("pt-BR")}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
