"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FeedbackToast } from "@/components/feedback/feedback-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ResumoDashboard,
  ResumoErrorCode,
} from "@/lib/domain/dashboard/types";
import { isResumoErrorCode } from "@/lib/domain/dashboard/types";
import type { CurrentUser } from "@/types/domain";

type Props = {
  user: CurrentUser;
};

type ApiResponse =
  | { data: ResumoDashboard; error: null }
  | { data: null; error: { code: string; message: string } };

const MENSAGENS_ERRO_RESUMO: Record<ResumoErrorCode, string> = {
  UNAUTHORIZED: "Sua sessão expirou. Faça login novamente.",
  FORBIDDEN: "Você não tem permissão para visualizar esse painel.",
  DB_ERROR: "Erro ao acessar os dados. Tente novamente em alguns instantes.",
} as const;

const RESUMO_INICIAL: ResumoDashboard = {
  totalClientes: 0,
  clientesPorStatus: {
    ativo: 0,
    emImplantacao: 0,
    pausado: 0,
    encerrado: 0,
  },
  clientesPorErpStatus: {
    naoConfigurado: 0,
    configBasicaSalva: 0,
    integracaoAtiva: 0,
  },
};

/** Mensagem amigável a partir do código (nunca expõe detalhes técnicos). */
function mensagemAmigavelResumo(code?: string): string {
  if (!code) return "Não foi possível carregar o resumo.";
  if (isResumoErrorCode(code)) return MENSAGENS_ERRO_RESUMO[code];
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export function BpoHomeDashboardClient({ user }: Props) {
  const [resumo, setResumo] = useState<ResumoDashboard>(RESUMO_INICIAL);
  const [isLoadingResumo, setIsLoadingResumo] = useState(true);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message?: string;
  }>({
    open: false,
    title: "",
  });

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {
      setIsLoadingResumo(true);

      try {
        const response = await fetch("/api/dashboard/resumo");
        const json = (await response.json()) as ApiResponse;

        if (!ativo) return;

        if (!response.ok || json.error) {
          setResumo(RESUMO_INICIAL);
          setFeedback({
            open: true,
            title: "Não foi possível carregar o resumo",
            message: mensagemAmigavelResumo(json.error?.code),
          });
          return;
        }

        setResumo(json.data);
      } catch {
        if (!ativo) return;

        setResumo(RESUMO_INICIAL);
        setFeedback({
          open: true,
          title: "Não foi possível carregar o resumo",
          message: "Tente novamente em alguns instantes.",
        });
      } finally {
        if (ativo) {
          setIsLoadingResumo(false);
        }
      }
    }

    void carregarResumo();

    return () => {
      ativo = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      { titulo: "Total de clientes", descricao: "Carteira do BPO", valor: resumo.totalClientes },
      { titulo: "Clientes ativos", descricao: "Status operacional", valor: resumo.clientesPorStatus.ativo },
      { titulo: "Em implantação", descricao: "Status operacional", valor: resumo.clientesPorStatus.emImplantacao },
      { titulo: "Pausados", descricao: "Status operacional", valor: resumo.clientesPorStatus.pausado },
      { titulo: "Encerrados", descricao: "Status operacional", valor: resumo.clientesPorStatus.encerrado },
      { titulo: "ERP não configurado", descricao: "Resumo de integrações", valor: resumo.clientesPorErpStatus.naoConfigurado },
      { titulo: "F360 config. básica", descricao: "Resumo de integrações", valor: resumo.clientesPorErpStatus.configBasicaSalva },
      { titulo: "F360 integração ativa", descricao: "Resumo de integrações", valor: resumo.clientesPorErpStatus.integracaoAtiva },
    ],
    [resumo]
  );

  return (
    <section aria-labelledby="painel-carteira-heading" className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Home do BPO</p>
        <h1 id="painel-carteira-heading" className="text-3xl font-semibold tracking-tight">
          Painel da carteira
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Visão rápida da saúde da carteira para {user.nome ?? "sua equipe"}.
        </p>
      </header>

      <nav aria-label="Atalhos da home" className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/clientes">Carteira de clientes</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/integacoes">Integrações</Link>
        </Button>
      </nav>

      {isLoadingResumo ? (
        <div
          role="status"
          aria-live="polite"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <p className="sr-only">Carregando resumo da carteira</p>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.titulo}>
              <CardHeader className="pb-3">
                <CardDescription>{card.descricao}</CardDescription>
                <CardTitle className="text-base">{card.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  aria-label={`${card.titulo}: ${card.valor}`}
                  className="text-4xl font-semibold tracking-tight"
                >
                  {card.valor}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FeedbackToast
        open={feedback.open}
        variant="error"
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
      />
    </section>
  );
}
