/**
 * Story 2.2: GET rotinas do cliente | POST aplicar modelo de rotina ao cliente.
 * Guard: admin_bpo, gestor_bpo, operador_bpo. Cliente e modelo devem ser do mesmo bpo_id.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import {
  buscarClientePorIdEBpo,
  buscarUsuarioPorIdEBpo,
} from "@/lib/domain/clientes/repository";
import { gerarTarefasRecorrentes } from "@/lib/domain/rotinas/gerar-tarefas-recorrentes";
import type {
  AplicarRotinaInput,
  Frequencia,
  Prioridade,
  RotinaCliente,
} from "@/lib/domain/rotinas/types";

const FREQUENCIAS_VALIDAS = ["diaria", "semanal", "mensal", "custom"] as const;
const PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"] as const;
type RotinaClienteSelectRow = {
  id: string;
  cliente_id: string;
  rotina_modelo_id: string;
  data_inicio: string;
  frequencia: string;
  responsavel_padrao_id: string | null;
  prioridade: string;
  created_at: string;
  updated_at: string;
};

function isFrequencia(x: string): x is Frequencia {
  return FREQUENCIAS_VALIDAS.includes(x as Frequencia);
}

function isPrioridade(x: string): x is Prioridade {
  return PRIORIDADES_VALIDAS.includes(x as Prioridade);
}

async function limparRotinaIncompleta(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  rotinaClienteId: string;
}) {
  const { supabase, rotinaClienteId } = params;

  await supabase.from("tarefas").delete().eq("rotina_cliente_id", rotinaClienteId);
  await supabase.from("rotinas_cliente").delete().eq("id", rotinaClienteId);
}

// ─── GET /api/clientes/[clienteId]/rotinas ───────────────────────────────────

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAccessModelos(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { clienteId } = await context.params;
  if (!clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "clienteId obrigatório." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: cliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });
  if (!cliente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  const { data: rows, error } = await supabase
    .from("rotinas_cliente")
    .select("id, cliente_id, rotina_modelo_id, data_inicio, frequencia, responsavel_padrao_id, prioridade, created_at, updated_at")
    .eq("cliente_id", clienteId)
    .eq("bpo_id", user.bpoId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const rotinas: RotinaCliente[] = ((rows ?? []) as RotinaClienteSelectRow[]).map((r) => ({
    id: r.id,
    clienteId: r.cliente_id,
    rotinaModeloId: r.rotina_modelo_id,
    dataInicio: r.data_inicio,
    frequencia: r.frequencia as Frequencia,
    responsavelPadraoId: r.responsavel_padrao_id,
    prioridade: r.prioridade as Prioridade,
    criadoEm: r.created_at,
    atualizadoEm: r.updated_at,
  }));

  return NextResponse.json({ data: { rotinas }, error: null });
}

// ─── POST /api/clientes/[clienteId]/rotinas ───────────────────────────────────

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAccessModelos(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { clienteId } = await context.params;
  if (!clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "clienteId obrigatório." } },
      { status: 400 }
    );
  }

  let body: AplicarRotinaInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  if (!body.rotinaModeloId || !body.dataInicio) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "rotinaModeloId e dataInicio são obrigatórios." } },
      { status: 400 }
    );
  }

  const frequencia = body.frequencia ?? "mensal";
  if (!isFrequencia(frequencia)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "frequencia inválida." } },
      { status: 400 }
    );
  }

  const prioridade = body.prioridade ?? "media";
  if (!isPrioridade(prioridade)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "prioridade inválida." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: cliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });
  if (!cliente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  const { data: modelo, error: errModelo } = await supabase
    .from("rotinas_modelo")
    .select("id, nome, bpo_id")
    .eq("id", body.rotinaModeloId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (errModelo || !modelo) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Modelo de rotina não encontrado ou não pertence ao seu BPO." } },
      { status: 404 }
    );
  }

  if (body.responsavelPadraoId) {
    const { data: responsavel, error: errResponsavel } = await buscarUsuarioPorIdEBpo({
      supabase,
      usuarioId: body.responsavelPadraoId,
      bpoId: user.bpoId,
    });

    if (errResponsavel) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: errResponsavel.message } },
        { status: 500 }
      );
    }

    if (!responsavel) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "RESPONSAVEL_INVALIDO",
            message: "responsavelPadraoId deve pertencer ao mesmo BPO do usuário autenticado.",
          },
        },
        { status: 400 }
      );
    }
  }

  const { data: rotinaCliente, error: errRotina } = await supabase
    .from("rotinas_cliente")
    .insert({
      bpo_id: user.bpoId,
      cliente_id: clienteId,
      rotina_modelo_id: body.rotinaModeloId,
      data_inicio: body.dataInicio,
      frequencia,
      responsavel_padrao_id: body.responsavelPadraoId ?? null,
      prioridade,
    })
    .select("id, cliente_id, rotina_modelo_id, data_inicio, frequencia, responsavel_padrao_id, prioridade, created_at, updated_at")
    .single();

  if (errRotina || !rotinaCliente) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errRotina?.message ?? "Falha ao criar rotina." } },
      { status: 500 }
    );
  }

  const rc = rotinaCliente as RotinaClienteSelectRow;
  const { count, error: errGerar } = await gerarTarefasRecorrentes({
    supabase,
    rotinaClienteId: rc.id,
    bpoId: user.bpoId,
    clienteId,
    rotinaModeloId: body.rotinaModeloId,
    dataInicio: body.dataInicio,
    frequencia,
    responsavelPadraoId: body.responsavelPadraoId ?? null,
    prioridade,
    tituloModelo: modelo.nome,
  });

  if (errGerar) {
    await limparRotinaIncompleta({ supabase, rotinaClienteId: rc.id });

    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errGerar } },
      { status: 500 }
    );
  }

  const rotinaClienteApi: RotinaCliente = {
    id: rc.id,
    clienteId: rc.cliente_id,
    rotinaModeloId: rc.rotina_modelo_id,
    dataInicio: rc.data_inicio,
    frequencia: rc.frequencia as Frequencia,
    responsavelPadraoId: rc.responsavel_padrao_id,
    prioridade: rc.prioridade as Prioridade,
    criadoEm: rc.created_at,
    atualizadoEm: rc.updated_at,
  };

  return NextResponse.json(
    {
      data: {
        rotinaCliente: rotinaClienteApi,
        tarefasGeradas: count,
      },
      error: null,
    },
    { status: 201 }
  );
}
