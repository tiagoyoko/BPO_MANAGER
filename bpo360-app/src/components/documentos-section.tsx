"use client";

/**
 * Story 3.4: Seção reutilizável "Documentos" — lista (nome, tipo, tamanho, data, autor) + Adicionar arquivo + download/preview.
 */
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DocumentoItem = {
  id: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
  createdAt: string;
  autor: string | null;
  storageKey: string;
};

const PREVIEW_TIPOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
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

type Props = {
  /** GET e POST para listar e enviar (ex.: /api/solicitacoes/:id/documentos ou /api/tarefas/:id/documentos) */
  listAndUploadUrl: string;
  /** Título da seção */
  title?: string;
};

export function DocumentosSection({ listAndUploadUrl, title = "Documentos" }: Props) {
  const [list, setList] = useState<DocumentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(listAndUploadUrl);
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setList(json.data);
      } else {
        setError(json.error?.message ?? "Erro ao carregar documentos.");
      }
    } catch {
      setError("Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [listAndUploadUrl]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const res = await fetch(listAndUploadUrl, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setList((prev) => [...prev, json.data]);
      } else {
        setError(json.error?.message ?? "Erro ao enviar arquivo.");
      }
    } catch {
      setError("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function abrirDocumento(doc: DocumentoItem, preview: boolean) {
    try {
      const res = await fetch(`/api/documentos/${doc.id}/url`);
      const json = await res.json();
      if (res.ok && json.data?.url) {
        if (preview && PREVIEW_TIPOS.has(doc.tipoMime)) {
          window.open(json.data.url, "_blank", "noopener,noreferrer");
        } else {
          const a = document.createElement("a");
          a.href = json.data.url;
          a.download = doc.nomeArquivo;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.click();
        }
      } else {
        setError(json.error?.message ?? "Erro ao obter link do documento.");
      }
    } catch {
      setError("Erro ao abrir documento.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,application/pdf,image/png,image/jpeg,image/jpg,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Enviando…" : "Adicionar arquivo"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-2" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando documentos…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-2 pr-4 font-medium">Nome</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Tipo</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Tamanho</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Data</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Autor</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((doc) => (
                  <tr key={doc.id} className="border-b">
                    <td className="py-2 pr-4">{doc.nomeArquivo}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{doc.tipoMime.split("/").pop() ?? doc.tipoMime}</td>
                    <td className="py-2 pr-4">{formatarTamanho(doc.tamanho)}</td>
                    <td className="py-2 pr-4">{formatarData(doc.createdAt)}</td>
                    <td className="py-2 pr-4">{doc.autor ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {PREVIEW_TIPOS.has(doc.tipoMime) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => abrirDocumento(doc, true)}
                        >
                          Visualizar
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => abrirDocumento(doc, false)}
                      >
                        Baixar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
