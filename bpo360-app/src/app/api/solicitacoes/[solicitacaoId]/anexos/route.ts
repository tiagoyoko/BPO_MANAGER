/**
 * Story 3.2: GET lista anexos da solicitação; POST upload de anexos.
 * BPO e cliente_final (só própria solicitação para cliente).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canAccessModelos } from "@/lib/auth/rbac";

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

export type AnexoItem = {
  id: string;
  solicitacaoId: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
  createdAt: string;
  storageKey: string;
};

// ─── GET /api/solicitacoes/[solicitacaoId]/anexos ────────────────────────────

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  const isClienteFinal = user.role === "cliente_final";
  if (!isClienteFinal && !canAccessModelos(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }
  if (isClienteFinal && !user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Cliente não identificado." } },
      { status: 403 }
    );
  }

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: sol } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, bpo_id")
    .eq("id", solicitacaoId)
    .maybeSingle();

  if (!sol) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Solicitação não encontrada." } },
      { status: 404 }
    );
  }
  const row = sol as { id: string; cliente_id: string; bpo_id: string };
  if (isClienteFinal && row.cliente_id !== user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado a esta solicitação." } },
      { status: 403 }
    );
  }

  const { data: rows, error } = await supabase
    .from("documentos")
    .select("id, solicitacao_id, nome_arquivo, tipo_mime, tamanho, created_at, storage_key")
    .eq("solicitacao_id", solicitacaoId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const list: AnexoItem[] = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    solicitacaoId: r.solicitacao_id as string,
    nomeArquivo: r.nome_arquivo as string,
    tipoMime: r.tipo_mime as string,
    tamanho: Number(r.tamanho),
    createdAt: (r.created_at as string),
    storageKey: r.storage_key as string,
  }));

  return NextResponse.json({ data: { anexos: list }, error: null });
}

// ─── POST /api/solicitacoes/[solicitacaoId]/anexos ───────────────────────────

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ solicitacaoId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  const isClienteFinal = user.role === "cliente_final";
  if (!isClienteFinal && !canAccessModelos(user)) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }
  if (isClienteFinal && !user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Cliente não identificado." } },
      { status: 403 }
    );
  }

  const { solicitacaoId } = await context.params;
  if (!solicitacaoId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "solicitacaoId é obrigatório." } },
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
  const { data: sol } = await supabase
    .from("solicitacoes")
    .select("id, cliente_id, bpo_id")
    .eq("id", solicitacaoId)
    .maybeSingle();

  if (!sol) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Solicitação não encontrada." } },
      { status: 404 }
    );
  }
  const solRow = sol as { id: string; cliente_id: string; bpo_id: string };
  if (isClienteFinal && solRow.cliente_id !== user.clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado a esta solicitação." } },
      { status: 403 }
    );
  }

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
  const storagePath = `${solRow.bpo_id}/${solRow.cliente_id}/${solicitacaoId}/${uuid}_${safeName}`;

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
      bpo_id: solRow.bpo_id,
      cliente_id: solRow.cliente_id,
      solicitacao_id: solicitacaoId,
      storage_key: storagePath,
      nome_arquivo: fileName,
      tipo_mime: mime,
      tamanho: file.size,
      criado_por_id: user.id,
    })
    .select("id, solicitacao_id, nome_arquivo, tipo_mime, tamanho, created_at, storage_key")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  const r = doc as Record<string, unknown>;
  const anexo: AnexoItem = {
    id: r.id as string,
    solicitacaoId: r.solicitacao_id as string,
    nomeArquivo: r.nome_arquivo as string,
    tipoMime: r.tipo_mime as string,
    tamanho: Number(r.tamanho),
    createdAt: r.created_at as string,
    storageKey: r.storage_key as string,
  };

  return NextResponse.json({ data: anexo, error: null }, { status: 201 });
}
