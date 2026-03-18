/**
 * Story 2.5: POST /api/tarefas/atribuir-massa — atribuir responsável em massa.
 * AC 1, 2, 3, 4: guard admin/gestor; responsavelId mesmo BPO; falhas pontuais; histórico.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAssignMass } from "@/lib/auth/rbac";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { AtribuirMassaSchema } from "@/lib/api/schemas/tarefas";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAssignMass(user)) {
    return jsonError(
      { code: "FORBIDDEN", message: "Apenas gestor ou admin podem atribuir em massa." },
      403
    );
  }

  const parsed = await parseBody(request, AtribuirMassaSchema);
  if (!parsed.success) return parsed.response;
  const { tarefaIds, responsavelId } = parsed.data;

  const supabase = await createClient();

  const { data: responsavelRow, error: errResp } = await supabase
    .from("usuarios")
    .select("id, bpo_id, role")
    .eq("id", responsavelId)
    .single();

  if (errResp || !responsavelRow) {
    return jsonError({ code: "BAD_REQUEST", message: "Responsável não encontrado." }, 400);
  }

  const resp = responsavelRow as { id: string; bpo_id: string; role: string };
  if (resp.bpo_id !== user.bpoId) {
    return jsonError({ code: "BAD_REQUEST", message: "Responsável deve ser do mesmo BPO." }, 400);
  }
  if (!["operador_bpo", "gestor_bpo"].includes(resp.role)) {
    return jsonError(
      { code: "BAD_REQUEST", message: "Responsável deve ser operador ou gestor do BPO (não admin)." },
      400
    );
  }

  const falhas: { tarefaId: string; motivo: string }[] = [];
  let sucesso = 0;

  for (const tarefaId of tarefaIds) {
    try {
      const { data: tarefa, error: errTarefa } = await supabase
        .from("tarefas")
        .select("id, responsavel_id, bpo_id")
        .eq("id", tarefaId)
        .single();

      if (errTarefa || !tarefa) {
        falhas.push({ tarefaId, motivo: "Tarefa não encontrada." });
        continue;
      }

      const t = tarefa as { id: string; responsavel_id: string | null; bpo_id: string };
      if (t.bpo_id !== user.bpoId) {
        falhas.push({ tarefaId, motivo: "Tarefa de outro BPO." });
        continue;
      }

      const valorAnterior = t.responsavel_id ?? "";
      const valorNovo = responsavelId;

      const { error: errUpdate } = await supabase
        .from("tarefas")
        .update({ responsavel_id: responsavelId })
        .eq("id", tarefaId)
        .eq("bpo_id", user.bpoId);

      if (errUpdate) {
        falhas.push({ tarefaId, motivo: errUpdate.message });
        continue;
      }

      const { error: errHistorico } = await supabase.from("tarefa_historico").insert({
        tarefa_id: tarefaId,
        campo: "responsavel_id",
        valor_anterior: valorAnterior,
        valor_novo: valorNovo,
        usuario_id: user.id,
      });

      if (errHistorico) {
        await supabase
          .from("tarefas")
          .update({ responsavel_id: valorAnterior || null })
          .eq("id", tarefaId)
          .eq("bpo_id", user.bpoId);
        falhas.push({ tarefaId, motivo: `Falha ao registrar histórico: ${errHistorico.message}` });
        continue;
      }

      sucesso++;
    } catch (e) {
      falhas.push({
        tarefaId,
        motivo: e instanceof Error ? e.message : "Erro ao processar tarefa.",
      });
    }
  }

  return jsonSuccess({ sucesso, falhas });
}
