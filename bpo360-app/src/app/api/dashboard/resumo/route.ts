import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import type { ResumoDashboard } from "@/lib/domain/dashboard/types";

const STATUS_CLIENTE = {
  ativo: "Ativo",
  emImplantacao: "Em implantação",
  pausado: "Pausado",
  encerrado: "Encerrado",
} as const;

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

async function contarClientesPorStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bpoId: string,
  status: (typeof STATUS_CLIENTE)[keyof typeof STATUS_CLIENTE]
) {
  const result = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("bpo_id", bpoId)
    .eq("status", status);

  return validarContagem(result);
}

function validarContagem(result: CountResult) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }

  if (user.role === "cliente_final") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();

    const [
      totalClientesResult,
      ativos,
      emImplantacao,
      pausados,
      encerrados,
      integracaoAtivaResult,
      configBasicaSalvaResult,
    ] = await Promise.all([
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("bpo_id", user.bpoId),
      contarClientesPorStatus(supabase, user.bpoId, STATUS_CLIENTE.ativo),
      contarClientesPorStatus(supabase, user.bpoId, STATUS_CLIENTE.emImplantacao),
      contarClientesPorStatus(supabase, user.bpoId, STATUS_CLIENTE.pausado),
      contarClientesPorStatus(supabase, user.bpoId, STATUS_CLIENTE.encerrado),
      supabase
        .from("integracoes_erp")
        .select("cliente_id", { count: "exact", head: true })
        .eq("bpo_id", user.bpoId)
        .eq("ativo", true),
      supabase
        .from("integracoes_erp")
        .select("cliente_id", { count: "exact", head: true })
        .eq("bpo_id", user.bpoId)
        .eq("ativo", false),
    ]);

    const totalClientes = validarContagem(totalClientesResult);
    const integracaoAtiva = validarContagem(integracaoAtivaResult);
    const configBasicaSalva = validarContagem(configBasicaSalvaResult);

    const data: ResumoDashboard = {
      totalClientes,
      clientesPorStatus: {
        ativo: ativos,
        emImplantacao,
        pausado: pausados,
        encerrado: encerrados,
      },
      clientesPorErpStatus: {
        naoConfigurado: Math.max(0, totalClientes - integracaoAtiva - configBasicaSalva),
        configBasicaSalva,
        integracaoAtiva,
      },
    };

    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar resumo.";

    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message } },
      { status: 500 }
    );
  }
}
