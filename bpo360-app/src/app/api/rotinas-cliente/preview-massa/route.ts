/**
 * Story 2.6: GET /api/rotinas-cliente/preview-massa — resumo antes de confirmar edição em massa.
 * Retorna contagem e lista resumida (id, cliente nome, modelo nome) para exibir "As seguintes N rotinas serão atualizadas".
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAssignMass } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (!canAssignMass(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Apenas gestor ou admin." } },
      { status: 403 }
    );
  }

  const idsParam = request.nextUrl.searchParams.get("ids");
  const ids = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "ids obrigatório (ids=id1,id2,...)." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("rotinas_cliente")
    .select("id, cliente_id, rotina_modelo_id")
    .in("id", ids)
    .eq("bpo_id", user.bpoId);

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const list = (rows ?? []) as { id: string; cliente_id: string; rotina_modelo_id: string }[];
  if (list.length === 0) {
    return NextResponse.json({
      data: { total: 0, rotinas: [] },
      error: null,
    });
  }

  const clienteIds = [...new Set(list.map((r) => r.cliente_id))];
  const modeloIds = [...new Set(list.map((r) => r.rotina_modelo_id))];

  const [clientesRes, modelosRes] = await Promise.all([
    supabase.from("clientes").select("id, nome_fantasia, razao_social").in("id", clienteIds),
    supabase.from("rotinas_modelo").select("id, nome").in("id", modeloIds),
  ]);

  const clientesMap = new Map<string, string>();
  for (const c of clientesRes.data ?? []) {
    const row = c as { id: string; nome_fantasia: string | null; razao_social: string | null };
    clientesMap.set(row.id, row.nome_fantasia || row.razao_social || row.id);
  }
  const modelosMap = new Map<string, string>();
  for (const m of modelosRes.data ?? []) {
    const row = m as { id: string; nome: string };
    modelosMap.set(row.id, row.nome);
  }

  const rotinas = list.map((r) => ({
    id: r.id,
    clienteNome: clientesMap.get(r.cliente_id) ?? r.cliente_id,
    modeloNome: modelosMap.get(r.rotina_modelo_id) ?? r.rotina_modelo_id,
  }));

  return NextResponse.json({
    data: { total: rotinas.length, rotinas },
    error: null,
  });
}
