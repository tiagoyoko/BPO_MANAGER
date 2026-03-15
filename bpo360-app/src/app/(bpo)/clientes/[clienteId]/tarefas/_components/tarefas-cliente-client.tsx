"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FeedbackToast } from "@/components/feedback/feedback-toast";
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

type UsuarioOption = { id: string; nome: string | null; email?: string };

type Props = { clienteId: string };

function getMonthStartEnd(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    dataInicio: start.toISOString().slice(0, 10),
    dataFim: end.toISOString().slice(0, 10),
  };
}

export function TarefasClienteClient({ clienteId }: Props) {
  const [viewMode, setViewMode] = useState<"calendario" | "lista">("lista");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [status, setStatus] = useState<string>("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [prioridade, setPrioridade] = useState<string>("");
  const [tarefas, setTarefas] = useState<TarefaListItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalAtribuir, setModalAtribuir] = useState(false);
  const [atribuirResponsavelId, setAtribuirResponsavelId] = useState("");
  const [atribuirSubmitting, setAtribuirSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    title: string;
    message?: string;
    variant: "success" | "error";
  }>({ open: false, title: "", variant: "success" });
  const [calendarMode, setCalendarMode] = useState<"mensal" | "semanal">("mensal");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [tipo, setTipo] = useState<string>("");
  const [comSolicitacoesAbertas, setComSolicitacoesAbertas] = useState(false);

  const { dataInicio, dataFim } = useMemo(
    () => getMonthStartEnd(year, month),
    [year, month]
  );

  const fetchTarefas = useMemo(
    () => () => {
      const params = new URLSearchParams({ dataInicio, dataFim });
      if (status) params.set("status", status);
      if (responsavelId) params.set("responsavelId", responsavelId);
      if (prioridade) params.set("prioridade", prioridade);
      if (tipo) params.set("tipo", tipo);
      if (comSolicitacoesAbertas) params.set("comSolicitacoesAbertas", "true");
      return fetch(`/api/clientes/${clienteId}/tarefas?${params}`)
        .then((r) => r.json())
        .then((json) => setTarefas(json.data?.tarefas ?? []));
    },
    [clienteId, dataInicio, dataFim, status, responsavelId, prioridade, tipo, comSolicitacoesAbertas]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTarefas().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchTarefas, viewMode]);

  const tarefasPorData = useMemo(() => {
    const map: Record<string, TarefaListItem[]> = {};
    for (const t of tarefas) {
      const d = t.dataVencimento;
      if (!map[d]) map[d] = [];
      map[d].push(t);
    }
    const keys = Object.keys(map).sort();
    return keys.map((d) => ({ data: d, items: map[d]! }));
  }, [tarefas]);

  const calendarDays = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const cells: (null | { day: number; dateStr: string })[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [year, month]);

  const tarefasPorDia = useMemo(() => {
    const map: Record<string, TarefaListItem[]> = {};
    for (const t of tarefas) {
      if (!map[t.dataVencimento]) map[t.dataVencimento] = [];
      map[t.dataVencimento].push(t);
    }
    return map;
  }, [tarefas]);

  const weeklyRange = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      label: `${start.getDate()} ${start.toLocaleDateString("pt-BR", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("pt-BR", { month: "short" })} ${end.getFullYear()}`,
      start,
      end,
    };
  }, [selectedDate]);

  const weekCells = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + i);
      const dateStr = cellDate.toISOString().slice(0, 10);
      return {
        key: dateStr,
        label: cellDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
      };
    });
  }, [selectedDate]);

  const tiposServico = useMemo(
    () => Array.from(new Set(tarefas.map((t) => t.tipoServico).filter(Boolean))) as string[],
    [tarefas]
  );

  const idsNaPagina = useMemo(
    () => new Set(tarefasPorData.flatMap(({ items }) => items.map((t) => t.id))),
    [tarefasPorData]
  );
  const allSelectedNaPagina = idsNaPagina.size > 0 && [...idsNaPagina].every((id) => selectedIds.has(id));
  const toggleSelectAll = () => {
    if (allSelectedNaPagina) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        idsNaPagina.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...idsNaPagina]));
    }
  };
  const toggleSelectAllInGroup = (items: TarefaListItem[]) => {
    const groupIds = new Set(items.map((t) => t.id));
    const allInGroupSelected = groupIds.size > 0 && [...groupIds].every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allInGroupSelected) groupIds.forEach((id) => next.delete(id));
      else groupIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAtribuirSubmit = async () => {
    if (!atribuirResponsavelId || selectedIds.size === 0) return;
    setAtribuirSubmitting(true);
    try {
      const res = await fetch("/api/tarefas/atribuir-massa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarefaIds: Array.from(selectedIds),
          responsavelId: atribuirResponsavelId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({
          open: true,
          title: "Erro ao atribuir",
          message: json.error?.message ?? "Tente novamente.",
          variant: "error",
        });
        return;
      }
      const { sucesso, falhas } = json.data ?? { sucesso: 0, falhas: [] };
      const msg =
        falhas.length > 0
          ? `${sucesso} atribuída(s); ${falhas.length} falharam: ${falhas.map((f: { tarefaId: string; motivo: string }) => f.motivo).join("; ")}`
          : `${sucesso} tarefa(s) atribuída(s) com sucesso.`;
      setToast({
        open: true,
        title: falhas.length > 0 ? "Atribuição parcial" : "Sucesso",
        message: msg,
        variant: falhas.length > 0 ? "error" : "success",
      });
      setSelectedIds(new Set());
      setModalAtribuir(false);
      setAtribuirResponsavelId("");
      fetchTarefas();
    } finally {
      setAtribuirSubmitting(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/usuarios?paraAtribuicao=1")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setUsuarios(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setUsuarios([]));
  }, []);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && viewMode === "lista" && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} itens selecionados
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setModalAtribuir(true)}
            >
              Atribuir responsável
            </Button>
          </div>
        </div>
      )}

      {modalAtribuir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-4 shadow-lg">
            <h3 className="text-sm font-semibold mb-2">Atribuir responsável</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {selectedIds.size} tarefa(s) selecionada(s)
            </p>
            <select
              value={atribuirResponsavelId}
              onChange={(e) => setAtribuirResponsavelId(e.target.value)}
              className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione o responsável</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome ?? u.email ?? u.id}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalAtribuir(false);
                  setAtribuirResponsavelId("");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!atribuirResponsavelId || atribuirSubmitting}
                onClick={handleAtribuirSubmit}
              >
                {atribuirSubmitting ? "Atribuindo…" : "Atribuir"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-border p-0.5">
          <Button
            type="button"
            variant={viewMode === "lista" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("lista")}
          >
            Lista
          </Button>
          <Button
            type="button"
            variant={viewMode === "calendario" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendario")}
          >
            Calendário
          </Button>
        </div>

        {viewMode === "calendario" && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border p-0.5">
              <Button
                type="button"
                variant={calendarMode === "mensal" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCalendarMode("mensal")}
              >
                Mensal
              </Button>
              <Button
                type="button"
                variant={calendarMode === "semanal" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCalendarMode("semanal")}
              >
                Semanal
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (calendarMode === "semanal") {
                  setSelectedDate((current) => {
                    const next = new Date(current);
                    next.setDate(current.getDate() - 7);
                    return next;
                  });
                  return;
                }
                if (month === 1) {
                  setMonth(12);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
            >
              ←
            </Button>
            <span className="text-sm font-medium min-w-[120px]">
              {calendarMode === "semanal"
                ? weeklyRange.label
                : new Date(year, month - 1).toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (calendarMode === "semanal") {
                  setSelectedDate((current) => {
                    const next = new Date(current);
                    next.setDate(current.getDate() + 7);
                    return next;
                  });
                  return;
                }
                if (month === 12) {
                  setMonth(1);
                  setYear((y) => y + 1);
                } else setMonth((m) => m + 1);
              }}
            >
              →
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <label className="text-sm text-muted-foreground">Responsável</label>
          <select
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nome ?? u.email ?? u.id}</option>
            ))}
          </select>
          <label className="text-sm text-muted-foreground">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="">Todas</option>
            {Object.entries(PRIORIDADE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <label className="text-sm text-muted-foreground">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {tiposServico.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox
              checked={comSolicitacoesAbertas}
              onCheckedChange={(c) => setComSolicitacoesAbertas(c === true)}
              aria-label="Com solicitações abertas"
            />
            Com solicitações abertas
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando tarefas…</p>
      ) : viewMode === "calendario" ? (
        <Card>
          <CardContent className="p-2">
            {calendarMode === "mensal" ? (
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr>
                    {weekDays.map((w) => (
                      <th key={w} className="border-b p-1 text-left font-medium text-muted-foreground">
                        {w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {weekDays.map((_, colIndex) => {
                        const cell = calendarDays[rowIndex * 7 + colIndex];
                        if (!cell) {
                          return <td key={colIndex} className="border-b p-1 min-h-[60px]" />;
                        }
                        const dayTasks = tarefasPorDia[cell.dateStr] ?? [];
                        return (
                          <td
                            key={colIndex}
                            className="align-top border-b p-1 min-h-[60px]"
                          >
                            <span className="text-muted-foreground">{cell.day}</span>
                            <ul className="mt-1 space-y-0.5">
                              {dayTasks.map((t) => (
                                <li key={t.id}>
                                  <Link
                                    href={`/tarefas/${t.id}`}
                                    className="text-primary hover:underline line-clamp-2 block"
                                  >
                                    {t.titulo}
                                  </Link>
                                  <Badge variant="secondary" className="text-xs">
                                    {STATUS_LABEL[t.status] ?? t.status}
                                  </Badge>
                                  {t.comSolicitacoesAbertas && (
                                    <Badge variant="outline" className="text-xs ml-0.5">Solicitações abertas</Badge>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid gap-2 md:grid-cols-7">
                {weekCells.map((cell) => {
                  const dayTasks = tarefasPorDia[cell.key] ?? [];
                  return (
                    <div key={cell.key} className="rounded-md border border-border p-2">
                      <p className="text-xs font-medium text-muted-foreground">{cell.label}</p>
                      <ul className="mt-2 space-y-1">
                        {dayTasks.length === 0 ? (
                          <li className="text-xs text-muted-foreground">Sem tarefas</li>
                        ) : (
                          dayTasks.map((t) => (
                            <li key={t.id}>
                              <Link
                                href={`/tarefas/${t.id}`}
                                className="text-primary hover:underline line-clamp-2 block text-sm"
                              >
                                {t.titulo}
                              </Link>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {STATUS_LABEL[t.status] ?? t.status}
                              </Badge>
                              {t.comSolicitacoesAbertas && (
                                <Badge variant="outline" className="mt-1 text-xs ml-0.5">Solicitações abertas</Badge>
                              )}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tarefasPorData.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 px-2 py-1.5">
              <Checkbox
                id="select-all-page"
                checked={allSelectedNaPagina}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all-page" className="text-sm text-muted-foreground cursor-pointer">
                Selecionar todas (página atual)
              </label>
            </div>
          )}
          {tarefasPorData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa no período.</p>
          ) : (
            tarefasPorData.map(({ data, items }) => (
              <Card key={data}>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <div className="mb-2 flex items-center gap-2">
                    <Checkbox
                      id={`select-all-${data}`}
                      checked={items.length > 0 && items.every((t) => selectedIds.has(t.id))}
                      onCheckedChange={() => toggleSelectAllInGroup(items)}
                    />
                    <label
                      htmlFor={`select-all-${data}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Selecionar todas (este dia)
                    </label>
                  </div>
                  <ul className="space-y-2">
                    {items.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 border-b border-border pb-2 last:border-0">
                        <Checkbox
                          checked={selectedIds.has(t.id)}
                          onCheckedChange={() => toggleSelect(t.id)}
                        />
                        <Link
                          href={`/tarefas/${t.id}`}
                          className="text-primary hover:underline font-medium flex-1 min-w-0"
                        >
                          {t.titulo}
                        </Link>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary">
                            {STATUS_LABEL[t.status] ?? t.status}
                          </Badge>
                          {t.comSolicitacoesAbertas && (
                            <Badge variant="outline">Solicitações abertas</Badge>
                          )}
                          <Badge variant="outline">
                            {PRIORIDADE_LABEL[t.prioridade] ?? t.prioridade}
                          </Badge>
                          {t.tipoServico && (
                            <Badge variant="outline">
                              {t.tipoServico}
                            </Badge>
                          )}
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
            ))
          )}
        </div>
      )}

      <FeedbackToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
