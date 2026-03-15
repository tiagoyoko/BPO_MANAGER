"use client";

/**
 * Story 3.3: Chips de filtro da timeline por tipo de evento.
 */
import type { TipoEvento } from "@/app/api/clientes/[clienteId]/timeline/route";

const OPCOES: { valor: TipoEvento | "todos"; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "solicitacao_criada", label: "Solicitações" },
  { valor: "comentario", label: "Comentários" },
];

type Props = {
  selecionado: TipoEvento | "todos";
  onChange: (tipo: TipoEvento | "todos") => void;
};

export function TimelineFiltros({ selecionado, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de evento">
      {OPCOES.map((op) => {
        const ativo = selecionado === op.valor;
        return (
          <button
            key={op.valor}
            type="button"
            onClick={() => onChange(op.valor)}
            aria-pressed={ativo}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              ativo
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
