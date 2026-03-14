# Story 2.6: Editar configuração de rotinas em massa

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor de BPO**,
I want **ajustar recorrência, prioridade e responsável padrão de várias rotinas ao mesmo tempo**,
so that **eu adapte o plano operacional quando mudar processo ou equipe**.

## Acceptance Criteria

1. **Given** lista de rotinas (não tarefas) com seleção múltipla, **When** usar ações em massa (prioridade, responsável, regra de recorrência, datas de vigência), **Then** as alterações refletem em instâncias futuras (conforme regra documentada); sistema exibe resumo antes de confirmar.
2. **And** é possível ver quantas rotinas serão afetadas e o impacto previsto (ex.: "12 rotinas serão atualizadas; tarefas já geradas não são alteradas, apenas as futuras usarão o novo responsável/prioridade").
3. **And** apenas admin_bpo ou gestor_bpo; rotinas devem ser do mesmo bpo_id.
4. **And** campos editáveis em massa: prioridade, responsável padrão, frequência (e opcionalmente data início/vigência). Tarefas já criadas mantêm valores atuais; novas gerações (ou atualização de tarefas futuras, se houver job) usam os novos valores.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1,3,4)** – API: edição em massa de rotinas_cliente
  - [ ] PATCH /api/rotinas-cliente/em-massa (ou POST /api/rotinas-cliente/bulk-update): body { rotinaClienteIds: string[], prioridade?: string, responsavelPadraoId?: string, frequencia?: string, dataInicio?: string }. Guard: admin_bpo ou gestor_bpo; validar todas as rotinas são do mesmo bpo_id. Atualizar em lote rotinas_cliente (prioridade, responsavel_padrao_id, frequencia, data_inicio conforme enviado). Não alterar tarefas já existentes; documentar que "próximas gerações" (job ou ao expandir recorrência) usarão os novos valores.
  - [ ] Resposta: { data: { atualizadas: number, rotinas: { id, ... }[] }, error: null } 200. Ou 400 se algum id inválido.
- [ ] **Task 2 (AC: 2)** – Resumo antes de confirmar
  - [ ] GET /api/rotinas-cliente/preview-massa?ids=id1,id2,...&prioridade=alta (ou body em POST): retornar contagem de rotinas que seriam afetadas e lista resumida (id, cliente nome, modelo nome) para exibir "As seguintes N rotinas serão atualizadas: ...". Opcional: se implementar preview, front chama preview depois envia confirmado; senão, front exibe "Você está alterando N rotinas. Confirma?" e envia PATCH.
  - [ ] Mínimo: na UI, antes de submeter, exibir "N rotinas serão atualizadas. Tarefas já geradas não serão alteradas." e botão Confirmar/Cancelar.
- [ ] **Task 3 (AC: 1,3)** – UI: lista de rotinas com seleção e ações em massa
  - [ ] Tela ou aba "Rotinas" (ex.: /rotinas ou /clientes/[id]/rotinas com foco em "rotinas do cliente"): listar rotinas_cliente (cliente nome, modelo nome, data início, frequência, responsável, prioridade). Checkbox por linha; "Selecionar todas"; toolbar "N selecionadas" + dropdown "Ações em massa": "Alterar prioridade", "Alterar responsável", "Alterar frequência", "Alterar data início". Ao escolher ação: modal com novo valor (select ou date); exibir resumo (N rotinas afetadas) e Confirmar. Submit → PATCH /api/rotinas-cliente/em-massa.
- [ ] **Task 4** – Testes
  - [ ] PATCH em massa atualiza apenas rotinas do BPO; rotina de outro BPO retorna erro ou é ignorada.
  - [ ] Gestor/admin podem chamar; operador 403.
  - [ ] Tarefas existentes não têm responsavel_id ou prioridade alterados pela edição em massa da rotina (apenas rotinas_cliente são atualizadas).

## Dev Notes

- **Diferente de 2-5:** 2-5 é atribuição em massa de **tarefas** (muda responsavel_id em cada tarefa). 2-6 é edição em massa de **rotinas_cliente** (muda responsavel_padrao_id, prioridade, frequencia na configuração da rotina). Tarefas futuras geradas passarão a usar o novo responsável/prioridade; tarefas já geradas continuam com o valor que tinham (a menos que se implemente um job de "propagar alteração para tarefas futuras", o que pode ser evolução).
- **Depende de 2-2:** rotinas_cliente existem. Lista de rotinas pode ser por cliente (GET /api/clientes/[id]/rotinas) ou global (GET /api/rotinas-cliente?clienteId=).
- **Datas de vigência:** Pode ser data_inicio (início da vigência) ou data_fim (encerrar rotina a partir de X). Implementação mínima: data_inicio editável em massa; data_fim opcional em evolução.

### Project Structure Notes

- API: PATCH app/api/rotinas-cliente/em-massa/route.ts ou POST app/api/rotinas-cliente/bulk/route.ts. GET para listar rotinas (por cliente ou global) em app/api/rotinas-cliente/route.ts ou app/api/clientes/[id]/rotinas/route.ts.
- UI: página /rotinas ou seção em /clientes/[id] para "Rotinas ativas" com tabela e ações em massa.

### References

- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 2, Story 2.6, RF-34.
- [Source: _bmad-output/implementation-artifacts/2-2-aplicar-modelo-de-rotina-a-um-cliente.md] — rotinas_cliente (prioridade, responsavel_padrao_id, frequencia, data_inicio).
- [Source: _bmad-output/implementation-artifacts/2-5-atribuicao-em-massa-de-tarefas.md] — Padrão de UI para seleção múltipla e ação em massa; resposta com sucesso/falhas.
- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md] — Editar em massa recorrência, prioridade, responsável.

## Developer Context (Guardrails)

### Technical Requirements

- Editar apenas rotinas_cliente; não alterar tarefas existentes. Validar bpo_id e papel (admin_bpo, gestor_bpo).
- API: { data, error }; resumo (quantas afetadas) na resposta ou em endpoint de preview.

### Testing Requirements

- Atualização em massa só nas rotinas do BPO; 403 para operador; tarefas não alteradas.

### Project Context Reference

- bpo360-app/; Epics e Architecture.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
