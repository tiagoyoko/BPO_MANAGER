# Story 2.4: Executar checklist de uma tarefa

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **operador de BPO**,
I want **marcar itens do checklist da tarefa conforme executo**,
so that **todos os passos da rotina sejam cumpridos**.

## Acceptance Criteria

1. **Given** a tela da tarefa, **When** marcar itens do checklist (obrigatórios e opcionais distintos), **Then** a tarefa só pode ser marcada "Concluída" com todos os obrigatórios marcados; histórico registra quem marcou/desmarcou e quando.
2. **And** itens obrigatórios não podem ser desmarcados após conclusão da tarefa (regra de negócio: uma vez concluído obrigatório, fica travado).
3. **And** itens opcionais podem ser desmarcados apenas até a tarefa ser concluída; após conclusão da tarefa, ficam travados (mesma regra dos obrigatórios).
4. **And** ao marcar último item obrigatório, UI pode sugerir "Marcar tarefa como concluída" ou usuário altera status manualmente para "Concluída".

## Tasks / Subtasks

- [x] **Task 1 (AC: 1)** – API: marcar/desmarcar item do checklist
  - [x] PATCH /api/tarefas/[tarefaId]/checklist/[itemId]: body { concluido: boolean }. Atualizar tarefa_checklist_itens.concluido, concluido_por_id (auth.uid()), concluido_em. Validar: tarefa pertence ao BPO; item pertence à tarefa. Se concluido === true e item é obrigatório, verificar depois se permite desmarcar (Task 2).
  - [x] Resposta { data: { item: { id, concluido, concluidoPor, concluidoEm } }, error: null } 200.
- [x] **Task 2 (AC: 2,3)** – Regra: desmarcar obrigatório/opcional após conclusão
  - [x] Ao receber PATCH com concluido: false para um item obrigatório: verificar se a tarefa já está com status "concluida". Se sim, retornar 400 "Itens obrigatórios não podem ser desmarcados após conclusão da tarefa". Se tarefa não está concluída, permitir desmarcar.
  - [x] Itens opcionais: permitir marcar/desmarcar apenas até a tarefa ser concluída; se tarefa.status === 'concluida', retornar 400 ao tentar desmarcar (mesma regra dos obrigatórios).
- [x] **Task 3 (AC: 1)** – Permitir marcar tarefa como "Concluída" somente com obrigatórios OK
  - [x] PATCH /api/tarefas/[tarefaId]: body { status: "concluida" }. Antes de atualizar: buscar tarefa_checklist_itens onde obrigatorio = true; se algum tem concluido = false, retornar 400 "Complete todos os itens obrigatórios do checklist antes de concluir a tarefa". Caso contrário, atualizar tarefas.status e retornar 200.
- [x] **Task 4 (AC: 1)** – Histórico de quem marcou/desmarcou
  - [x] Já persistido em tarefa_checklist_itens (concluido_por_id, concluido_em). Se precisar de log explícito de "desmarcou", considerar tabela tarefa_checklist_log (item_id, acao 'marcar'|'desmarcar', usuario_id, ocorrido_em). Mínimo: manter concluido_por e concluido_em; ao desmarcar, limpar concluido_por_id e concluido_em (opcional) ou manter último quem marcou para auditoria.
- [x] **Task 5** – UI: executar checklist na tela da tarefa
  - [x] Na página/drawer de detalhe da tarefa (2-3): lista de itens com checkbox. Ao clicar: PATCH /api/tarefas/[id]/checklist/[itemId] com { concluido: true/false }. Atualizar estado local; exibir nome de quem concluiu e data (se disponível). Desabilitar checkbox de item obrigatório já concluído quando tarefa.status === 'concluida'.
  - [x] Botão "Marcar tarefa como concluída": ao clicar, chamar PATCH /api/tarefas/[id] com { status: 'concluida' }; se 400 (obrigatórios faltando), exibir mensagem e destacar itens faltantes.
- [x] **Task 6** – Testes
  - [x] Marcar todos obrigatórios permite concluir tarefa; faltando um obrigatório retorna 400 ao tentar concluir.
  - [x] Com tarefa concluída, PATCH para desmarcar item obrigatório retorna 400.
  - [x] concluido_por_id e concluido_em preenchidos ao marcar.

## Dev Notes

- **Depende de 2-2 e 2-3:** tarefa_checklist_itens já existe (cópia do modelo na 2-2); tela de detalhe da tarefa na 2-3. Esta story adiciona a interação de marcar/desmarcar e a regra de conclusão.
- **Tarefa "concluída":** Status na tabela tarefas (enum ou text). Valores esperados: a_fazer, em_andamento, concluida, atrasada, bloqueada.
- **Auditoria:** concluido_por_id e concluido_em já dão trilha; para "quem desmarcou" pode ser evolução (tarefa_checklist_log) ou deixar apenas "último quem marcou".
- **Regra opcionais:** itens opcionais só podem ser desmarcados até a tarefa ser marcada como concluída; após conclusão, travam igual aos obrigatórios.

### Project Structure Notes

- API: PATCH em app/api/tarefas/[tarefaId]/route.ts (status) e app/api/tarefas/[tarefaId]/checklist/[itemId]/route.ts (PATCH item).
- UI: componentes de checklist na página/drawer de detalhe da tarefa (2-3).

### References

- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 2, Story 2.4, RF-07, RF-08.
- [Source: _bmad-output/implementation-artifacts/2-2-aplicar-modelo-de-rotina-a-um-cliente.md] — tarefa_checklist_itens (concluido, concluido_por_id, concluido_em).
- [Source: _bmad-output/implementation-artifacts/2-3-visualizar-e-gerenciar-tarefas-em-calendario-lista.md] — Detalhe da tarefa e API GET tarefas/[id].

## Developer Context (Guardrails)

### Technical Requirements

- Validação no backend: concluir tarefa só com todos obrigatórios marcados; bloquear desmarcar obrigatório se tarefa concluída.
- API: { data, error }; códigos 400 para regras de negócio.

### Testing Requirements

- Cenários de obrigatórios e conclusão; 400 em tentativas inválidas.

### Project Context Reference

- bpo360-app/; Epics e Architecture.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

 - Task 1–2: endpoint PATCH /api/tarefas/[tarefaId]/checklist/[itemId] implementado com validação de tarefa/item por BPO, bloqueio de alterações após conclusão e resposta com dados do item atualizado.
 - Task 3: PATCH /api/tarefas/[tarefaId] agora exige todos os itens obrigatórios concluídos antes de aceitar status "concluida".
 - Task 4: histórico explícito implementado via tabela tarefa_checklist_logs e exibido no detalhe da tarefa.
 - Task 5: checklist passou a ser interativo na UI, com feedback de itens obrigatórios pendentes e CTA para concluir a tarefa.
 - Task 6: testes adicionados para validações de conclusão e bloqueio de checklist pós-conclusão.

### Change Log

 - 2026-03-14: Code review 2.4 corrigiu a implementação da story, incluindo endpoint de checklist, histórico persistido, validação de conclusão e UI interativa.

### File List

 - bpo360-app/src/app/api/tarefas/[tarefaId]/route.ts (alterado: validação de obrigatórios antes de concluir; histórico e nomes no GET)
 - bpo360-app/src/app/api/tarefas/[tarefaId]/route.test.ts (alterado: cenários Story 2.4 no PATCH e histórico no GET)
 - bpo360-app/src/app/api/tarefas/[tarefaId]/checklist/[itemId]/route.ts (novo)
 - bpo360-app/src/app/api/tarefas/[tarefaId]/checklist/[itemId]/route.test.ts (novo)
 - bpo360-app/src/app/(bpo)/tarefas/[tarefaId]/_components/tarefa-detalhe-client.tsx (alterado: checklist interativo, CTA de conclusão, destaque de obrigatórios)
 - bpo360-app/src/lib/domain/rotinas/types.ts (alterado: tipos de checklist e histórico)
 - bpo360-app/supabase/migrations/20260314193000_create_tarefa_checklist_logs.sql (novo)
