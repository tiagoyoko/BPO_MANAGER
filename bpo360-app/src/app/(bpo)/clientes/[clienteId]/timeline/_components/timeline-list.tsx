"use client";

/**
 * Story 3.3: Lista de eventos da timeline com filtros client-side.
 */
import { useState } from "react";
import type { EventoTimeline, TipoEvento } from "@/app/api/clientes/[clienteId]/timeline/route";
import { TimelineFiltros } from "./timeline-filtros";
import { TimelineItem } from "./timeline-item";

type Props = {
  eventos: EventoTimeline[];
};

export function TimelineList({ eventos }: Props) {
  const [filtro, setFiltro] = useState<TipoEvento | "todos">("todos");

  const eventosFiltrados =
    filtro === "todos" ? eventos : eventos.filter((e) => e.tipo === filtro);

  return (
    <div className="space-y-4">
      <TimelineFiltros selecionado={filtro} onChange={setFiltro} />

      {eventosFiltrados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Nenhum evento encontrado.
        </p>
      ) : (
        <ul aria-label="Eventos da timeline" className="divide-y divide-border">
          {eventosFiltrados.map((evento) => (
            <TimelineItem key={evento.id} evento={evento} />
          ))}
        </ul>
      )}
    </div>
  );
}
