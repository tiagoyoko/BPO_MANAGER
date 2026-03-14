/**
 * Story 2.6: PATCH /api/rotinas-cliente/em-massa — edição em massa de rotinas_cliente.
 * AC 1, 3, 4: admin_bpo ou gestor_bpo; todas as rotinas do mesmo bpo_id; atualiza apenas rotinas_cliente (tarefas já geradas não são alteradas).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAssignMass } from "@/lib/auth/rbac";
import { buscarUsuarioPorIdEBpo } from "@/lib/domain/clientes/repository";
import type { Frequencia, Prioridade } from "@/lib/domain/rotinas/types";

const FREQUENCIAS_VALIDAS = ["diaria", "semanal", "mensal", "custom"] as const;
const PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"] as const;

function isFrequencia(x: string): x is Frequencia {
  return FREQUENCIAS_VALIDAS.includes(x as Frequencia);
}

function isPrioridade(x: string): x is Prioridade {
  return PRIORIDADES_VALIDAS.includes(x as Prioridade);
}

type Body = {
  rotinaClienteIds?: string[];
  prioridade?: string;
  responsavelPadraoId?: string | null;
  frequencia?: string;
  dataInicio?: string;
};

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAssignMass(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Apenas gestor ou admin podem editar rotinas em massa." } },
      { status: 403 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Body JSON inválido." } },
      { status: 400 }
    );
  }

  const rotinaClienteIds = Array.isArray(body.rotinaClienteIds)
    ? body.rotinaClienteIds.filter((id) => typeof id === "string")
    : [];

  if (rotinaClienteIds.length === 0) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "rotinaClienteIds obrigatório e não vazio." } },
      { status: 400 }
    );
  }

  const prioridade =
    body.prioridade !== undefined && body.prioridade !== null && body.prioridade !== ""
      ? body.prioridade.trim()
      : undefined;
  const frequencia =
    body.frequencia !== undefined && body.frequencia !== null && body.frequencia !== ""
      ? body.frequencia.trim()
      : undefined;
  const dataInicio =
    body.dataInicio !== undefined && body.dataInicio !== null && body.dataInicio !== ""
      ? body.dataInicio.trim()
      : undefined;
  const hasResponsavelPadraoId = Object.prototype.hasOwnProperty.call(body, "responsavelPadraoId");
  const responsavelPadraoId = hasResponsavelPadraoId
    ? typeof body.responsavelPadraoId === "string"
      ? body.responsavelPadraoId.trim()
      : null
    : undefined;

  if (prioridade !== undefined && !isPrioridade(prioridade)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "prioridade inválida." } },
      { status: 400 }
    );
  }
  if (frequencia !== undefined && !isFrequencia(frequencia)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "frequencia inválida." } },
      { status: 400 }
    );
  }
  if (dataInicio !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "dataInicio deve ser YYYY-MM-DD." } },
      { status: 400 }
    );
  }

  if (prioridade === undefined && frequencia === undefined && dataInicio === undefined && responsavelPadraoId === undefined) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Informe ao menos um campo para atualizar (prioridade, responsavelPadraoId, frequencia, dataInicio)." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (typeof responsavelPadraoId === "string" && responsavelPadraoId !== "") {
    const { data: responsavel } = await buscarUsuarioPorIdEBpo({
      supabase,
      usuarioId: responsavelPadraoId,
      bpoId: user.bpoId,
    });
    if (!responsavel) {
      return NextResponse.json(
        { data: null, error: { code: "BAD_REQUEST", message: "responsavelPadraoId deve pertencer ao mesmo BPO." } },
        { status: 400 }
      );
    }
  }

  const { data: rows, error: errFetch } = await supabase
    .from("rotinas_cliente")
    .select("id, bpo_id")
    .in("id", rotinaClienteIds);

  if (errFetch) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errFetch.message } },
      { status: 500 }
    );
  }

  const rowsList = (rows ?? []) as { id: string; bpo_id: string }[];
  const idsDoBpo = new Set(rowsList.filter((r) => r.bpo_id === user.bpoId).map((r) => r.id));
  const idsInvalidos = rotinaClienteIds.filter((id) => !idsDoBpo.has(id));

  if (idsInvalidos.length > 0) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "BAD_REQUEST",
          message: "Algumas rotinas não existem ou não pertencem ao seu BPO.",
          idsInvalidos,
        },
      },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (prioridade !== undefined) updates.prioridade = prioridade;
  if (frequencia !== undefined) updates.frequencia = frequencia;
  if (dataInicio !== undefined) updates.data_inicio = dataInicio;
  if (responsavelPadraoId !== undefined) updates.responsavel_padrao_id = responsavelPadraoId || null;

  const { data: updated, error: errUpdate } = await supabase
    .from("rotinas_cliente")
    .update(updates)
    .in("id", rotinaClienteIds)
    .eq("bpo_id", user.bpoId)
    .select("id, cliente_id, rotina_modelo_id, data_inicio, frequencia, responsavel_padrao_id, prioridade, created_at, updated_at");

  if (errUpdate) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: errUpdate.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      atualizadas: (updated ?? []).length,
      rotinas: updated ?? [],
    },
    error: null,
  });
}
