# Story 2.3: Visualizar e gerenciar tarefas em calendário/lista

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **operador ou gestor de BPO**,
I want **ver tarefas em calendário ou lista por período**,
so that **eu planeje e execute rotinas de forma organizada**.

## Acceptance Criteria

1. **Given** a visão por cliente, **When** abrir calendário (mensal/semanal) ou lista agrupada por data, **Then** as tarefas mostram status (a fazer, em andamento, concluída, atrasada) e há filtros por tipo, responsável, status e prioridade.
2. **And** clique em uma tarefa abre o detalhe com checklist, comentários e histórico.
3. **And** dados isolados por bpo_id; operador/gestor/admin acessam; cliente_final não acessa esta área (ou acessa apenas suas tarefas no portal, conforme Epic 8).
4. **And** suporte a visão "por cliente" (ex.: /clientes/[clienteId]/tarefas) e opcionalmente visão global "Hoje" (/tarefas/hoje) com tarefas de todos os clientes do BPO.

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,3,4)** – API: listar tarefas com filtros
  - [x] GET /api/tarefas: query params clienteId?, dataInicio?, dataFim?, status?, responsavelId?, prioridade?, page?, limit?. Filtro bpo_id obrigatório. Resposta { data: { tarefas: [...], total, page, limit }, error: null }. Ordenar por data_vencimento, prioridade.
  - [x] GET /api/clientes/[clienteId]/tarefas: mesmo contrato, implícito clienteId. Útil para aba "Tarefas" do cliente.
  - [x] Cada item da lista inclui id, titulo, dataVencimento, status, prioridade, responsavelId (e nome do responsável se join), clienteId, rotinaClienteId (se houver).
- [x] **Task 2 (AC: 2)** – API: detalhe de uma tarefa
  - [x] GET /api/tarefas/[tarefaId]: retornar tarefa com itens de checklist (tarefa_checklist_itens: titulo, descricao, obrigatorio, ordem, concluido, concluidoPor, concluidoEm). Incluir comentários/histórico se tabela existir (senão placeholder para story futura). Guard: mesmo bpo_id.
- [x] **Task 3 (AC: 1,4)** – UI: calendário e lista por cliente
  - [x] Página /clientes/[clienteId]/tarefas: abas ou toggle "Calendário" / "Lista". Calendário: visão mensal ou semanal com tarefas em cada dia (link para detalhe). Lista: agrupada por data, filtros (status, responsável, prioridade). Dados via GET /api/clientes/[clienteId]/tarefas com params de período.
  - [x] Componentes: calendário (pode usar lib leve ou tabela de dias); lista agrupada; filtros reutilizáveis.
- [x] **Task 4 (AC: 2)** – UI: detalhe da tarefa
  - [x] Página /tarefas/[tarefaId] ou modal/drawer: exibir checklist (itens com estado concluído/não concluído), área de comentários (pode ser lista vazia ou "Em breve"), histórico de alterações (se houver tabela de histórico). Botão "Editar status" (a fazer / em andamento / concluída / atrasada) — PATCH /api/tarefas/[id] com status.
- [x] **Task 5 (AC: 4)** – UI: painel "Hoje" (opcional nesta story)
  - [x] Página /tarefas/hoje: listar tarefas com data_vencimento = hoje para o BPO (GET /api/tarefas?dataInicio=hoje&dataFim=hoje). Agrupar por cliente ou lista única. Clique leva ao detalhe da tarefa. Conforme bpo360-information-architecture (Painel Hoje).
- [x] **Task 6** – Testes
  - [x] GET /api/tarefas com clienteId e período retorna apenas tarefas do cliente no período.
  - [x] GET /api/tarefas/[id] com usuário de outro BPO retorna 404 ou 403.
  - [x] Filtros (status, responsável) aplicados corretamente.

## Dev Notes

- **Depende de 2-1 e 2-2:** tarefas e tarefa_checklist_itens existem; rotinas_cliente e modelos existem. Estrutura de dados já definida na 2-2.
- **Comentários e histórico:** PRD menciona "histórico de mudanças e comentários" (RF-08). Implementação mínima: tabela tarefa_comentarios ou tarefa_historico pode ser criada nesta story ou deixar para 2.4; na UI mostrar "Sem comentários" e seção de histórico vazia até implementar.
- **Status "atrasada":** Pode ser derivado (data_vencimento < hoje e status != concluida) ou armazenado; atualizar em job ou ao abrir lista.
- **Arquitetura de informação:** /app/clientes/:clienteId/tarefas e /app/tarefas/hoje (bpo360-information-architecture.md).

### Project Structure Notes

- API: app/api/tarefas/route.ts (GET), app/api/tarefas/[tarefaId]/route.ts (GET, PATCH), app/api/clientes/[clienteId]/tarefas/route.ts (GET).
- Páginas: app/(bpo)/clientes/[clienteId]/tarefas/page.tsx, app/(bpo)/tarefas/hoje/page.tsx, app/(bpo)/tarefas/[tarefaId]/page.tsx (detalhe).
- Componentes: calendário, lista-agrupada, filtros-tarefas, tarefa-detalhe.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — tarefa, RLS, Project Structure (tarefas/hoje).
- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 2, Story 2.3, RF-06, RF-07, RF-08.
- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md] — Tarefas & Rotinas, Painel Hoje.
- [Source: _bmad-output/implementation-artifacts/2-2-aplicar-modelo-de-rotina-a-um-cliente.md] — Schema tarefas e tarefa_checklist_itens.

## Developer Context (Guardrails)

### Technical Requirements

- GET com filtros e paginação; resposta { data: { tarefas, total, page, limit }, error: null }. PATCH para status da tarefa.
- RLS e guards por bpo_id em todas as rotas.

### Architecture Compliance

- snake_case DB; camelCase API. Estrutura por feature em app/(bpo)/tarefas e clientes/[id]/tarefas.

### Testing Requirements

- Filtros e isolamento BPO; detalhe retorna checklist e dados corretos.

### Project Context Reference

- bpo360-app/; PRD, Architecture, Epics.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Task 1: GET /api/tarefas e GET /api/clientes/[clienteId]/tarefas implementados com filtros (clienteId, dataInicio, dataFim, status, responsavelId, prioridade, page, limit). Resposta { data: { tarefas, total, page, limit } }. Status "atrasada" derivado quando data_vencimento < hoje e status !== concluida. Nome do responsável obtido em batch a partir de usuarios.
- Task 2: GET /api/tarefas/[tarefaId] retorna tarefa com checklist (tarefa_checklist_itens); comentarios e historico como arrays vazios (placeholder). PATCH /api/tarefas/[tarefaId] para atualizar status. Guard canAccessModelos (admin_bpo, gestor_bpo, operador_bpo); cliente_final não acessa.
- Task 3: Página /clientes/[clienteId]/tarefas com toggle Calendário/Lista; calendário mensal e semanal; lista agrupada por data; filtros tipo, status, responsável e prioridade. Aba "Tarefas" adicionada no layout do cliente.
- Task 4: Página /tarefas/[tarefaId] com checklist, seção Comentários "Em breve", Histórico vazio e botões Editar status (PATCH). Endpoint de checklist incluído para suportar a interação já presente na UI e preparar a story 2.4.
- Task 5: Página /tarefas/hoje com GET /api/tarefas?dataInicio=hoje&dataFim=hoje; tarefas agrupadas por cliente; link para detalhe.
- Task 6: Testes em route.test.ts para GET/PATCH tarefas, GET clientes/[clienteId]/tarefas: 401, 403, 404, 200, filtros e isolamento BPO. 188 testes passando.
- Code review: corrigidos gaps do AC 1 com filtro por tipo e visão semanal no calendário; File List sincronizada com os arquivos efetivamente alterados.

### File List

- bpo360-app/src/lib/domain/rotinas/types.ts (TarefaListItem, TarefaChecklistItem, TarefaDetalhe)
- bpo360-app/src/app/api/tarefas/route.ts
- bpo360-app/src/app/api/tarefas/route.test.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/route.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/route.test.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/checklist/[itemId]/route.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/checklist/[itemId]/route.test.ts
- bpo360-app/src/app/api/clientes/[clienteId]/tarefas/route.ts
- bpo360-app/src/app/api/clientes/[clienteId]/tarefas/route.test.ts
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/layout.tsx (aba Tarefas)
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/tarefas/page.tsx
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/tarefas/_components/tarefas-cliente-client.tsx
- bpo360-app/src/app/(bpo)/tarefas/[tarefaId]/page.tsx
- bpo360-app/src/app/(bpo)/tarefas/[tarefaId]/_components/tarefa-detalhe-client.tsx
- bpo360-app/src/app/(bpo)/tarefas/hoje/page.tsx
- bpo360-app/src/app/(bpo)/tarefas/hoje/_components/tarefas-hoje-client.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml (2-3 → in-progress → review)

### Change Log

- 2026-03-14: Story 2.3 implementada. APIs GET/PATCH tarefas, GET clientes/[id]/tarefas; UI calendário/lista por cliente, detalhe da tarefa, painel Hoje; testes passando.
- 2026-03-14: Code review concluído. Adicionados filtro por tipo e visão semanal; documentação da story alinhada aos arquivos realmente alterados.
