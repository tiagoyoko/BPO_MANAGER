"use client";

import { useState, useEffect } from "react";
import type { RotinaCliente, Frequencia, Prioridade } from "@/lib/domain/rotinas/types";
import type { RotinaModeloResumo } from "@/lib/domain/rotinas/types";

const FREQUENCIA_LABEL: Record<Frequencia, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
  custom: "Custom",
};

const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

type UsuarioOption = { id: string; nome: string | null; email: string };

type Props = {
  clienteId: string;
};

export function RotinasClienteSection({ clienteId }: Props) {
  const [rotinas, setRotinas] = useState<RotinaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modelos, setModelos] = useState<RotinaModeloResumo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/clientes/${clienteId}/rotinas`);
      if (cancelled) return;
      const json = await res.json();
      if (json.data?.rotinas) setRotinas(json.data.rotinas);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [clienteId]);

  async function openModal() {
    setModalOpen(true);
    setFeedback(null);
    const [modRes, usrRes] = await Promise.all([
      fetch("/api/modelos"),
      fetch("/api/admin/usuarios").then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
    ]);
    const modJson = await modRes.json();
    if (modJson.data?.modelos) setModelos(modJson.data.modelos);
    if (Array.isArray(usrRes?.data)) setUsuarios(usrRes.data);
    else setUsuarios([]);
  }

  return (
    <section aria-labelledby="rotinas-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="rotinas-heading" className="text-lg font-medium">
          Rotinas do cliente
        </h2>
        <button
          type="button"
          onClick={openModal}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Adicionar rotina a partir de modelo
        </button>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`rounded-md p-3 text-sm ${feedback.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {feedback.message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando rotinas…</p>
      ) : rotinas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma rotina aplicada ainda.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {rotinas.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                Início {r.dataInicio} · {FREQUENCIA_LABEL[r.frequencia]} · {PRIORIDADE_LABEL[r.prioridade]}
              </span>
              <span className="text-muted-foreground">Modelo #{r.rotinaModeloId.slice(0, 8)}…</span>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <AdicionarRotinaModal
          clienteId={clienteId}
          modelos={modelos}
          usuarios={usuarios}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            setFeedback({ type: "success", message: "Rotina aplicada. Tarefas geradas." });
            fetch(`/api/clientes/${clienteId}/rotinas`)
              .then((res) => res.json())
              .then((json) => json.data?.rotinas && setRotinas(json.data.rotinas));
          }}
          onError={(message) => setFeedback({ type: "error", message })}
        />
      )}
    </section>
  );
}

type ModalProps = {
  clienteId: string;
  modelos: RotinaModeloResumo[];
  usuarios: UsuarioOption[];
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
};

function AdicionarRotinaModal({ clienteId, modelos, usuarios, onClose, onSuccess, onError }: ModalProps) {
  const [rotinaModeloId, setRotinaModeloId] = useState("");
  const [dataInicio, setDataInicio] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [frequencia, setFrequencia] = useState<Frequencia>("mensal");
  const [responsavelPadraoId, setResponsavelPadraoId] = useState<string>("");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rotinaModeloId.trim()) {
      onError("Selecione um modelo de rotina.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/rotinas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rotinaModeloId: rotinaModeloId.trim(),
          dataInicio,
          frequencia,
          responsavelPadraoId: responsavelPadraoId || null,
          prioridade,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        onError(json.error?.message ?? "Erro ao aplicar rotina.");
        return;
      }
      onSuccess();
    } catch {
      onError("Erro de rede.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-modal="true" role="dialog">
      <div className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg">
        <h3 className="text-lg font-semibold">Adicionar rotina a partir de modelo</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="rotina-modelo" className="block text-sm font-medium">
              Modelo *
            </label>
            <select
              id="rotina-modelo"
              required
              value={rotinaModeloId}
              onChange={(e) => setRotinaModeloId(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.periodicidade})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="data-inicio" className="block text-sm font-medium">
              Data de início *
            </label>
            <input
              id="data-inicio"
              type="date"
              required
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="frequencia" className="block text-sm font-medium">
              Frequência
            </label>
            <select
              id="frequencia"
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value as Frequencia)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {usuarios.length > 0 && (
            <div>
              <label htmlFor="responsavel" className="block text-sm font-medium">
                Responsável padrão
              </label>
              <select
                id="responsavel"
                value={responsavelPadraoId}
                onChange={(e) => setResponsavelPadraoId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Nenhum</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome || u.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="prioridade" className="block text-sm font-medium">
              Prioridade
            </label>
            <select
              id="prioridade"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as Prioridade)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Aplicando…" : "Aplicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
