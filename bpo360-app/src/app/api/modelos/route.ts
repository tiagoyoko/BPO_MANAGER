/**
 * Route Handler: /api/modelos
 * Story 2.1: GET lista modelos do BPO | POST cria novo modelo de rotina com checklist.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import {
  isPeriodicidadeValida,
  type NovoRotinaModeloInput,
  type RotinaModeloResumo,
  type RotinaModeloRow,
  type RotinaModeloChecklistItemRow,
} from "@/lib/domain/rotinas/types";
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

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("rotinas_modelo")
    .select("id, nome, descricao, periodicidade, tipo_servico, created_at")
    .eq("bpo_id", user.bpoId)
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

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

  return NextResponse.json({ data: { modelos }, error: null });
}

// ─── POST /api/modelos ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
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

  let body: NovoRotinaModeloInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (!nome) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "CAMPOS_OBRIGATORIOS", message: "O campo nome é obrigatório." },
      },
      { status: 400 }
    );
  }

  if (!isPeriodicidadeValida(body.periodicidade)) {
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

  const itensChecklist = Array.isArray(body.itensChecklist) ? body.itensChecklist : [];
  const itensValidados = itensChecklist.map((item, index) => ({
    titulo: typeof item.titulo === "string" ? item.titulo.trim() : "",
    descricao: item.descricao != null ? String(item.descricao).trim() || null : null,
    obrigatorio: item.obrigatorio !== false,
    ordem: index,
  }));
  const invalidos = itensValidados.filter((i) => !i.titulo);
  if (invalidos.length > 0) {
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

  if (insertModeloError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: insertModeloError.message } },
      { status: 500 }
    );
  }

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
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: insertItensError.message } },
        { status: 500 }
      );
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

  return NextResponse.json(
    {
      data: {
        id: modeloRow.id,
        nome: modeloRow.nome,
        descricao: modeloRow.descricao ?? null,
        periodicidade: modeloRow.periodicidade,
        tipoServico: modeloRow.tipo_servico ?? null,
        itensChecklist: itens,
        criadoEm: modeloRow.created_at,
      },
      error: null,
    },
    { status: 201 }
  );
}
