/**
 * Story 3.3: Card de um evento na timeline.
 */
import type { EventoTimeline } from "@/app/api/clientes/[clienteId]/timeline/route";

const TIPO_LABELS: Record<EventoTimeline["tipo"], string> = {
  solicitacao_criada: "Solicitação criada",
  comentario: "Comentário",
};

const TIPO_CLASSES: Record<EventoTimeline["tipo"], string> = {
  solicitacao_criada: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  comentario: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

type Props = {
  evento: EventoTimeline;
};

function formatarDataHora(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TimelineItem({ evento }: Props) {
  return (
    <li className="flex gap-4 py-3">
      {/* Indicador vertical */}
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-border mt-1.5" aria-hidden="true" />
        <div className="w-px flex-1 bg-border mt-1" aria-hidden="true" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_CLASSES[evento.tipo]}`}
          >
            {TIPO_LABELS[evento.tipo]}
          </span>
          <span className="text-xs text-muted-foreground">
            {evento.autorTipo === "cliente" ? "Cliente" : (evento.autorNome ?? "Interno")}
          </span>
          <time
            dateTime={evento.dataHora}
            className="text-xs text-muted-foreground ml-auto"
          >
            {formatarDataHora(evento.dataHora)}
          </time>
        </div>
        <p className="text-sm text-foreground break-words">{evento.tituloOuResumo}</p>
      </div>
    </li>
  );
}
