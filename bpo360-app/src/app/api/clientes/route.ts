/**
 * Route Handler: /api/clientes
 * Story 1.2: GET lista clientes do BPO | POST cria novo cliente
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { normalizarCnpj, validarFormatoCnpj } from "@/lib/domain/clientes/cnpj";
import {
  buscarClientePorCnpjEBpo,
  buscarUsuarioPorIdEBpo,
} from "@/lib/domain/clientes/repository";
import type { Cliente, ClienteRow, NovoClienteInput } from "@/lib/domain/clientes/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── GET /api/clientes ────────────────────────────────────────────────────────

const STATUS_VALIDOS = ["Ativo", "Em implantação", "Pausado", "Encerrado"] as const;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (user.role === "cliente_final") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") ?? "").trim();
  const statusParam = searchParams.get("status") ?? "";
  const status = STATUS_VALIDOS.includes(statusParam as (typeof STATUS_VALIDOS)[number])
    ? statusParam
    : "";
  const tagsParam = searchParams.get("tags") ?? "";
  const tagsArray = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const responsavelInternoId = (searchParams.get("responsavelInternoId") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select(
      "id, bpo_id, cnpj, razao_social, nome_fantasia, email, telefone, responsavel_interno_id, receita_estimada, status, tags, created_at, updated_at",
      { count: "exact" }
    )
    .eq("bpo_id", user.bpoId);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `nome_fantasia.ilike.${term},razao_social.ilike.${term},cnpj.ilike.${term}`
    );
  }
  if (status) query = query.eq("status", status);
  if (tagsArray.length > 0) query = query.contains("tags", tagsArray);
  if (responsavelInternoId) query = query.eq("responsavel_interno_id", responsavelInternoId);

  const { data, error, count } = await query
    .order("razao_social", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const clientes = (data ?? []).map(rowToCliente);
  return NextResponse.json({
    data: { clientes, total: count ?? 0, page, limit },
    error: null,
  });
}

// ─── POST /api/clientes ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
      { status: 401 }
    );
  }
  if (user.role === "cliente_final") {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
      { status: 403 }
    );
  }

  let body: NovoClienteInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Corpo da requisição inválido." } },
      { status: 400 }
    );
  }

  // Validação de campos obrigatórios
  const { cnpj, razaoSocial, nomeFantasia, email } = body;
  if (!cnpj || !razaoSocial || !nomeFantasia || !email) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CAMPOS_OBRIGATORIOS",
          message: "Os campos cnpj, razaoSocial, nomeFantasia e email são obrigatórios.",
        },
      },
      { status: 400 }
    );
  }

  // Validação de formato do e-mail
  if (!EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "EMAIL_INVALIDO", message: "E-mail inválido. Verifique o formato e tente novamente." },
      },
      { status: 400 }
    );
  }

  // Validação de formato do CNPJ
  const cnpjNormalizado = normalizarCnpj(cnpj);
  if (!validarFormatoCnpj(cnpjNormalizado)) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "CNPJ_INVALIDO", message: "CNPJ inválido. Verifique o formato e os dígitos verificadores." },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (body.responsavelInternoId) {
    const { data: responsavel, error: responsavelError } = await buscarUsuarioPorIdEBpo({
      supabase,
      usuarioId: body.responsavelInternoId,
      bpoId: user.bpoId,
    });

    if (responsavelError) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: responsavelError.message } },
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

  // Verificação de duplicidade (CNPJ normalizado + bpo_id)
  const { data: existente, error: dupError } = await buscarClientePorCnpjEBpo({
    supabase,
    bpoId: user.bpoId,
    cnpj: cnpjNormalizado,
  });

  if (dupError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: dupError.message } },
      { status: 500 }
    );
  }

  if (existente) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CNPJ_DUPLICADO",
          message: "Já existe um cliente com este CNPJ cadastrado.",
        },
      },
      { status: 409 }
    );
  }

  // Inserção
  const { data: novoCliente, error: insertError } = await supabase
    .from("clientes")
    .insert({
      bpo_id: user.bpoId,
      cnpj: cnpjNormalizado,
      razao_social: razaoSocial.trim(),
      nome_fantasia: nomeFantasia.trim(),
      email: email.trim().toLowerCase(),
      telefone: body.telefone ?? null,
      responsavel_interno_id: body.responsavelInternoId ?? null,
      receita_estimada: body.receitaEstimada ?? null,
      status: "Ativo",
      tags: body.tags ?? [],
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { data: null, error: { code: "DB_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: rowToCliente(novoCliente), error: null }, { status: 201 });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
