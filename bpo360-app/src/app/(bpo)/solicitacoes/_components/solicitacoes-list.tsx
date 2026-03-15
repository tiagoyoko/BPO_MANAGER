"use client";

import type { SolicitacaoListItem } from "@/app/api/solicitacoes/route";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  resolvida: "Resolvida",
  fechada: "Fechada",
};

const TIPO_LABEL: Record<string, string> = {
  documento_faltando: "Documento faltando",
  duvida: "Dúvida",
  ajuste: "Ajuste",
  outro: "Outro",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = {
  solicitacoes: SolicitacaoListItem[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

export function SolicitacoesList({
  solicitacoes,
  total,
  page,
  limit,
  onPageChange,
  isLoading = false,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center" role="status" aria-live="polite">
        Carregando solicitações…
      </p>
    );
  }

  if (solicitacoes.length === 0) {
    return (
      <div role="region" aria-label="Lista de solicitações">
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhuma solicitação encontrada.
        </p>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Lista de solicitações">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="py-2 pr-4 font-medium">Identificador</th>
            <th scope="col" className="py-2 pr-4 font-medium">Cliente</th>
            <th scope="col" className="py-2 pr-4 font-medium">Título</th>
            <th scope="col" className="py-2 pr-4 font-medium">Tipo</th>
            <th scope="col" className="py-2 pr-4 font-medium">Prioridade</th>
            <th scope="col" className="py-2 pr-4 font-medium">Status</th>
            <th scope="col" className="py-2 pr-4 font-medium">Data abertura</th>
          </tr>
        </thead>
        <tbody>
          {solicitacoes.map((s) => (
            <tr key={s.id} className="border-b hover:bg-muted/50">
              <td className="py-2 pr-4 font-mono text-xs">{s.id.slice(0, 8)}</td>
              <td className="py-2 pr-4">{s.clienteNome ?? "—"}</td>
              <td className="py-2 pr-4">{s.titulo}</td>
              <td className="py-2 pr-4">{TIPO_LABEL[s.tipo] ?? s.tipo}</td>
              <td className="py-2 pr-4">{PRIORIDADE_LABEL[s.prioridade] ?? s.prioridade}</td>
              <td className="py-2 pr-4">{STATUS_LABEL[s.status] ?? s.status}</td>
              <td className="py-2 pr-4">{formatarData(s.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <nav className="flex items-center gap-2 mt-4" aria-label="Paginação">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          >
            Próxima
          </button>
        </nav>
      )}
    </div>
  );
}
