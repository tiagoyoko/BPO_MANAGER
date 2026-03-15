"use client";

import { useEffect, useState, useCallback } from "react";
import type { SolicitacaoListItem } from "@/app/api/solicitacoes/route";
import { SolicitacoesList } from "./solicitacoes-list";
import { NovaSolicitacaoForm } from "./nova-solicitacao-form";

const LIMIT = 20;

type ClienteOption = { id: string; nomeFantasia: string };

type Props = {
  clientes: ClienteOption[];
};

export function SolicitacoesPageClient({ clientes }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [feedback, setFeedback] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const fetchSolicitacoes = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    const res = await fetch(`/api/solicitacoes?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      setSolicitacoes([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }
    setSolicitacoes(json.data?.solicitacoes ?? []);
    setTotal(json.data?.total ?? 0);
    setIsLoading(false);
  }, [page]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  useEffect(() => {
    if (!feedback.open) return;
    const t = window.setTimeout(() => setFeedback((f) => ({ ...f, open: false })), 4000);
    return () => clearTimeout(t);
  }, [feedback.open]);

  const handleNovaCriada = useCallback(() => {
    setMostrarForm(false);
    setFeedback({ open: true, message: "Solicitação criada com sucesso." });
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Solicitações</h1>
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nova solicitação
        </button>
      </header>

      {feedback.open && (
        <div
          className="mb-4 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-2 text-sm text-green-800 dark:text-green-200"
          role="status"
        >
          {feedback.message}
        </div>
      )}

      {mostrarForm ? (
        <div className="mb-8">
          <NovaSolicitacaoForm
            clientes={clientes}
            onSucesso={handleNovaCriada}
            onCancelar={() => setMostrarForm(false)}
          />
        </div>
      ) : null}

      <SolicitacoesList
        solicitacoes={solicitacoes}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </>
  );
}
