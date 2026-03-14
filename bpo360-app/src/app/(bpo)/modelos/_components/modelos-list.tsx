"use client";

import type { RotinaModeloResumo } from "@/lib/domain/rotinas/types";

const PERIODICIDADE_LABEL: Record<string, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
  custom: "Custom",
};

type Props = {
  modelos: RotinaModeloResumo[];
  onEditar: (id: string) => void;
  onExcluir: (id: string) => void;
  isLoading?: boolean;
};

export function ModelosList({ modelos, onEditar, onExcluir, isLoading }: Props) {
  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">Carregando modelos…</p>
    );
  }

  if (modelos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum modelo cadastrado. Clique em &quot;Novo modelo&quot; para criar.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border bg-card text-card-foreground">
      {modelos.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{m.nome}</p>
            <p className="text-muted-foreground text-sm">
              {m.descricao ?? "—"} · {PERIODICIDADE_LABEL[m.periodicidade] ?? m.periodicidade}
              {m.tipoServico ? ` · ${m.tipoServico}` : ""} · {m.qtdItensChecklist} itens
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEditar(m.id)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onExcluir(m.id)}
              className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              Excluir
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
