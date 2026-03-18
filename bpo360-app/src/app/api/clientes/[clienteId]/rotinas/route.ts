/**
 * Story 2.2: GET rotinas do cliente | POST aplicar modelo de rotina ao cliente.
 * Guard: admin_bpo, gestor_bpo, operador_bpo. Cliente e modelo devem ser do mesmo bpo_id.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import {
  buscarClientePorIdEBpo,
  buscarUsuarioPorIdEBpo,
} from "@/lib/domain/clientes/repository";
import { gerarTarefasRecorrentes } from "@/lib/domain/rotinas/gerar-tarefas-recorrentes";
import type { Frequencia, Prioridade, RotinaCliente } from "@/lib/domain/rotinas/types";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { AplicarRotinaSchema } from "@/lib/api/schemas/rotinas";

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
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { clienteId } = await context.params;
  if (!clienteId) return jsonError({ code: "BAD_REQUEST", message: "clienteId obrigatório." }, 400);

  const supabase = await createClient();
  const { data: cliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });
  if (!cliente) return jsonError({ code: "NOT_FOUND", message: "Cliente não encontrado." }, 404);

  const { data: rows, error } = await supabase
    .from("rotinas_cliente")
    .select("id, cliente_id, rotina_modelo_id, data_inicio, frequencia, responsavel_padrao_id, prioridade, created_at, updated_at")
    .eq("cliente_id", clienteId)
    .eq("bpo_id", user.bpoId)
    .order("created_at", { ascending: false });

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);

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

  return jsonSuccess({ rotinas });
}

// ─── POST /api/clientes/[clienteId]/rotinas ───────────────────────────────────

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { clienteId } = await context.params;
  if (!clienteId) return jsonError({ code: "BAD_REQUEST", message: "clienteId obrigatório." }, 400);

  const parsed = await parseBody(request, AplicarRotinaSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const frequencia = body.frequencia ?? "mensal";
  const prioridade = body.prioridade ?? "media";

  const supabase = await createClient();

  const { data: cliente } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });
  if (!cliente) return jsonError({ code: "NOT_FOUND", message: "Cliente não encontrado." }, 404);

  const { data: modelo, error: errModelo } = await supabase
    .from("rotinas_modelo")
    .select("id, nome, bpo_id")
    .eq("id", body.rotinaModeloId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (errModelo || !modelo)
    return jsonError({ code: "NOT_FOUND", message: "Modelo de rotina não encontrado ou não pertence ao seu BPO." }, 404);

  if (body.responsavelPadraoId) {
    const { data: responsavel, error: errResponsavel } = await buscarUsuarioPorIdEBpo({
      supabase,
      usuarioId: body.responsavelPadraoId,
      bpoId: user.bpoId,
    });

    if (errResponsavel) return jsonError({ code: "DB_ERROR", message: errResponsavel.message }, 500);
    if (!responsavel)
      return jsonError({
        code: "RESPONSAVEL_INVALIDO",
        message: "responsavelPadraoId deve pertencer ao mesmo BPO do usuário autenticado.",
      }, 400);
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

  if (errRotina || !rotinaCliente)
    return jsonError({ code: "DB_ERROR", message: errRotina?.message ?? "Falha ao criar rotina." }, 500);

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
    return jsonError({ code: "DB_ERROR", message: errGerar }, 500);
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

  return jsonSuccess({ rotinaCliente: rotinaClienteApi, tarefasGeradas: count }, 201);
}
