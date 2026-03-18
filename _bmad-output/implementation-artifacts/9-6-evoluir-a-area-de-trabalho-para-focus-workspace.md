# Story 9.6: Evoluir a Área de Trabalho para Focus Workspace

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **operador de BPO**,
I want **executar o trabalho de um cliente em um workspace focado com tarefas, detalhe, contexto e comunicação integrados**,
so that **eu trabalhe com menos alternância e mais sensação de progresso**.

## Acceptance Criteria

1. **Given** a área de trabalho atual em colunas,
   **When** ela for evoluída para o `Focus Workspace`,
   **Then** a tela passa a ter hierarquia clara entre lista de tarefas, detalhe ativo e contexto complementar do cliente.
   **And** seleção, avanço, feedback e conclusão de tarefa ocorrem com resposta visual imediata e consistente.

2. **Given** o componente "Focus Workspace" (UX spec),
   **When** implementado em `/[clienteId]/area-de-trabalho`,
   **Then** anatomy: coluna de tarefas, coluna de detalhe/checklist, coluna de contexto/comunicação/financeiro (ou variante 2 colunas).
   **And** states: tarefa ativa, tarefa concluída, bloqueio, sem contexto, loading parcial.

3. **Given** a fundação 9.1, 9.2, 9.3 e padrões de feedback (9.7 quando aplicável),
   **When** o workspace for usado,
   **Then** reutiliza tokens, shell e sinais operacionais; seleção e conclusão têm feedback imediato.
   **And** navegação por teclado entre colunas, foco visível, atalhos progressivos quando fizer sentido.

4. **Given** a jornada "Operador executa o dia em modo foco",
   **When** o operador estiver na área de trabalho de um cliente,
   **Then** ele vê tarefas, checklist, dados financeiros e comunicação em contexto integrado.
   **And** evitar superlotação; destacar claramente o item ativo (tarefa selecionada).

5. **Given** acessibilidade,
   **When** o workspace for usado por teclado e leitores de tela,
   **Then** landmarks, ordem de tab entre colunas e anúncio de mudança de tarefa ativa quando apropriado.
   **And** estados (bloqueio, concluída, loading) não dependem só de cor.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 2)** – Estruturar layout em colunas (Focus Workspace)
  - [ ] Definir 2 ou 3 colunas: lista de tarefas | detalhe/checklist | contexto (comunicação/financeiro).
  - [ ] Implementar seleção de tarefa ativa com destaque visual claro; estados loading parcial e sem contexto.
  - [ ] Garantir responsividade para breakpoints definidos (desktop/tablet).

- [ ] **Task 2 (AC: 2, 4)** – Integrar detalhe e checklist na coluna central
  - [ ] Reutilizar ou integrar componente de detalhe de tarefa/checklist existente na coluna do meio.
  - [ ] Feedback imediato ao concluir itens (estado visual e, se existir, toast/confirmação).
  - [ ] Estado de bloqueio visível e acionável (texto + estrutura, não só cor).

- [ ] **Task 3 (AC: 1, 4)** – Coluna de contexto do cliente
  - [ ] Área de contexto complementar: comunicação/timeline e/ou resumo financeiro quando fizer sentido.
  - [ ] Evitar superlotação; priorizar informação útil para "um cliente por vez".
  - [ ] Se dados F360 ou timeline já existirem em rotas filhas, reutilizar ou embutir de forma consistente.

- [ ] **Task 4 (AC: 3, 5)** – Consistência visual e acessibilidade
  - [ ] Usar HealthSignal e primitives EP9 para prioridade, SLA e estado de tarefa.
  - [ ] Navegação por teclado entre colunas; foco visível; aria-labels e landmarks.
  - [ ] Documentar ou implementar atalhos progressivos se especificado no UX.

## Dev Notes

### Estado atual relevante do código

- **Área de trabalho:** `area-de-trabalho-client.tsx` com lista de tarefas (recorrentes e não recorrentes), links para detalhe; ainda sem colunas estruturadas (tarefas | detalhe | contexto).
- **Detalhe/checklist:** componente(s) de detalhe de tarefa/checklist existentes na coluna do meio ou em rotas filhas — reutilizar ou integrar.
- **Contexto/comunicação:** dados F360 ou timeline em rotas filhas — reutilizar ou embutir de forma consistente na coluna de contexto.

### Contexto e dependências

- **Contexto:** Objetivo: evoluir para **Focus Workspace** com colunas claras (tarefas | detalhe/checklist | contexto), seleção de tarefa ativa e feedback imediato.
- **UX spec Focus Workspace:** anatomy colunas; states tarefa ativa, concluída, bloqueio, sem contexto, loading parcial; interaction: seleção, avanço, conclusão e retorno ao fluxo com feedback imediato.
- **Dependências:** 9.1, 9.2, 9.3; 9.5 (Hoje) e 9.7 (feedback) quando aplicável. Toasts/feedback de conclusão de tarefa devem seguir o padrão 9.7; se 9.7 ainda não estiver implementada, usar padrão mínimo documentado (ex.: FeedbackToast atual) e alinhar depois.

### Arquivos prováveis

- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/area-de-trabalho/page.tsx`
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/area-de-trabalho/_components/area-de-trabalho-client.tsx`
- Componentes de tarefa/checklist existentes; `src/components/` (HealthSignal, feedback quando existir).

### Fora de escopo

- Não redesenhar API de tarefas; não implementar modo foco global (persistência de "cliente em foco" na sessão) se não estiver no escopo do EP9.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Focus Workspace]
- [Source: _bmad-output/implementation-artifacts/9-5-refatorar-o-painel-hoje-para-fila-operacional-priorizada.md]

## Dev Agent Record

### Agent Model Used

(Preencher pelo agente de desenvolvimento.)

### File List

(A preencher após implementação.)
