/**
 * Story 2.2: Geração de tarefas recorrentes a partir de uma rotina_cliente.
 * Política: gerar as próximas 12 ocorrências (diária = 12 dias, semanal = 12 semanas, mensal = 12 meses; custom = mensal).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Frequencia } from "./types";

const NUM_OCORRENCIAS = 12;

export type GerarTarefasParams = {
  supabase: SupabaseClient;
  rotinaClienteId: string;
  bpoId: string;
  clienteId: string;
  rotinaModeloId: string;
  dataInicio: string; // YYYY-MM-DD
  frequencia: Frequencia;
  responsavelPadraoId: string | null;
  prioridade: string;
  tituloModelo: string;
};

type ChecklistItemRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  obrigatorio: boolean;
  ordem: number;
};

function parseDateOnly(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonthsPreservingAnchor(date: Date, months: number, anchorDay: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12));
  const lastDayOfMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)
  ).getUTCDate();

  target.setUTCDate(Math.min(anchorDay, lastDayOfMonth));
  return target;
}

/** Calcula as datas de vencimento das próximas N ocorrências conforme frequência. */
export function calcularDatasOcorrencias(
  dataInicio: string,
  frequencia: Frequencia,
  n: number = NUM_OCORRENCIAS
): string[] {
  const dates: string[] = [];
  const baseDate = parseDateOnly(dataInicio);
  const anchorDay = baseDate.getUTCDate();

  for (let i = 0; i < n; i++) {
    const current =
      frequencia === "diaria"
        ? addDays(baseDate, i)
        : frequencia === "semanal"
          ? addDays(baseDate, i * 7)
          : addMonthsPreservingAnchor(baseDate, i, anchorDay);

    dates.push(current.toISOString().slice(0, 10));
  }

  return dates;
}

/**
 * Gera as próximas ocorrências de tarefas para uma rotina_cliente e copia os itens
 * do checklist do modelo para cada tarefa (ordem e obrigatoriedade preservados).
 * Retorna o número de tarefas criadas.
 */
export async function gerarTarefasRecorrentes(
  params: GerarTarefasParams
): Promise<{ count: number; error?: string }> {
  const {
    supabase,
    rotinaClienteId,
    bpoId,
    clienteId,
    rotinaModeloId,
    dataInicio,
    frequencia,
    responsavelPadraoId,
    prioridade,
    tituloModelo,
  } = params;

  const { data: itens, error: errItens } = await supabase
    .from("rotina_modelo_checklist_itens")
    .select("id, titulo, descricao, obrigatorio, ordem")
    .eq("rotina_modelo_id", rotinaModeloId)
    .order("ordem", { ascending: true });

  if (errItens) {
    return { count: 0, error: errItens.message };
  }

  const checklist = (itens ?? []) as ChecklistItemRow[];
  const datas = calcularDatasOcorrencias(dataInicio, frequencia);

  let count = 0;
  for (let i = 0; i < datas.length; i++) {
    const dataVencimento = datas[i];
    const titulo = datas.length > 1 ? `${tituloModelo} (${dataVencimento})` : tituloModelo;

    const { data: tarefa, error: errTarefa } = await supabase
      .from("tarefas")
      .insert({
        bpo_id: bpoId,
        cliente_id: clienteId,
        rotina_cliente_id: rotinaClienteId,
        titulo,
        data_vencimento: dataVencimento,
        status: "a_fazer",
        prioridade,
        responsavel_id: responsavelPadraoId,
      })
      .select("id")
      .single();

    if (errTarefa || !tarefa) {
      return { count, error: errTarefa?.message ?? "Falha ao inserir tarefa" };
    }

    for (let j = 0; j < checklist.length; j++) {
      const item = checklist[j];
      const { error: errItem } = await supabase.from("tarefa_checklist_itens").insert({
        tarefa_id: (tarefa as { id: string }).id,
        titulo: item.titulo,
        descricao: item.descricao,
        obrigatorio: item.obrigatorio,
        ordem: item.ordem,
        concluido: false,
      });
      if (errItem) {
        return { count, error: errItem.message };
      }
    }
    count++;
  }

  return { count };
}
