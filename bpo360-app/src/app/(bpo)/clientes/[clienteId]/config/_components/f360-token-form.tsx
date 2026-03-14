"use client";

import { useState, useCallback, useEffect } from "react";
import { FeedbackToast } from "@/components/feedback/feedback-toast";

type Props = {
  integracaoId: string;
  clienteId: string;
  userRole: string;
  tokenConfigurado: boolean;
  tokenMascarado: string | null;
  observacoes: string | null;
  tokenConfiguradoEm?: string | null;
};

const podeEditar = (role: string) =>
  role === "admin_bpo" || role === "gestor_bpo";

export function F360TokenForm({
  integracaoId,
  clienteId,
  userRole,
  tokenConfigurado: initialTokenConfigurado,
  tokenMascarado: initialTokenMascarado,
  observacoes: initialObservacoes,
}: Props) {
  const [tokenConfigurado, setTokenConfigurado] = useState(initialTokenConfigurado);
  const [tokenMascarado, setTokenMascarado] = useState<string | null>(initialTokenMascarado);
  const [observacoes, setObservacoes] = useState<string | null>(initialObservacoes);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [token, setToken] = useState("");
  const [revelarToken, setRevelarToken] = useState(false);
  const [isSubmittingF360, setIsSubmittingF360] = useState(false);
  const [erroF360, setErroF360] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    title: string;
    message?: string;
    variant: "success" | "error";
  }>({ open: false, title: "", variant: "success" });

  const showToast = useCallback(
    (variant: "success" | "error", title: string, message?: string) => {
      setToast({ open: true, title, message, variant });
    },
    []
  );
  const closeToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  useEffect(() => {
    if (!initialTokenConfigurado) return;
    fetch(`/api/clientes/${clienteId}/erp/f360`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.tokenMascarado != null)
          setTokenMascarado(json.data.tokenMascarado);
        if (json.data?.observacoes != null)
          setObservacoes(json.data.observacoes);
      })
      .catch(() => {});
  }, [clienteId, initialTokenConfigurado]);

  async function handleSalvar() {
    const t = token.trim();
    if (!t) {
      setErroF360("Token F360 é obrigatório");
      showToast("error", "Token F360 é obrigatório");
      return;
    }
    setErroF360(null);
    setIsSubmittingF360(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/erp/f360`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, observacoes: observacoes || null }),
      });
      const json = await res.json();

      if (!res.ok) {
        showToast(
          "error",
          "Erro ao salvar",
          json?.error?.message ?? "Tente novamente."
        );
        return;
      }

      if (json.data?.integracao) {
        setTokenConfigurado(true);
        setTokenMascarado(json.data.integracao.tokenMascarado ?? "••••••••");
        setObservacoes(json.data.integracao.observacoes ?? null);
        setToken("");
        setModoEdicao(false);
        showToast(
          "success",
          "Configuração básica salva",
          "Integração técnica pendente (será configurada em etapa posterior)."
        );
      }
    } catch {
      showToast("error", "Erro ao salvar", "Tente novamente.");
    } finally {
      setIsSubmittingF360(false);
    }
  }

  const editavel = podeEditar(userRole);
  const mostrarFormulario = (!tokenConfigurado || modoEdicao) && editavel;
  const operadorSemToken = !editavel && !tokenConfigurado;

  return (
    <>
      <div className="mt-6 space-y-4" data-integracao-id={integracaoId}>
        <h3 className="text-base font-medium text-foreground">Integração F360</h3>

        {operadorSemToken ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Token não configurado.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Apenas gestores podem configurar o token F360.
            </p>
          </div>
        ) : mostrarFormulario ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">
              O token F360 é gerado no painel F360 Finanças em{" "}
              <strong>Configurações → Integrações → API</strong>. Copie o token e cole aqui.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Token F360
              </label>
              <div className="relative flex gap-2">
                <input
                  type={revelarToken ? "text" : "password"}
                  placeholder="Cole o token gerado no painel F360"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  autoComplete="off"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-invalid={!!erroF360}
                />
                <button
                  type="button"
                  onClick={() => setRevelarToken(!revelarToken)}
                  className="rounded-md border border-input px-2 text-sm"
                  aria-label={revelarToken ? "Ocultar token" : "Revelar token"}
                >
                  {revelarToken ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Observações (opcional)
              </label>
              <textarea
                value={observacoes ?? ""}
                onChange={(e) => setObservacoes(e.target.value || null)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex.: ambiente de homologação"
              />
            </div>
            {editavel && (
              <button
                type="button"
                onClick={handleSalvar}
                disabled={isSubmittingF360}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmittingF360 ? "Salvando…" : "Salvar configuração"}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              Token: <span className="font-mono">{tokenMascarado ?? "—"}</span>
            </p>
            {observacoes && (
              <p className="mt-2 text-sm text-muted-foreground">{observacoes}</p>
            )}
            {editavel && (
              <button
                type="button"
                onClick={() => setModoEdicao(true)}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Alterar token
              </button>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              Configuração básica salva – integração técnica pendente.
            </p>
            <p className="text-xs text-muted-foreground">
              A ativação da integração (conexão e sync F360) será configurada em etapa posterior.
            </p>
          </div>
        )}
      </div>

      <FeedbackToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        variant={toast.variant}
        onClose={closeToast}
      />
    </>
  );
}
