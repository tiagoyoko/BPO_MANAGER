/**
 * Route Handler: /api/modelos
 * Story 2.1: GET lista modelos do BPO | POST cria novo modelo de rotina com checklist.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import type {
  RotinaModeloResumo,
  RotinaModeloRow,
  RotinaModeloChecklistItemRow,
} from "@/lib/domain/rotinas/types";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { NovoRotinaModeloSchema } from "@/lib/api/schemas/modelos";
type RotinaModeloListRow = {
  id: string;
  nome: string;
  descricao: string | null;
  periodicidade: string;
  tipo_servico: string | null;
  created_at: string;
};

// ─── GET /api/modelos ────────────────────────────────────────────────────────

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("rotinas_modelo")
    .select("id, nome, descricao, periodicidade, tipo_servico, created_at")
    .eq("bpo_id", user.bpoId)
    .order("nome", { ascending: true });

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);

  const ids = ((rows ?? []) as RotinaModeloListRow[]).map((r) => r.id);
  const contagemItens: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: itens } = await supabase
      .from("rotina_modelo_checklist_itens")
      .select("rotina_modelo_id")
      .in("rotina_modelo_id", ids);
    const lista = (itens ?? []) as { rotina_modelo_id: string }[];
    lista.forEach((item) => {
      contagemItens[item.rotina_modelo_id] = (contagemItens[item.rotina_modelo_id] ?? 0) + 1;
    });
  }

  const modelos: RotinaModeloResumo[] = ((rows ?? []) as RotinaModeloListRow[]).map((r) => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao ?? null,
    periodicidade: r.periodicidade as RotinaModeloResumo["periodicidade"],
    tipoServico: r.tipo_servico ?? null,
    qtdItensChecklist: contagemItens[r.id] ?? 0,
    criadoEm: r.created_at,
  }));

  return jsonSuccess({ modelos });
}

// ─── POST /api/modelos ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const parsed = await parseBody(request, NovoRotinaModeloSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const nome = body.nome.trim();
  const itensChecklist = body.itensChecklist;
  const itensValidados = itensChecklist.map((item, index) => ({
    titulo: item.titulo.trim(),
    descricao: item.descricao != null ? String(item.descricao).trim() || null : null,
    obrigatorio: item.obrigatorio !== false,
    ordem: index,
  }));

  const supabase = await createClient();
  const { data: modelo, error: insertModeloError } = await supabase
    .from("rotinas_modelo")
    .insert({
      bpo_id: user.bpoId,
      nome,
      descricao: body.descricao?.trim() || null,
      periodicidade: body.periodicidade,
      tipo_servico: body.tipoServico?.trim() || null,
      criado_por_id: user.id,
    })
    .select()
    .single();

  if (insertModeloError) return jsonError({ code: "DB_ERROR", message: insertModeloError.message }, 500);

  const modeloRow = modelo as RotinaModeloRow;
  if (itensValidados.length > 0) {
    const itensRows = itensValidados.map((item) => ({
      rotina_modelo_id: modeloRow.id,
      titulo: item.titulo,
      descricao: item.descricao,
      obrigatorio: item.obrigatorio,
      ordem: item.ordem,
    }));
    const { error: insertItensError } = await supabase
      .from("rotina_modelo_checklist_itens")
      .insert(itensRows);

    if (insertItensError) {
      await supabase.from("rotinas_modelo").delete().eq("id", modeloRow.id);
      return jsonError({ code: "DB_ERROR", message: insertItensError.message }, 500);
    }
  }

  const { data: itensInseridos } = await supabase
    .from("rotina_modelo_checklist_itens")
    .select("id, titulo, descricao, obrigatorio, ordem")
    .eq("rotina_modelo_id", modeloRow.id)
    .order("ordem", { ascending: true });

  const itens = ((itensInseridos ?? []) as RotinaModeloChecklistItemRow[]).map((row) => ({
    titulo: row.titulo,
    descricao: row.descricao ?? null,
    obrigatorio: row.obrigatorio,
    ordem: row.ordem,
  }));

  return jsonSuccess(
    {
      id: modeloRow.id,
      nome: modeloRow.nome,
      descricao: modeloRow.descricao ?? null,
      periodicidade: modeloRow.periodicidade,
      tipoServico: modeloRow.tipo_servico ?? null,
      itensChecklist: itens,
      criadoEm: modeloRow.created_at,
    },
    201
  );
}
