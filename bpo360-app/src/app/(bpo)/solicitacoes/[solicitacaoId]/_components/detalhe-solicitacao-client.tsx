"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentosSection } from "@/components/documentos-section";
import type { SolicitacaoDetalhe } from "@/app/api/solicitacoes/route";

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

type Props = {
  solicitacaoId: string;
  solicitacao: SolicitacaoDetalhe;
};

export function DetalheSolicitacaoClient({ solicitacaoId, solicitacao }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/solicitacoes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Solicitações
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{solicitacao.titulo}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cliente: {solicitacao.clienteNome ?? solicitacao.clienteId}
            {" · "}
            <Badge variant="secondary">{TIPO_LABEL[solicitacao.tipo] ?? solicitacao.tipo}</Badge>
            {" · "}
            <Badge variant="outline">{PRIORIDADE_LABEL[solicitacao.prioridade] ?? solicitacao.prioridade}</Badge>
            {" · "}
            {STATUS_LABEL[solicitacao.status] ?? solicitacao.status}
            {" · "}
            {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR")}
          </p>
          {solicitacao.descricao && (
            <p className="text-sm mt-2">{solicitacao.descricao}</p>
          )}
        </CardHeader>
      </Card>

      <DocumentosSection
        listAndUploadUrl={`/api/solicitacoes/${solicitacaoId}/documentos`}
        title="Documentos"
      />
    </div>
  );
}
