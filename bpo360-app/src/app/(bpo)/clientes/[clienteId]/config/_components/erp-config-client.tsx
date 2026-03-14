"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { IntegracaoErp } from "@/lib/domain/integracoes-erp/types";
import { FeedbackToast } from "@/components/feedback/feedback-toast";

type Props = {
  integracoes: IntegracaoErp[];
  clienteId: string;
  userRole: string;
};

const ERP_F360 = "F360";
const podeEditar = (role: string) =>
  role === "admin_bpo" || role === "gestor_bpo";

export function ErpConfigClient({
  integracoes: integracoesIniciais,
  clienteId,
  userRole,
}: Props) {
  const [integracoes, setIntegracoes] = useState<IntegracaoErp[]>(integracoesIniciais);
  const [isSubmittingErp, setIsSubmittingErp] = useState(false);
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

  async function handleSalvarErp() {
    setIsSubmittingErp(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/erp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoErp: ERP_F360, ePrincipal: true }),
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
        const nova = json.data.integracao as IntegracaoErp;
        setIntegracoes((prev) => {
          const semF360 = prev.filter((i) => i.tipoErp !== ERP_F360);
          return [...semF360, nova];
        });
        showToast("success", "Configuração ERP salva.");
      }
    } catch {
      showToast("error", "Erro ao salvar", "Tente novamente.");
    } finally {
      setIsSubmittingErp(false);
    }
  }

  const temF360 = integracoes.some((i) => i.tipoErp === ERP_F360);
  const editavel = podeEditar(userRole);

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-foreground">ERP financeiro</h2>

        {integracoes.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum ERP configurado
            </p>
            {editavel && (
              <button
                type="button"
                onClick={handleSalvarErp}
                disabled={isSubmittingErp}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmittingErp ? "Salvando…" : "Configurar F360"}
              </button>
            )}
          </div>
        ) : (
          <>
            {editavel && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="erp"
                    value={ERP_F360}
                    checked={true}
                    readOnly
                    className="rounded border-border"
                  />
                  F360 (ERP principal)
                </label>
                <button
                  type="button"
                  onClick={handleSalvarErp}
                  disabled={isSubmittingErp}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmittingErp ? "Salvando…" : "Salvar configuração ERP"}
                </button>
              </div>
            )}

            {temF360 && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  Integração F360 ativa
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Configuração básica salva.
                </p>
                <Link
                  href={`/clientes/${clienteId}/config`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Configurar token F360 →
                </Link>
              </div>
            )}
          </>
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
