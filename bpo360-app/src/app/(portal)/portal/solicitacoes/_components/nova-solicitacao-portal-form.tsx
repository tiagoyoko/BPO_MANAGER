"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { TipoSolicitacao, PrioridadeSolicitacao } from "@/app/api/solicitacoes/route";

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

const ACCEPT_FILES = ".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,application/pdf,image/png,image/jpeg,image/jpg,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";

export function NovaSolicitacaoPortalForm() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoSolicitacao>("outro");
  const [prioridade, setPrioridade] = useState<PrioridadeSolicitacao>("media");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!titulo.trim()) {
      setErro("Assunto é obrigatório.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          tipo,
          prioridade,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error?.message ?? "Erro ao criar solicitação.");
        setSubmitting(false);
        return;
      }
      const solicitacaoId = json.data?.id;
      if (!solicitacaoId) {
        router.push("/portal/solicitacoes");
        setSubmitting(false);
        return;
      }
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`/api/solicitacoes/${solicitacaoId}/anexos`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          setErro(uploadJson.error?.message ?? `Erro ao enviar ${file.name}`);
          setSubmitting(false);
          return;
        }
      }
      router.push(`/portal/solicitacoes/${solicitacaoId}`);
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-card">
      <div>
        <label htmlFor="portal-sol-assunto" className="block text-sm font-medium mb-1">
          Assunto *
        </label>
        <input
          id="portal-sol-assunto"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Ex.: Envio do documento X"
        />
      </div>

      <div>
        <label htmlFor="portal-sol-descricao" className="block text-sm font-medium mb-1">
          Descrição *
        </label>
        <textarea
          id="portal-sol-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          rows={3}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Descreva sua solicitação"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="portal-sol-tipo" className="block text-sm font-medium mb-1">
            Tipo *
          </label>
          <select
            id="portal-sol-tipo"
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
          <label htmlFor="portal-sol-prioridade" className="block text-sm font-medium mb-1">
            Prioridade *
          </label>
          <select
            id="portal-sol-prioridade"
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
        <label htmlFor="portal-sol-anexos" className="block text-sm font-medium mb-1">
          Anexos (opcional)
        </label>
        <input
          ref={fileInputRef}
          id="portal-sol-anexos"
          type="file"
          multiple
          accept={ACCEPT_FILES}
          onChange={handleFileChange}
          className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">
          PDF, PNG, JPG, XLSX, XLS, CSV. Máx. 10 MB por arquivo.
        </p>
        {files.length > 0 && (
          <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside">
            {files.map((f) => (
              <li key={f.name}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
            ))}
          </ul>
        )}
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
          {submitting ? "Enviando…" : "Enviar solicitação"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/portal/solicitacoes")}
          disabled={submitting}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
