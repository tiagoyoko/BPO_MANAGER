"use client";

import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { RotinaCliente, Frequencia, Prioridade } from "@/lib/domain/rotinas/types";
import type { RotinaModeloResumo } from "@/lib/domain/rotinas/types";

const USUARIOS_PARA_ATRIBUICAO_URL = "/api/admin/usuarios?paraAtribuicao=1";

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

type BulkAction = "prioridade" | "responsavel" | "frequencia" | "dataInicio";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<{ action: BulkAction } | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [modRes, usrRes] = await Promise.all([
        fetch("/api/modelos"),
        fetch(USUARIOS_PARA_ATRIBUICAO_URL).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
      ]);
      if (cancelled) return;
      const modJson = await modRes.json();
      if (modJson.data?.modelos) setModelos(modJson.data.modelos);
      if (Array.isArray(usrRes?.data)) setUsuarios(usrRes.data);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const modelosMap = useMemo(() => new Map(modelos.map((m) => [m.id, m.nome])), [modelos]);
  const usuariosMap = useMemo(() => new Map(usuarios.map((u) => [u.id, u.nome || u.email])), [usuarios]);

  async function openModal() {
    setModalOpen(true);
    setFeedback(null);
    const [modRes, usrRes] = await Promise.all([
      fetch("/api/modelos"),
      fetch(USUARIOS_PARA_ATRIBUICAO_URL).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
    ]);
    const modJson = await modRes.json();
    if (modJson.data?.modelos) setModelos(modJson.data.modelos);
    if (Array.isArray(usrRes?.data)) setUsuarios(usrRes.data);
  }

  const idsNaPagina = useMemo(() => new Set(rotinas.map((r) => r.id)), [rotinas]);
  const allSelected = rotinas.length > 0 && [...idsNaPagina].every((id) => selectedIds.has(id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(rotinas.map((r) => r.id)));
  };

  const reloadRotinas = () => {
    fetch(`/api/clientes/${clienteId}/rotinas`)
      .then((res) => res.json())
      .then((json) => json.data?.rotinas && setRotinas(json.data.rotinas));
  };

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
        <>
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{selectedIds.size} selecionada(s)</span>
              <div className="flex gap-2">
                <select
                  aria-label="Ações em massa"
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value=""
                  onChange={(e) => {
                    const v = e.target.value as BulkAction | "";
                    if (v) setBulkModal({ action: v });
                  }}
                >
                  <option value="">Ações em massa…</option>
                  <option value="prioridade">Alterar prioridade</option>
                  <option value="responsavel">Alterar responsável</option>
                  <option value="frequencia">Alterar frequência</option>
                  <option value="dataInicio">Alterar data início</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-md border border-input px-2 py-1.5 text-sm hover:bg-muted"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-10 px-2 py-2 text-left">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todas"
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-medium">Modelo</th>
                  <th className="px-2 py-2 text-left font-medium">Data início</th>
                  <th className="px-2 py-2 text-left font-medium">Frequência</th>
                  <th className="px-2 py-2 text-left font-medium">Responsável</th>
                  <th className="px-2 py-2 text-left font-medium">Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {rotinas.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="w-10 px-2 py-2">
                      <Checkbox
                        checked={selectedIds.has(r.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          });
                        }}
                        aria-label={`Selecionar rotina ${r.id}`}
                      />
                    </td>
                    <td className="px-2 py-2">{modelosMap.get(r.rotinaModeloId) ?? r.rotinaModeloId.slice(0, 8)}</td>
                    <td className="px-2 py-2">{r.dataInicio}</td>
                    <td className="px-2 py-2">{FREQUENCIA_LABEL[r.frequencia]}</td>
                    <td className="px-2 py-2">{r.responsavelPadraoId ? usuariosMap.get(r.responsavelPadraoId) ?? "—" : "—"}</td>
                    <td className="px-2 py-2">{PRIORIDADE_LABEL[r.prioridade]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
            reloadRotinas();
          }}
          onError={(message) => setFeedback({ type: "error", message })}
        />
      )}

      {bulkModal && (
        <BulkActionModal
          action={bulkModal.action}
          rotinaClienteIds={[...selectedIds]}
          usuarios={usuarios}
          onClose={() => {
            setBulkModal(null);
            setSelectedIds(new Set());
          }}
          onSuccess={() => {
            setFeedback({ type: "success", message: "Rotinas atualizadas. Tarefas já geradas não foram alteradas." });
            setBulkModal(null);
            setSelectedIds(new Set());
            reloadRotinas();
          }}
          onError={(message) => setFeedback({ type: "error", message })}
          isSubmitting={bulkSubmitting}
          setSubmitting={setBulkSubmitting}
        />
      )}
    </section>
  );
}

type BulkModalProps = {
  action: BulkAction;
  rotinaClienteIds: string[];
  usuarios: UsuarioOption[];
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  isSubmitting: boolean;
  setSubmitting: (v: boolean) => void;
};

function BulkActionModal({
  action,
  rotinaClienteIds,
  usuarios,
  onClose,
  onSuccess,
  onError,
  isSubmitting,
  setSubmitting,
}: BulkModalProps) {
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [responsavelPadraoId, setResponsavelPadraoId] = useState("");
  const [frequencia, setFrequencia] = useState<Frequencia>("mensal");
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10));

  const n = rotinaClienteIds.length;
  const title =
    action === "prioridade"
      ? "Alterar prioridade"
      : action === "responsavel"
        ? "Alterar responsável"
        : action === "frequencia"
          ? "Alterar frequência"
          : "Alterar data de início";

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { rotinaClienteIds };
      if (action === "prioridade") body.prioridade = prioridade;
      if (action === "responsavel") body.responsavelPadraoId = responsavelPadraoId || null;
      if (action === "frequencia") body.frequencia = frequencia;
      if (action === "dataInicio") body.dataInicio = dataInicio;

      const res = await fetch("/api/rotinas-cliente/em-massa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        onError(json.error?.message ?? "Erro ao atualizar rotinas.");
        return;
      }
      onSuccess();
    } catch {
      onError("Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-modal="true" role="dialog">
      <div className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg">
        <h3 className="text-lg font-semibold">{title}</h3>

        <div className="mt-4 space-y-4">
          {action === "prioridade" && (
            <div>
              <label htmlFor="bulk-prioridade" className="block text-sm font-medium">
                Nova prioridade
              </label>
              <select
                id="bulk-prioridade"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="baixa">Baixa</option>
                <option value="media">{PRIORIDADE_LABEL.media}</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          )}
          {action === "responsavel" && (
            <div>
              <label htmlFor="bulk-responsavel" className="block text-sm font-medium">
                Novo responsável padrão
              </label>
              <select
                id="bulk-responsavel"
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
          {action === "frequencia" && (
            <div>
              <label htmlFor="bulk-frequencia" className="block text-sm font-medium">
                Nova frequência
              </label>
              <select
                id="bulk-frequencia"
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
          )}
          {action === "dataInicio" && (
            <div>
              <label htmlFor="bulk-data-inicio" className="block text-sm font-medium">
                Nova data de início
              </label>
              <input
                id="bulk-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          <p className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
            {n} rotina(s) serão atualizadas. Tarefas já geradas não serão alteradas; apenas as próximas gerações usarão os novos valores.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Atualizando…" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
              <option value="media">{PRIORIDADE_LABEL.media}</option>
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
