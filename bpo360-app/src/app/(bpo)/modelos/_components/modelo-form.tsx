"use client";

import { useState } from "react";
import type {
  RotinaModelo,
  NovoRotinaModeloInput,
  NovoItemChecklistInput,
  Periodicidade,
} from "@/lib/domain/rotinas/types";
import { ModeloChecklistEditor } from "./modelo-checklist-editor";

const PERIODICIDADE_OPCOES: { value: Periodicidade; label: string }[] = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "custom", label: "Custom" },
];

const TIPO_SERVICO_OPCOES = [
  "",
  "Conciliação",
  "Fechamento",
  "Lançamento",
  "Cobrança",
  "Outro",
];

type Props = {
  onSuccess: (modelo: { id: string; nome: string }) => void;
  onCancel: () => void;
  onFeedback?: (feedback: { type: "success" | "error"; title: string; message?: string }) => void;
  modeloInicial?: RotinaModelo | null;
};

function toItensInput(itens: RotinaModelo["itensChecklist"]): NovoItemChecklistInput[] {
  return itens.map((i) => ({
    titulo: i.titulo,
    descricao: i.descricao ?? undefined,
    obrigatorio: i.obrigatorio,
  }));
}

export function ModeloForm({ onSuccess, onCancel, onFeedback, modeloInicial }: Props) {
  const isEdit = !!modeloInicial;
  const [nome, setNome] = useState(modeloInicial?.nome ?? "");
  const [descricao, setDescricao] = useState(modeloInicial?.descricao ?? "");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>(
    modeloInicial?.periodicidade ?? "mensal"
  );
  const [tipoServico, setTipoServico] = useState(modeloInicial?.tipoServico ?? "");
  const [itensChecklist, setItensChecklist] = useState<NovoItemChecklistInput[]>(() =>
    modeloInicial ? toItensInput(modeloInicial.itensChecklist) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setErro("Nome é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    const payload: NovoRotinaModeloInput = {
      nome: nomeTrim,
      descricao: descricao.trim() || null,
      periodicidade,
      tipoServico: tipoServico.trim() || null,
      itensChecklist,
    };

    try {
      if (isEdit && modeloInicial) {
        const res = await fetch(`/api/modelos/${modeloInicial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          setErro(json.error?.message ?? "Erro ao atualizar modelo.");
          return;
        }
        onSuccess({ id: json.data.id, nome: json.data.nome });
        onFeedback?.({ type: "success", title: "Modelo atualizado com sucesso." });
      } else {
        const res = await fetch("/api/modelos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          setErro(json.error?.message ?? "Erro ao salvar modelo.");
          return;
        }
        onSuccess({ id: json.data.id, nome: json.data.nome });
        onFeedback?.({ type: "success", title: "Modelo criado com sucesso." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="modelo-nome" className="mb-1 block text-sm font-medium">
          Nome *
        </label>
        <input
          id="modelo-nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="modelo-descricao" className="mb-1 block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="modelo-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full rounded border px-3 py-2"
          rows={2}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="modelo-periodicidade" className="mb-1 block text-sm font-medium">
          Periodicidade *
        </label>
        <select
          id="modelo-periodicidade"
          value={periodicidade}
          onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}
          className="w-full rounded border px-3 py-2"
          disabled={isSubmitting}
        >
          {PERIODICIDADE_OPCOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="modelo-tipo-servico" className="mb-1 block text-sm font-medium">
          Tipo de serviço
        </label>
        <select
          id="modelo-tipo-servico"
          value={tipoServico}
          onChange={(e) => setTipoServico(e.target.value)}
          className="w-full rounded border px-3 py-2"
          disabled={isSubmitting}
        >
          {TIPO_SERVICO_OPCOES.map((o) => (
            <option key={o || "vazio"} value={o}>
              {o || "—"}
            </option>
          ))}
        </select>
      </div>
      <ModeloChecklistEditor
        itens={itensChecklist}
        onChange={setItensChecklist}
        disabled={isSubmitting}
      />
      {erro && (
        <p className="text-destructive text-sm" role="alert">
          {erro}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2 text-sm hover:bg-muted"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando…" : isEdit ? "Atualizar" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
