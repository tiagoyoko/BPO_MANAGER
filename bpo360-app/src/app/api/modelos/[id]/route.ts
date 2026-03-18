/**
 * Route Handler: /api/modelos/[id]
 * Story 2.1: GET um modelo | PATCH atualizar (nome, descrição, periodicidade, tipoServico, itens) | DELETE.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import type {
  RotinaModelo,
  RotinaModeloRow,
  RotinaModeloChecklistItemRow,
  NovoItemChecklistInput,
} from "@/lib/domain/rotinas/types";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { AtualizarRotinaModeloSchema } from "@/lib/api/schemas/modelos";

async function getModeloComItens(
  supabase: Awaited<ReturnType<typeof createClient>>,
  modeloId: string,
  bpoId: string
): Promise<{ modelo: RotinaModeloRow | null; itens: RotinaModeloChecklistItemRow[] }> {
  const { data: modelo, error: errM } = await supabase
    .from("rotinas_modelo")
    .select("*")
    .eq("id", modeloId)
    .eq("bpo_id", bpoId)
    .maybeSingle();

  if (errM || !modelo) return { modelo: null, itens: [] };

  const { data: itens, error: errI } = await supabase
    .from("rotina_modelo_checklist_itens")
    .select("id, titulo, descricao, obrigatorio, ordem")
    .eq("rotina_modelo_id", modeloId)
    .order("ordem", { ascending: true });

  if (errI) return { modelo: modelo as RotinaModeloRow, itens: [] };
  return { modelo: modelo as RotinaModeloRow, itens: (itens ?? []) as RotinaModeloChecklistItemRow[] };
}

function toRotinaModelo(row: RotinaModeloRow, itens: RotinaModeloChecklistItemRow[]): RotinaModelo {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? null,
    periodicidade: row.periodicidade as RotinaModelo["periodicidade"],
    tipoServico: row.tipo_servico ?? null,
    itensChecklist: itens.map((i) => ({
      titulo: i.titulo,
      descricao: i.descricao ?? null,
      obrigatorio: i.obrigatorio,
      ordem: i.ordem,
    })),
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  };
}

// ─── GET /api/modelos/[id] ────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { id } = await context.params;
  const supabase = await createClient();
  const { modelo, itens } = await getModeloComItens(supabase, id, user.bpoId);

  if (!modelo) return jsonError({ code: "NOT_FOUND", message: "Modelo não encontrado." }, 404);

  return jsonSuccess(toRotinaModelo(modelo, itens));
}

// ─── PATCH /api/modelos/[id] ───────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { id } = await context.params;
  const parsed = await parseBody(request, AtualizarRotinaModeloSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const supabase = await createClient();
  const { modelo: existente } = await getModeloComItens(supabase, id, user.bpoId);
  if (!existente) return jsonError({ code: "NOT_FOUND", message: "Modelo não encontrado." }, 404);

  const updates: Partial<RotinaModeloRow> = {};
  if (body.nome !== undefined) updates.nome = body.nome.trim();
  if (body.descricao !== undefined) updates.descricao = body.descricao?.trim() || null;
  if (body.periodicidade !== undefined) updates.periodicidade = body.periodicidade;
  if (body.tipoServico !== undefined) updates.tipo_servico = body.tipoServico?.trim() || null;

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("rotinas_modelo")
      .update(updates)
      .eq("id", id)
      .eq("bpo_id", user.bpoId);
    if (updateError) return jsonError({ code: "DB_ERROR", message: updateError.message }, 500);
  }

  if (body.itensChecklist !== undefined) {
    const itens = body.itensChecklist as NovoItemChecklistInput[];
    const validados = itens.map((item, index) => ({
      titulo: typeof item.titulo === "string" ? item.titulo.trim() : "",
      descricao: item.descricao != null ? String(item.descricao).trim() || null : null,
      obrigatorio: item.obrigatorio !== false,
      ordem: index,
    }));
    if (validados.some((i) => !i.titulo)) {
      return jsonError(
        { code: "CHECKLIST_INVALIDO", message: "Cada item do checklist deve ter um título não vazio." },
        400
      );
    }

    const { error: delError } = await supabase
      .from("rotina_modelo_checklist_itens")
      .delete()
      .eq("rotina_modelo_id", id);
    if (delError) return jsonError({ code: "DB_ERROR", message: delError.message }, 500);

    if (validados.length > 0) {
      const itensRows = validados.map((item) => ({
        rotina_modelo_id: id,
        titulo: item.titulo,
        descricao: item.descricao,
        obrigatorio: item.obrigatorio,
        ordem: item.ordem,
      }));
      const { error: insertError } = await supabase
        .from("rotina_modelo_checklist_itens")
        .insert(itensRows);
      if (insertError) return jsonError({ code: "DB_ERROR", message: insertError.message }, 500);
    }
  }

  const { modelo: atualizado, itens: itensAtualizados } = await getModeloComItens(
    supabase,
    id,
    user.bpoId
  );
  if (!atualizado) {
    return jsonError({ code: "DB_ERROR", message: "Modelo não encontrado após atualização." }, 500);
  }

  return jsonSuccess(toRotinaModelo(atualizado, itensAtualizados));
}

// ─── DELETE /api/modelos/[id] ───────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  if (!canAccessModelos(user)) return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);

  const { id } = await context.params;
  const supabase = await createClient();
  const { data: modelo } = await supabase
    .from("rotinas_modelo")
    .select("id")
    .eq("id", id)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (!modelo) return jsonError({ code: "NOT_FOUND", message: "Modelo não encontrado." }, 404);

  const { error } = await supabase
    .from("rotinas_modelo")
    .delete()
    .eq("id", id)
    .eq("bpo_id", user.bpoId);

  if (error) return jsonError({ code: "DB_ERROR", message: error.message }, 500);

  return new NextResponse(null, { status: 204 });
}
