/**
 * Route Handler: /api/modelos/[id]
 * Story 2.1: GET um modelo | PATCH atualizar (nome, descrição, periodicidade, tipoServico, itens) | DELETE.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import {
  isPeriodicidadeValida,
  type AtualizarRotinaModeloInput,
  type RotinaModelo,
  type RotinaModeloRow,
  type RotinaModeloChecklistItemRow,
  type NovoItemChecklistInput,
} from "@/lib/domain/rotinas/types";

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

  const { id } = await context.params;
  const supabase = await createClient();
  const { modelo, itens } = await getModeloComItens(supabase, id, user.bpoId);

  if (!modelo) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Modelo não encontrado." } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: toRotinaModelo(modelo, itens),
    error: null,
  });
}

// ─── PATCH /api/modelos/[id] ───────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

  const { id } = await context.params;
  let body: AtualizarRotinaModeloInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  if (body.periodicidade !== undefined && !isPeriodicidadeValida(body.periodicidade)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "PERIODICIDADE_INVALIDA",
          message: "periodicidade deve ser uma de: diaria, semanal, mensal, custom.",
        },
      },
      { status: 400 }
    );
  }

  if (body.nome !== undefined && typeof body.nome === "string" && !body.nome.trim()) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "CAMPOS_OBRIGATORIOS", message: "O campo nome é obrigatório." },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { modelo: existente } = await getModeloComItens(supabase, id, user.bpoId);
  if (!existente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Modelo não encontrado." } },
      { status: 404 }
    );
  }

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
    if (updateError) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: updateError.message } },
        { status: 500 }
      );
    }
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
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "CHECKLIST_INVALIDO",
            message: "Cada item do checklist deve ter um título não vazio.",
          },
        },
        { status: 400 }
      );
    }

    const { error: delError } = await supabase
      .from("rotina_modelo_checklist_itens")
      .delete()
      .eq("rotina_modelo_id", id);
    if (delError) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: delError.message } },
        { status: 500 }
      );
    }

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
      if (insertError) {
        return NextResponse.json(
          { data: null, error: { code: "DB_ERROR", message: insertError.message } },
          { status: 500 }
        );
      }
    }
  }

  const { modelo: atualizado, itens: itensAtualizados } = await getModeloComItens(
    supabase,
    id,
    user.bpoId
  );
  if (!atualizado) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: "Modelo não encontrado após atualização." } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: toRotinaModelo(atualizado, itensAtualizados),
    error: null,
  });
}

// ─── DELETE /api/modelos/[id] ───────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

  const { id } = await context.params;
  const supabase = await createClient();
  const { data: modelo } = await supabase
    .from("rotinas_modelo")
    .select("id")
    .eq("id", id)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (!modelo) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Modelo não encontrado." } },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("rotinas_modelo")
    .delete()
    .eq("id", id)
    .eq("bpo_id", user.bpoId);

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
