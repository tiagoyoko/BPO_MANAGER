/**
 * Story 3.4: GET lista documentos da tarefa; POST upload.
 * Resposta { data: [...] } camelCase; metadados: nome, tipo, tamanho, data, autor.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";
import type { DocumentoItem } from "@/types/documentos";

export type { DocumentoItem };

const BUCKET = "anexos-solicitacoes";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MIME_ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tarefaId: string }> }
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

  const { tarefaId } = await context.params;
  if (!tarefaId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "tarefaId é obrigatório." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("id, bpo_id, cliente_id")
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (!tarefa) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Tarefa não encontrada." } },
      { status: 404 }
    );
  }

  const { data: rows, error } = await supabase
    .from("documentos")
    .select("id, nome_arquivo, tipo_mime, tamanho, created_at, criado_por_id")
    .eq("tarefa_id", tarefaId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const criadoPorIds = Array.from(
    new Set(
      (rows ?? [])
        .map((r: Record<string, unknown>) => r.criado_por_id as string)
        .filter(Boolean)
    )
  );
  const autorPorId = new Map<string, string | null>();
  if (criadoPorIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nome")
      .in("id", criadoPorIds);
    for (const u of usuarios ?? []) {
      autorPorId.set((u as { id: string; nome: string | null }).id, (u as { id: string; nome: string | null }).nome);
    }
  }

  const list: DocumentoItem[] = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    nomeArquivo: r.nome_arquivo as string,
    tipoMime: r.tipo_mime as string,
    tamanho: Number(r.tamanho),
    createdAt: r.created_at as string,
    autor: autorPorId.get(r.criado_por_id as string) ?? null,
  }));

  return NextResponse.json({ data: list, error: null });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tarefaId: string }> }
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

  const { tarefaId } = await context.params;
  if (!tarefaId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "tarefaId é obrigatório." } },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Use multipart/form-data com campo 'file'." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("id, bpo_id, cliente_id")
    .eq("id", tarefaId)
    .eq("bpo_id", user.bpoId)
    .maybeSingle();

  if (!tarefa) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Tarefa não encontrada." } },
      { status: 404 }
    );
  }
  const t = tarefa as { id: string; bpo_id: string; cliente_id: string };

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Envie um arquivo no campo 'file'." } },
      { status: 400 }
    );
  }

  const fileName = file instanceof File ? file.name : "arquivo";
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { data: null, error: { code: "TAMANHO_MAXIMO", message: "Tamanho máximo por arquivo é 10 MB." } },
      { status: 400 }
    );
  }
  const mime = (file.type || "").toLowerCase();
  if (!MIME_ALLOWED.has(mime)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "TIPO_NAO_PERMITIDO",
          message: "Tipos permitidos: PDF, PNG, JPG, JPEG, XLSX, XLS, CSV.",
        },
      },
      { status: 400 }
    );
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "arquivo";
  const uuid = crypto.randomUUID();
  const storagePath = `${t.bpo_id}/${t.cliente_id}/tarefa_${tarefaId}/${uuid}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { data: null, error: { code: "UPLOAD_ERROR", message: uploadError.message } },
      { status: 500 }
    );
  }

  const { data: doc, error: insertError } = await supabase
    .from("documentos")
    .insert({
      bpo_id: t.bpo_id,
      cliente_id: t.cliente_id,
      solicitacao_id: null,
      tarefa_id: tarefaId,
      storage_key: storagePath,
      nome_arquivo: fileName,
      tipo_mime: mime,
      tamanho: file.size,
      criado_por_id: user.id,
    })
    .select("id, nome_arquivo, tipo_mime, tamanho, created_at, criado_por_id")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  const r = doc as Record<string, unknown>;
  const item: DocumentoItem = {
    id: r.id as string,
    nomeArquivo: r.nome_arquivo as string,
    tipoMime: r.tipo_mime as string,
    tamanho: Number(r.tamanho),
    createdAt: r.created_at as string,
    autor: user.nome ?? null,
  };

  return NextResponse.json({ data: item, error: null }, { status: 201 });
}
