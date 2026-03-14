"use client";

import { useCallback, useEffect, useState } from "react";
import { FeedbackToast } from "@/components/feedback/feedback-toast";
import type { CurrentUser } from "@/types/domain";
import { canAccessModelos } from "@/lib/auth/rbac";
import type { RotinaModeloResumo, RotinaModelo } from "@/lib/domain/rotinas/types";
import { ModelosList } from "./modelos-list";
import { ModeloForm } from "./modelo-form";

type Props = {
  user: CurrentUser;
};

export function ModelosPageClient({ user }: Props) {
  const [modelos, setModelos] = useState<RotinaModeloResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modeloEditando, setModeloEditando] = useState<RotinaModelo | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message?: string;
  }>({ open: false, type: "success", title: "" });

  const fetchModelos = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/modelos");
    const json = await res.json();
    if (!res.ok) {
      setModelos([]);
      if (res.status === 403) {
        setFeedback({
          open: true,
          type: "error",
          title: "Acesso negado.",
          message: "Você não tem permissão para acessar a biblioteca de modelos.",
        });
      }
      setIsLoading(false);
      return;
    }
    setModelos(json.data?.modelos ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchModelos();
  }, [fetchModelos]);

  useEffect(() => {
    if (!feedback.open) return;
    const t = window.setTimeout(() => setFeedback((f) => ({ ...f, open: false })), 4000);
    return () => window.clearTimeout(t);
  }, [feedback.open]);

  const podeCriar = canAccessModelos(user);

  function handleSuccess() {
    setModalAberto(false);
    setModeloEditando(null);
    fetchModelos();
  }

  function handleEditar(id: string) {
    fetch(`/api/modelos/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setModeloEditando(json.data);
        setModalAberto(true);
      })
      .catch(() => {
        setFeedback({ open: true, type: "error", title: "Erro ao carregar modelo." });
      });
  }

  async function handleExcluir(id: string) {
    if (!window.confirm("Excluir este modelo? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/modelos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFeedback({ open: true, type: "success", title: "Modelo excluído." });
      fetchModelos();
    } else {
      setFeedback({ open: true, type: "error", title: "Erro ao excluir modelo." });
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Modelos de rotina</h1>
          {podeCriar && (
            <button
              type="button"
              onClick={() => {
                setModeloEditando(null);
                setModalAberto(true);
              }}
              className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Novo modelo
            </button>
          )}
        </div>
        <ModelosList
          modelos={modelos}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
          isLoading={isLoading}
        />
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-modelo-title"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
            ref={(el) => el?.focus()}
            tabIndex={-1}
          >
            <h2 id="modal-modelo-title" className="mb-4 text-lg font-semibold">
              {modeloEditando ? "Editar modelo" : "Novo modelo de rotina"}
            </h2>
            <ModeloForm
              modeloInicial={modeloEditando}
              onSuccess={handleSuccess}
              onCancel={() => {
                setModalAberto(false);
                setModeloEditando(null);
              }}
              onFeedback={(f) =>
                setFeedback({ open: true, type: f.type, title: f.title, message: f.message })
              }
            />
          </div>
        </div>
      )}

      <FeedbackToast
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.type}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
      />
    </>
  );
}
