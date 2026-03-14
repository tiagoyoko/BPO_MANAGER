/**
 * PATCH: editar cliente (dados e status). Apenas admin_bpo e gestor_bpo.
 * Story 1.3 — AC 1, 2, 3, 4, 5.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  buscarClientePorIdEBpo,
  buscarUsuarioPorIdEBpo,
} from "@/lib/domain/clientes/repository";
import type { Cliente, ClienteRow, StatusCliente } from "@/lib/domain/clientes/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_VALIDOS: StatusCliente[] = ["Ativo", "Em implantação", "Pausado", "Encerrado"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (user.role === "operador_bpo" || user.role === "cliente_final") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado" } },
      { status: 403 }
    );
  }

  const { clienteId } = await params;
  if (!clienteId) {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "clienteId obrigatório." } },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  if (body.cnpj !== undefined) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CNPJ_NAO_EDITAVEL",
          message: "CNPJ não pode ser alterado.",
        },
      },
      { status: 400 }
    );
  }

  const status = body.status as string | undefined;
  if (status !== undefined && !STATUS_VALIDOS.includes(status as StatusCliente)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "STATUS_INVALIDO",
          message: "status deve ser um de: Ativo, Em implantação, Pausado, Encerrado.",
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: existente, error: fetchError } = await buscarClientePorIdEBpo({
    supabase,
    clienteId,
    bpoId: user.bpoId,
  });

  if (fetchError) {
    console.error("[PATCH /api/clientes/[clienteId]] fetch cliente:", fetchError.message);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "DB_ERROR",
          message: "Erro ao processar a solicitação. Tente novamente.",
        },
      },
      { status: 500 }
    );
  }

  if (!existente) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
      { status: 404 }
    );
  }

  if (body.responsavelInternoId !== undefined && body.responsavelInternoId !== null && body.responsavelInternoId !== "") {
    const { data: responsavel, error: responsavelError } = await buscarUsuarioPorIdEBpo({
      supabase,
      usuarioId: String(body.responsavelInternoId),
      bpoId: user.bpoId,
    });

    if (responsavelError) {
      console.error(
        "[PATCH /api/clientes/[clienteId]] fetch responsavel:",
        responsavelError.message
      );
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "DB_ERROR",
            message: "Erro ao processar a solicitação. Tente novamente.",
          },
        },
        { status: 500 }
      );
    }

    if (!responsavel) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "RESPONSAVEL_INVALIDO",
            message: "responsavelInternoId deve pertencer ao mesmo BPO do usuário autenticado.",
          },
        },
        { status: 400 }
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.razaoSocial !== undefined) updates.razao_social = String(body.razaoSocial).trim();
  if (body.nomeFantasia !== undefined) updates.nome_fantasia = String(body.nomeFantasia).trim();
  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "EMAIL_INVALIDO", message: "E-mail inválido." },
        },
        { status: 400 }
      );
    }
    updates.email = email;
  }
  if (body.telefone !== undefined) {
    const t = body.telefone;
    updates.telefone = t === null || t === "" ? null : String(t).trim();
  }
  if (body.responsavelInternoId !== undefined) {
    const r = body.responsavelInternoId;
    updates.responsavel_interno_id = r === null || r === "" ? null : String(r).trim();
  }
  if (body.receitaEstimada !== undefined) {
    if (body.receitaEstimada === null || body.receitaEstimada === "") {
      updates.receita_estimada = null;
    } else {
      const val = Number(body.receitaEstimada);
      if (isNaN(val)) {
        return NextResponse.json(
          { data: null, error: { code: "RECEITA_INVALIDA", message: "receitaEstimada deve ser um número." } },
          { status: 400 }
        );
      }
      updates.receita_estimada = val;
    }
  }
  if (body.tags !== undefined) {
    updates.tags = Array.isArray(body.tags) ? body.tags : [];
  }
  if (body.status !== undefined) updates.status = body.status;
  // updated_at é gerenciado pelo trigger SQL (set_updated_at)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ data: rowToCliente(existente), error: null });
  }

  const { data: atualizado, error: updateError } = await supabase
    .from("clientes")
    .update(updates)
    .eq("id", clienteId)
    .eq("bpo_id", user.bpoId)
    .select(
      "id, bpo_id, cnpj, razao_social, nome_fantasia, email, telefone, responsavel_interno_id, receita_estimada, status, tags, created_at, updated_at"
    )
    .single();

  if (updateError) {
    console.error("[PATCH /api/clientes/[clienteId]] update:", updateError.message);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "DB_ERROR",
          message: "Erro ao processar a solicitação. Tente novamente.",
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: rowToCliente(atualizado), error: null });
}

function rowToCliente(row: ClienteRow): Cliente {
  return {
    id: row.id,
    bpoId: row.bpo_id,
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia,
    email: row.email,
    telefone: row.telefone ?? null,
    responsavelInternoId: row.responsavel_interno_id ?? null,
    receitaEstimada: row.receita_estimada ?? null,
    status: row.status as Cliente["status"],
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
