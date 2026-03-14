# Story 2.5: Atribuição em massa de tarefas

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor de BPO**,
I want **selecionar várias tarefas e atribuí-las a um operador ou time de uma vez**,
so that **eu redistribua carga rapidamente**.

## Acceptance Criteria

1. **Given** a lista de tarefas com seleção múltipla (checkbox), **When** usar a ação em massa "Atribuir responsável" e escolher usuário ou time, **Then** a alteração é aplicada a todas as selecionadas e o histórico registra quem alterou e quando.
2. **And** a interface mostra feedback de sucesso/falha por tarefa quando houver falha pontual (ex.: uma tarefa de outro BPO na lista por bug — falha apenas essa).
3. **And** apenas gestor ou admin podem usar atribuição em massa (operador não, ou conforme regra de negócio).
4. **And** responsável escolhido deve ser usuário do mesmo BPO (gestor_bpo, operador_bpo); validar no backend.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1,4)** – API: atribuir responsável em massa
  - [ ] POST /api/tarefas/atribuir-massa (ou PATCH /api/tarefas com body em massa): body { tarefaIds: string[], responsavelId: string }. Guard: getCurrentUser(); apenas admin_bpo ou gestor_bpo. Validar responsavelId é usuário do mesmo bpo_id (e papel operador_bpo ou gestor_bpo). Para cada tarefaIds: verificar tarefa pertence ao BPO; atualizar tarefas.responsavel_id; registrar em histórico (tarefa_historico ou tabela de auditoria: tarefa_id, campo_alterado 'responsavel_id', valor_anterior, valor_novo, alterado_por_id, alterado_em).
  - [ ] Resposta: { data: { sucesso: number, falhas: { tarefaId: string, motivo: string }[] }, error: null } 200. Se todas falharem, 400 ou 200 com falhas preenchido.
- [ ] **Task 2 (AC: 2)** – Tratamento de falhas pontuais
  - [ ] Ao processar em lote: por tarefa, try/catch ou validação; se falha (ex.: tarefa não encontrada, de outro BPO), adicionar em falhas[] e continuar. Sempre retornar sucesso + falhas para o front exibir "X atribuídas; Y falharam: [lista]".
- [ ] **Task 3 (AC: 1,3)** – UI: seleção múltipla e ação em massa
  - [ ] Na lista de tarefas (2-3): checkbox por linha; checkbox "Selecionar todas" (da página atual); toolbar ou barra fixa quando há seleção: "N itens selecionados" + botão "Atribuir responsável". Ao clicar: modal/dropdown para escolher usuário (GET /api/admin/usuarios ou lista de operadores/gestores). Submit → POST /api/tarefas/atribuir-massa. Exibir toast ou banner com resultado (sucesso + eventual lista de falhas).
- [ ] **Task 4** – Histórico de alteração
  - [ ] Tabela tarefa_historico (ou equivalente): id, tarefa_id, campo, valor_anterior, valor_novo, usuario_id, created_at. Inserir ao atualizar responsavel_id (em massa ou unitário). Permitir exibir "Alterado por X em DD/MM" no detalhe da tarefa (opcional nesta story).
- [ ] **Task 5** – Testes
  - [ ] Atribuir em massa atualiza todas as tarefas do BPO; tarefaIds de outro BPO são rejeitadas (em falhas).
  - [ ] Gestor pode chamar API; operador recebe 403.
  - [ ] responsavelId de outro BPO retorna 400 ou falha.

## Dev Notes

- **Depende de 2-3:** lista de tarefas com checkbox não existe ainda; implementar na mesma lista da 2-3 (clientes/[id]/tarefas ou tarefas/hoje). Tabela tarefas já tem responsavel_id (2-2).
- **Time:** AC fala "usuário ou time". Se não houver entidade "time" no modelo, interpretar como "atribuir a um usuário (operador/gestor)"; "time" pode ser evolução (ex.: atribuir a um grupo que depois distribui).
- **Histórico:** RF-08 exige "registrar histórico de mudanças". Tarefa_historico ou auditoria por campo; mínimo: quem alterou e quando para responsável.

### Project Structure Notes

- API: POST app/api/tarefas/atribuir-massa/route.ts ou PATCH em app/api/tarefas/route.ts com body em massa.
- UI: componentes de lista com checkbox e toolbar de ação em massa (podem ficar em clientes/[id]/tarefas e tarefas/hoje).

### References

- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 2, Story 2.5, RF-35, RF-08.
- [Source: _bmad-output/implementation-artifacts/2-2-aplicar-modelo-de-rotina-a-um-cliente.md] — tarefas.responsavel_id.
- [Source: _bmad-output/implementation-artifacts/2-3-visualizar-e-gerenciar-tarefas-em-calendario-lista.md] — Lista de tarefas; integração com checkbox e toolbar.
- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md] — Atribuição em massa.

## Developer Context (Guardrails)

### Technical Requirements

- Validação: responsavelId do mesmo BPO; apenas admin_bpo/gestor_bpo podem chamar. Resposta com sucesso + array de falhas por tarefa.
- Histórico: registrar alteração de responsável (tarefa_historico ou similar).

### Testing Requirements

- Massa com sucesso; falha pontual (tarefa inválida); 403 para operador.

### Project Context Reference

- bpo360-app/; Epics e Architecture.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
