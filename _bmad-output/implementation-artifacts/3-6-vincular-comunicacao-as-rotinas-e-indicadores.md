# Story 3.6: Vincular comunicação às rotinas e indicadores

Status: done

<!-- Validação opcional: executar validate-create-story antes de dev-story. -->

## Story

As a **gestor de BPO**,
I want **ver em uma rotina/tarefa quais comunicações e documentos relacionados existem**,
so that **eu entenda se atrasos vêm de pendências do cliente ou da execução interna**.

## Acceptance Criteria

1. **Given** uma tarefa ou rotina aberta,
   **When** o usuário visualiza a área de comunicação relacionada,
   **Then** são exibidas solicitações vinculadas (diretamente à tarefa ou ao mesmo período/tema) e contador de solicitações abertas.
2. **And** na visão geral do cliente é possível filtrar tarefas que possuem solicitações abertas ligadas (ex.: “bloqueadas por cliente”).

## Tasks / Subtasks

- [x] **Task 1** – Dados de comunicação na tarefa
  - [x] Na tela de detalhe da tarefa (`app/(bpo)/tarefas/[tarefaId]/page.tsx`): além da seção Documentos (Story 3.4), exibir seção “Solicitações relacionadas”. Listar solicitações onde tarefa_id = tarefaId (vínculo direto) e, opcionalmente, solicitações do mesmo cliente em período próximo (ex.: mesma semana) sem tarefa_id preenchido, para “tema/período”.
  - [x] API: GET /api/tarefas/[tarefaId]/solicitacoes ou incluir em GET /api/tarefas/[tarefaId] um array `solicitacoesRelacionadas`. Retornar lista com id, titulo, status, data abertura; contador de abertas (status = 'aberta').
  - [x] Exibir contador: “X solicitação(ões) aberta(s)” e link para cada item (detalhe da solicitação).
- [x] **Task 2** – Rotina e tarefas da rotina
  - [x] Para “rotina”: uma rotina gera várias tarefas (rotina_cliente + tarefas). Definir se “comunicação da rotina” é a união das solicitações das tarefas dessa rotina ou uma visão agregada. Implementar: ao abrir uma tarefa, mostrar solicitações daquela tarefa; opcionalmente, em outra vista (ex.: por rotina_cliente), agregar solicitações de todas as tarefas da mesma rotina.
  - [x] Mínimo viável: na tela da tarefa, solicitações vinculadas diretamente (tarefa_id) já atende “vinculadas à tarefa”; contador de abertas na própria tarefa.
- [x] **Task 3** – Filtro na visão geral do cliente
  - [x] Na lista de tarefas do cliente (ex.: `app/(bpo)/clientes/[clienteId]/tarefas/page.tsx`): adicionar filtro “Com solicitações abertas” ou “Bloqueadas por cliente”. Ao ativar, listar apenas tarefas que tenham pelo menos uma solicitação com status “aberta” e tarefa_id = tarefa.id.
  - [x] API de tarefas por cliente: suportar query param ex. `?comSolicitacoesAbertas=true` para filtrar no backend (subquery ou join em solicitacoes onde tarefa_id in (tarefas do cliente) e status = 'aberta').
- [x] **Task 4** – Indicador visual
  - [x] Na linha ou card da tarefa na listagem do cliente, opcional: ícone ou badge “Solicitações abertas” quando houver ≥1 solicitação aberta vinculada, para visibilidade rápida.

## Dev Notes

- **Vínculo:** Solicitações já possuem tarefa_id opcional (Story 3.1). Usar esse vínculo para “solicitações diretamente ligadas à tarefa”. “Mesmo período/tema” pode ser implementação futura (ex.: solicitações do cliente sem tarefa_id na mesma semana).
- **Visão geral do cliente:** [Source: architecture] clientes/[clienteId]/tarefas; componente tarefas-cliente-client.tsx. Adicionar filtro sem quebrar listagem existente; manter performance (índice em solicitacoes.tarefa_id e status).
- **RLS:** Garantir que apenas solicitações do mesmo bpo_id e cliente da tarefa sejam consideradas.

### Project Structure Notes

- API: estender GET /api/tarefas/[tarefaId] ou criar GET /api/tarefas/[tarefaId]/solicitacoes. Listagem de tarefas do cliente: GET /api/tarefas?clienteId=...&comSolicitacoesAbertas=true (ou equivalente).
- UI: tarefas/[tarefaId]/_components (seção “Solicitações relacionadas”); clientes/[clienteId]/tarefas (filtro e indicador na lista).

## PM Validation (John)

**Data:** 2026-03-14  
**Status:** ✅ Validado

- **Valor:** Gestor entende se atrasos vêm de pendências do cliente ou da execução interna — decisão baseada em dados.
- **AC:** Área de comunicação na tarefa, solicitações vinculadas, contador de abertas e filtro “com solicitações abertas” na visão do cliente estão cobertos.
- **Ressalva:** “Solicitações do mesmo período/tema” sem tarefa_id ficou como opcional/futuro — correto para MVP; vínculo direto por tarefa_id basta para o valor principal.

---

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Story 3.6, Epic 3
- [Source: _bmad-output/planning-artifacts/bpo360-ep3-communication-and-docs-stories.md] US 3.6
- [Source: _bmad-output/planning-artifacts/prd/6-requisitos-funcionais.md] RF-09, RF-11

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: GET /api/tarefas/[tarefaId] estendido com solicitacoes (tarefa_id + bpo_id); tipos SolicitacaoRelacionada, solicitacoesRelacionadas e solicitacoesAbertasCount em TarefaDetalhe; seção “Solicitações relacionadas” em tarefa-detalhe-client com contador e links para /solicitacoes/[id].
- Task 2: Mínimo viável coberto pela Task 1 (vínculo direto por tarefa_id).
- Task 3: GET /api/clientes/[clienteId]/tarefas com query comSolicitacoesAbertas=true e preenchimento de comSolicitacoesAbertas em cada item; filtro checkbox “Com solicitações abertas” em tarefas-cliente-client.
- Task 4: Badge “Solicitações abertas” na listagem (lista, calendário mensal e semanal).
- Testes: route.test.ts tarefas/[tarefaId] (solicitacoesRelacionadas e solicitacoesAbertasCount); route.test.ts clientes/[clienteId]/tarefas (filtro comSolicitacoesAbertas e comSolicitacoesAbertas nos itens). 158 testes passando.

### Change Log

- 2026-03-14: Story 3-6 implementada em branch story/3-6-vincular-comunicacao-as-rotinas-e-indicadores (worktree). GET tarefa com solicitacoesRelacionadas e solicitacoesAbertasCount; seção Solicitações relacionadas no detalhe da tarefa; filtro e badge na lista de tarefas do cliente; testes adicionados.

### File List

- bpo360-app/src/lib/domain/rotinas/types.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/route.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/route.test.ts
- bpo360-app/src/app/(bpo)/tarefas/[tarefaId]/_components/tarefa-detalhe-client.tsx
- bpo360-app/src/app/api/clientes/[clienteId]/tarefas/route.ts
- bpo360-app/src/app/api/clientes/[clienteId]/tarefas/route.test.ts
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/tarefas/_components/tarefas-cliente-client.tsx
