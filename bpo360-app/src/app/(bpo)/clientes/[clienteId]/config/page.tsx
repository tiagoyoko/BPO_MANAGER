/**
 * Página de configurações do cliente – ERP principal (F360) e parâmetros (story 1.6).
 * Story 1.5 — Server Component; carrega ERPs e renderiza ErpConfigClient + F360TokenForm.
 */
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect, notFound } from "next/navigation";
import { buscarClientePorIdEBpo } from "@/lib/domain/clientes/repository";
import {
  buscarIntegracaoF360Row,
  buscarIntegracoesPorCliente,
} from "@/lib/domain/integracoes-erp/repository";
import { decrypt } from "@/lib/security/crypto";
import { ErpConfigClient } from "./_components/erp-config-client";
import { F360TokenForm } from "./_components/f360-token-form";

export const dynamic = "force-dynamic";

export default async function ClienteConfigPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=no-profile");

  if (user.role === "cliente_final") {
    redirect("/clientes");
  }

  const { clienteId } = await params;
  const supabase = await createClient();
  const { data: cliente, error: errCliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (errCliente || !cliente) notFound();

  let integracoes: Awaited<ReturnType<typeof buscarIntegracoesPorCliente>> = [];
  try {
    integracoes = await buscarIntegracoesPorCliente(supabase, clienteId, user.bpoId);
  } catch {
    integracoes = [];
  }

  const integracaoF360 = integracoes.find((i) => i.tipoErp === "F360");
  let tokenMascaradoInicial = integracaoF360?.tokenMascarado ?? null;

  if (integracaoF360?.tokenConfigurado) {
    const integracaoF360Row = await buscarIntegracaoF360Row(supabase, clienteId, user.bpoId);
    if (integracaoF360Row?.token_f360_encrypted) {
      try {
        tokenMascaradoInicial =
          "••••••••" + decrypt(integracaoF360Row.token_f360_encrypted).slice(-4);
      } catch {
        throw new Error("Erro ao processar configuração F360.");
      }
    }
  }

  return (
    <section aria-label="Configurações do cliente">
      <div id="erp">
        <ErpConfigClient
          integracoes={integracoes}
          clienteId={clienteId}
          userRole={user.role}
        />
      </div>
      {integracaoF360 ? (
        <F360TokenForm
          integracaoId={integracaoF360.id}
          clienteId={clienteId}
          userRole={user.role}
          tokenConfigurado={integracaoF360.tokenConfigurado}
          tokenMascarado={tokenMascaradoInicial}
          observacoes={integracaoF360.observacoes}
          tokenConfiguradoEm={integracaoF360.tokenConfiguradoEm}
        />
      ) : (
        <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            <a
              href={`/clientes/${clienteId}/config#erp`}
              className="font-medium text-primary hover:underline"
            >
              Configure o ERP F360 na seção acima
            </a>{" "}
            para liberar esta etapa.
          </p>
        </div>
      )}
    </section>
  );
}
