/**
 * Route Handler: /api/clientes
 * Story 1.2: GET lista clientes do BPO | POST cria novo cliente
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { normalizarCnpj, validarFormatoCnpj } from "@/lib/domain/clientes/cnpj";
import {
  buscarClientePorCnpjEBpo,
  buscarUsuarioPorIdEBpo,
} from "@/lib/domain/clientes/repository";
import type { Cliente, ClienteRow } from "@/lib/domain/clientes/types";
import { computarErpDetalhes, computarErpStatus } from "@/lib/domain/clientes/erp-status";
import type { ErpStatusCliente } from "@/lib/domain/clientes/types";
import { jsonSuccess, jsonError, parseBody } from "@/types/api";
import { NovoClienteSchema } from "@/lib/api/schemas/clientes";

// ─── GET /api/clientes ────────────────────────────────────────────────────────

const STATUS_VALIDOS = ["Ativo", "Em implantação", "Pausado", "Encerrado"] as const;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  }
  if (user.role === "cliente_final") {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
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
  const erpStatusParam = (searchParams.get("erpStatus") ?? "").trim();
  const erpStatus: ErpStatusCliente | "" =
    erpStatusParam === "nao_configurado" ||
    erpStatusParam === "config_basica_salva" ||
    erpStatusParam === "integracao_ativa"
      ? erpStatusParam
      : "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // Filtro por erpStatus: subquery em integracoes_erp para obter cliente_ids (Story 1.7)
  let clienteIdsFiltro: string[] = [];
  if (erpStatus === "nao_configurado") {
    const { data: comErp } = await supabase
      .from("integracoes_erp")
      .select("cliente_id")
      .eq("bpo_id", user.bpoId);
    const idsComErp = (comErp ?? []).map((r: { cliente_id: string }) => r.cliente_id);
    clienteIdsFiltro = idsComErp;
  } else if (erpStatus === "config_basica_salva") {
    const [{ data: comAtivo }, { data: comBasica }] = await Promise.all([
      supabase
        .from("integracoes_erp")
        .select("cliente_id")
        .eq("bpo_id", user.bpoId)
        .eq("ativo", true),
      supabase
        .from("integracoes_erp")
        .select("cliente_id")
        .eq("bpo_id", user.bpoId)
        .eq("ativo", false),
    ]);
    const idsComAtivo = new Set((comAtivo ?? []).map((r: { cliente_id: string }) => r.cliente_id));
    clienteIdsFiltro = (comBasica ?? [])
      .map((r: { cliente_id: string }) => r.cliente_id)
      .filter((id) => !idsComAtivo.has(id));
  } else if (erpStatus === "integracao_ativa") {
    const { data: ativos } = await supabase
      .from("integracoes_erp")
      .select("cliente_id")
      .eq("bpo_id", user.bpoId)
      .eq("ativo", true);
    clienteIdsFiltro = (ativos ?? []).map((r: { cliente_id: string }) => r.cliente_id);
  }

  let query = supabase
    .from("clientes")
    .select(
      "id, bpo_id, cnpj, razao_social, nome_fantasia, email, telefone, responsavel_interno_id, receita_estimada, status, tags, created_at, updated_at, integracoes_erp(id, tipo_erp, ativo, token_configurado_em)",
      { count: "exact" }
    )
    .eq("bpo_id", user.bpoId);

  if (erpStatus === "nao_configurado" && clienteIdsFiltro.length > 0) {
    query = query.not("id", "in", `(${clienteIdsFiltro.join(",")})`);
  } else if (erpStatus === "nao_configurado" && clienteIdsFiltro.length === 0) {
    // Nenhum cliente tem ERP: não restringir por id (todos sem ERP)
  } else if ((erpStatus === "config_basica_salva" || erpStatus === "integracao_ativa") && clienteIdsFiltro.length === 0) {
    query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // lista vazia
  } else if ((erpStatus === "config_basica_salva" || erpStatus === "integracao_ativa") && clienteIdsFiltro.length > 0) {
    query = query.in("id", clienteIdsFiltro);
  }

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
    return jsonError({ code: "DB_ERROR", message: error.message }, 500);
  }

  const clientes = (data ?? []).map(rowToClienteComErp);
  return jsonSuccess({ clientes, total: count ?? 0, page, limit });
}

// ─── POST /api/clientes ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError({ code: "UNAUTHORIZED", message: "Não autenticado." }, 401);
  }
  if (user.role === "cliente_final") {
    return jsonError({ code: "FORBIDDEN", message: "Acesso negado." }, 403);
  }

  const parsed = await parseBody(request, NovoClienteSchema);
  if (!parsed.success) return parsed.response;
  const body = parsed.data;

  const { cnpj, razaoSocial, nomeFantasia, email } = body;
  const cnpjNormalizado = normalizarCnpj(cnpj);
  if (!validarFormatoCnpj(cnpjNormalizado)) {
    return jsonError(
      { code: "CNPJ_INVALIDO", message: "CNPJ inválido. Verifique o formato e os dígitos verificadores." },
      400
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
      return jsonError({ code: "DB_ERROR", message: responsavelError.message }, 500);
    }

    if (!responsavel) {
      return jsonError(
        { code: "RESPONSAVEL_INVALIDO", message: "responsavelInternoId deve pertencer ao mesmo BPO do usuário autenticado." },
        400
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
    return jsonError({ code: "DB_ERROR", message: dupError.message }, 500);
  }

  if (existente) {
    return jsonError(
      { code: "CNPJ_DUPLICADO", message: "Já existe um cliente com este CNPJ cadastrado." },
      409
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
    return jsonError({ code: "DB_ERROR", message: insertError.message }, 500);
  }

  return jsonSuccess(rowToCliente(novoCliente), 201);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type IntegracaoErpJoinRow = {
  id?: string;
  tipo_erp: string;
  ativo: boolean;
  token_configurado_em: string | null;
};

type ClienteRowComErp = ClienteRow & {
  integracoes_erp?: IntegracaoErpJoinRow[] | null;
};

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

function rowToClienteComErp(row: ClienteRowComErp): Cliente {
  const integracoes = Array.isArray(row.integracoes_erp) ? row.integracoes_erp : [];
  return {
    ...rowToCliente(row),
    erpStatus: computarErpStatus(integracoes),
    erpDetalhes: computarErpDetalhes(integracoes),
  };
}
