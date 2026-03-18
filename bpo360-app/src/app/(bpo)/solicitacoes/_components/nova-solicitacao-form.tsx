"use client";

import { useState, useCallback } from "react";
import type { TipoSolicitacao, PrioridadeSolicitacao } from "@/app/api/solicitacoes/route";
import type { PostSolicitacaoBody } from "@/lib/api/schemas/solicitacoes";

type ClienteOption = { id: string; nomeFantasia: string };
type TarefaOption = { id: string; titulo: string; dataVencimento: string };

const TIPOS: { value: TipoSolicitacao; label: string }[] = [
  { value: "documento_faltando", label: "Documento faltando" },
  { value: "duvida", label: "Dúvida" },
  { value: "ajuste", label: "Ajuste" },
  { value: "outro", label: "Outro" },
];

const PRIORIDADES: { value: PrioridadeSolicitacao; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

type Props = {
  clientes: ClienteOption[];
  onSucesso: () => void;
  onCancelar: () => void;
};

export function NovaSolicitacaoForm({ clientes, onSucesso, onCancelar }: Props) {
  const [clienteId, setClienteId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoSolicitacao>("outro");
  const [prioridade, setPrioridade] = useState<PrioridadeSolicitacao>("media");
  const [tarefaId, setTarefaId] = useState("");
  const [tarefas, setTarefas] = useState<TarefaOption[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarTarefas = useCallback(async (cid: string) => {
    if (!cid) {
      setTarefas([]);
      setTarefaId("");
      return;
    }
    setLoadingTarefas(true);
    setTarefaId("");
    try {
      const res = await fetch(`/api/clientes/${cid}/tarefas?limit=50`);
      const json = await res.json();
      if (!res.ok) {
        setTarefas([]);
        return;
      }
      const list = (json.data?.tarefas ?? []) as { id: string; titulo: string; dataVencimento: string }[];
      setTarefas(list);
    } catch {
      setTarefas([]);
    } finally {
      setLoadingTarefas(false);
    }
  }, []);

  const handleClienteChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setClienteId(value);
      carregarTarefas(value);
    },
    [carregarTarefas]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!clienteId.trim() || !titulo.trim()) {
      setErro("Cliente e título são obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const body: PostSolicitacaoBody = {
        clienteId: clienteId.trim(),
        titulo: titulo.trim(),
        descricao: descricao.trim() || " ",
        tipo,
        prioridade,
        tarefaId: tarefaId.trim() || null,
      };
      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error?.message ?? "Erro ao criar solicitação.");
        return;
      }
      onSucesso();
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl border rounded-lg p-4 bg-card">
      <h2 className="text-lg font-semibold">Nova solicitação</h2>

      <div>
        <label htmlFor="solicitacao-cliente" className="block text-sm font-medium mb-1">
          Cliente *
        </label>
        <select
          id="solicitacao-cliente"
          value={clienteId}
          onChange={handleClienteChange}
          required
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="">Selecione o cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nomeFantasia}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="solicitacao-titulo" className="block text-sm font-medium mb-1">
          Título *
        </label>
        <input
          id="solicitacao-titulo"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Ex.: NF de janeiro faltando"
        />
      </div>

      <div>
        <label htmlFor="solicitacao-descricao" className="block text-sm font-medium mb-1">
          Descrição
        </label>
        <textarea
          id="solicitacao-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Detalhes opcionais"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="solicitacao-tipo" className="block text-sm font-medium mb-1">
            Tipo *
          </label>
          <select
            id="solicitacao-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoSolicitacao)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="solicitacao-prioridade" className="block text-sm font-medium mb-1">
            Prioridade *
          </label>
          <select
            id="solicitacao-prioridade"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as PrioridadeSolicitacao)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="solicitacao-tarefa" className="block text-sm font-medium mb-1">
          Vincular à tarefa (opcional)
        </label>
        <select
          id="solicitacao-tarefa"
          value={tarefaId}
          onChange={(e) => setTarefaId(e.target.value)}
          disabled={!clienteId || loadingTarefas}
          className="w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Nenhuma</option>
          {tarefas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo} ({t.dataVencimento})
            </option>
          ))}
        </select>
        {loadingTarefas && <p className="text-xs text-muted-foreground mt-1">Carregando tarefas…</p>}
      </div>

      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={submitting}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
