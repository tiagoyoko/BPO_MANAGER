/**
 * Story 2.6: PATCH /api/rotinas-cliente/em-massa — edição em massa de rotinas_cliente.
 * AC 1, 3, 4: admin_bpo ou gestor_bpo; todas as rotinas do mesmo bpo_id; atualiza apenas rotinas_cliente (tarefas já geradas não são alteradas).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAssignMass } from "@/lib/auth/rbac";
import { buscarUsuarioPorIdEBpo } from "@/lib/domain/clientes/repository";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { RotinasEmMassaSchema } from "@/lib/api/schemas/rotinas";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAssignMass(user)) {
    return jsonError(
      { code: "FORBIDDEN", message: "Apenas gestor ou admin podem editar rotinas em massa." },
      403
    );
  }

  const parsed = await parseBody(request, RotinasEmMassaSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const rotinaClienteIds = body.rotinaClienteIds;
  const prioridade = body.prioridade;
  const frequencia = body.frequencia;
  const dataInicio = body.dataInicio;
  const responsavelPadraoId = body.responsavelPadraoId;

  const supabase = await createClient();

  if (responsavelPadraoId) {
    const { data: responsavel } = await buscarUsuarioPorIdEBpo({
      supabase,
      usuarioId: responsavelPadraoId,
      bpoId: user.bpoId,
    });
    if (!responsavel) {
      return jsonError(
        { code: "BAD_REQUEST", message: "responsavelPadraoId deve pertencer ao mesmo BPO." },
        400
      );
    }
  }

  const { data: rows, error: errFetch } = await supabase
    .from("rotinas_cliente")
    .select("id, bpo_id")
    .in("id", rotinaClienteIds);

  if (errFetch) return jsonError({ code: "DB_ERROR", message: errFetch.message }, 500);

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
  if (responsavelPadraoId !== undefined) updates.responsavel_padrao_id = responsavelPadraoId ?? null;

  const { data: updated, error: errUpdate } = await supabase
    .from("rotinas_cliente")
    .update(updates)
    .in("id", rotinaClienteIds)
    .eq("bpo_id", user.bpoId)
    .select("id, cliente_id, rotina_modelo_id, data_inicio, frequencia, responsavel_padrao_id, prioridade, created_at, updated_at");

  if (errUpdate) return jsonError({ code: "DB_ERROR", message: errUpdate.message }, 500);

  return jsonSuccess({
    atualizadas: (updated ?? []).length,
    rotinas: updated ?? [],
  });
}
