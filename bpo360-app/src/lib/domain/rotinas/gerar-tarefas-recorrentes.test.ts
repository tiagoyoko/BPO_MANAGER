/**
 * Story 2.2: Testes da lógica de geração de tarefas recorrentes.
 * Evidência: modelo diário gera datas consecutivas; semanal a cada 7 dias; mensal a cada mês.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calcularDatasOcorrencias,
  gerarTarefasRecorrentes,
  type GerarTarefasParams,
} from "./gerar-tarefas-recorrentes";

describe("calcularDatasOcorrencias", () => {
  it("frequência diária gera 12 datas consecutivas (1 dia de diferença)", () => {
    const datas = calcularDatasOcorrencias("2026-03-14", "diaria", 12);
    expect(datas).toHaveLength(12);
    expect(datas[0]).toBe("2026-03-14");
    expect(datas[1]).toBe("2026-03-15");
    expect(datas[2]).toBe("2026-03-16");
    expect(datas[11]).toBe("2026-03-25");
  });

  it("frequência semanal gera datas a cada 7 dias", () => {
    const datas = calcularDatasOcorrencias("2026-03-14", "semanal", 4);
    expect(datas).toHaveLength(4);
    expect(datas[0]).toBe("2026-03-14");
    expect(datas[1]).toBe("2026-03-21");
    expect(datas[2]).toBe("2026-03-28");
    expect(datas[3]).toBe("2026-04-04");
  });

  it("frequência mensal gera datas a cada mês", () => {
    const datas = calcularDatasOcorrencias("2026-03-14", "mensal", 3);
    expect(datas).toHaveLength(3);
    expect(datas[0]).toBe("2026-03-14");
    expect(datas[1]).toBe("2026-04-14");
    expect(datas[2]).toBe("2026-05-14");
  });

  it("frequência mensal preserva fim de mês sem pular fevereiro", () => {
    const datas = calcularDatasOcorrencias("2026-01-31", "mensal", 4);
    expect(datas).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("frequência custom é tratada como mensal", () => {
    const datas = calcularDatasOcorrencias("2026-01-15", "custom", 2);
    expect(datas).toHaveLength(2);
    expect(datas[0]).toBe("2026-01-15");
    expect(datas[1]).toBe("2026-02-15");
  });

  it("usa NUM_OCORRENCIAS (12) quando n não é passado", () => {
    const datas = calcularDatasOcorrencias("2026-03-01", "diaria");
    expect(datas).toHaveLength(12);
    expect(datas[11]).toBe("2026-03-12");
  });
});

describe("gerarTarefasRecorrentes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("copia itens do checklist do modelo para cada tarefa com mesma ordem e obrigatoriedade", async () => {
    let tarefaIndex = 0;
    const insertTarefa = vi.fn().mockImplementation(() =>
      Promise.resolve({
        data: { id: `tarefa-${++tarefaIndex}` },
        error: null,
      })
    );
    const insertItem = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectItens = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "i1", titulo: "Item A", descricao: null, obrigatorio: true, ordem: 0 },
            { id: "i2", titulo: "Item B", descricao: "Desc", obrigatorio: false, ordem: 1 },
          ],
          error: null,
        }),
      }),
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rotina_modelo_checklist_itens")
        return { select: selectItens };
      if (table === "tarefas")
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertTarefa }) }) };
      if (table === "tarefa_checklist_itens")
        return { insert: insertItem };
      return {};
    });

    const params: GerarTarefasParams = {
      supabase: { from } as never,
      rotinaClienteId: "rc-1",
      bpoId: "bpo-1",
      clienteId: "c-1",
      rotinaModeloId: "modelo-1",
      dataInicio: "2026-03-14",
      frequencia: "diaria",
      responsavelPadraoId: null,
      prioridade: "media",
      tituloModelo: "Conciliação",
    };

    const result = await gerarTarefasRecorrentes(params);

    expect(result.error).toBeUndefined();
    expect(result.count).toBe(12);
    expect(insertItem).toHaveBeenCalledTimes(12 * 2);

    const firstCall = insertItem.mock.calls[0];
    const firstTarefaId = firstCall?.[0]?.tarefa_id;
    const callsForFirstTarefa = insertItem.mock.calls.filter((c) => c[0]?.tarefa_id === firstTarefaId);
    expect(callsForFirstTarefa.length).toBe(2);
    const call0 = callsForFirstTarefa[0]?.[0];
    expect(call0).toMatchObject({
      titulo: "Item A",
      obrigatorio: true,
      ordem: 0,
      concluido: false,
    });
    const call1 = callsForFirstTarefa[1]?.[0];
    expect(call1).toMatchObject({
      titulo: "Item B",
      descricao: "Desc",
      obrigatorio: false,
      ordem: 1,
      concluido: false,
    });
  });
});
