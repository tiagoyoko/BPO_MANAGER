"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

  const { dataInicio, dataFim } = useMemo(
    () => getMonthStartEnd(year, month),
    [year, month]
  );

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      dataInicio: viewMode === "calendario" ? dataInicio : dataInicio,
      dataFim: viewMode === "calendario" ? dataFim : dataFim,
    });
    if (status) params.set("status", status);
    if (responsavelId) params.set("responsavelId", responsavelId);
    if (prioridade) params.set("prioridade", prioridade);

    fetch(`/api/clientes/${clienteId}/tarefas?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setTarefas(json.data?.tarefas ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clienteId, dataInicio, dataFim, status, responsavelId, prioridade, viewMode]);

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setUsuarios(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setUsuarios([]));
  }, []);

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

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (month === 1) {
                  setMonth(12);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
            >
              ←
            </Button>
            <span className="text-sm font-medium min-w-[120px]">
              {new Date(year, month - 1).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (month === 12) {
                  setMonth(1);
                  setYear((y) => y + 1);
                } else setMonth((m) => m + 1);
                }
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
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando tarefas…</p>
      ) : viewMode === "calendario" ? (
        <Card>
          <CardContent className="p-2">
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
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
                  <ul className="space-y-2">
                    {items.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
