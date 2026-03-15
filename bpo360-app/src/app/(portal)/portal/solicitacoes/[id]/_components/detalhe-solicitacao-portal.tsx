"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

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
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Solicitacao = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  prioridade: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Anexo = {
  id: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
  createdAt: string;
};

type Props = {
  solicitacao: Solicitacao;
  anexos: Anexo[];
};

export function DetalheSolicitacaoPortal({ solicitacao, anexos }: Props) {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);

  const getSignedUrl = useCallback(async (solicitacaoId: string, anexoId: string) => {
    setLoadingUrl(anexoId);
    setErroAnexo(null);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/anexos/${anexoId}/url`);
      const json = await res.json();
      if (res.ok && json.data?.url) {
        window.open(json.data.url, "_blank", "noopener,noreferrer");
        return;
      }
      setErroAnexo(json.error?.message ?? "Não foi possível abrir o anexo.");
    } catch {
      setErroAnexo("Não foi possível abrir o anexo.");
    } finally {
      setLoadingUrl(null);
    }
  }, []);

  const isPreviewable = (mime: string) =>
    mime === "application/pdf" || mime.startsWith("image/");

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/portal/solicitacoes" className="hover:underline">
          ← Voltar às solicitações
        </Link>
      </nav>

      <div className="border rounded-lg p-4 bg-card space-y-2">
        <h1 className="text-lg font-semibold">{solicitacao.titulo}</h1>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Status</dt>
          <dd>{STATUS_LABEL[solicitacao.status] ?? solicitacao.status}</dd>
          <dt className="text-muted-foreground">Tipo</dt>
          <dd>{TIPO_LABEL[solicitacao.tipo] ?? solicitacao.tipo}</dd>
          <dt className="text-muted-foreground">Prioridade</dt>
          <dd>{PRIORIDADE_LABEL[solicitacao.prioridade] ?? solicitacao.prioridade}</dd>
          <dt className="text-muted-foreground">Abertura</dt>
          <dd>{formatarData(solicitacao.createdAt)}</dd>
        </dl>
        {solicitacao.descricao && (
          <p className="text-sm pt-2 border-t mt-2 whitespace-pre-wrap">{solicitacao.descricao}</p>
        )}
      </div>

      <section aria-label="Anexos">
        <h2 className="text-base font-medium mb-2">Anexos</h2>
        {erroAnexo ? (
          <p className="mb-2 text-sm text-destructive" role="alert">
            {erroAnexo}
          </p>
        ) : null}
        {anexos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anexo.</p>
        ) : (
          <ul className="divide-y divide-border border rounded-md">
            {anexos.map((a) => (
              <li key={a.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.nomeArquivo}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarTamanho(a.tamanho)} · {formatarData(a.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => getSignedUrl(solicitacao.id, a.id)}
                    disabled={loadingUrl === a.id}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {loadingUrl === a.id ? "Abrindo…" : isPreviewable(a.tipoMime) ? "Visualizar" : "Baixar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
