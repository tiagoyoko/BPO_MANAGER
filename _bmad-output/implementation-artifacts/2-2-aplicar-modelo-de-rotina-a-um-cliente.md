# Story 2.2: Aplicar modelo de rotina a um cliente

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor ou coordenador de BPO**,
I want **aplicar um modelo de rotina a um cliente**,
so that **as tarefas recorrentes daquele processo sejam geradas automaticamente**.

## Acceptance Criteria

1. **Given** a ficha do cliente e "Adicionar rotina a partir de modelo", **When** escolher modelo, data de início, frequência, responsável padrão e prioridade, **Then** o sistema gera instâncias de tarefas futuras conforme a recorrência.
2. **And** a rotina aparece na visão de calendário/cronograma do cliente (visão será plena na 2.3; nesta story garantir que as tarefas geradas estejam associadas ao cliente e à rotina).
3. **And** modelo deve pertencer ao mesmo bpo_id; cliente deve pertencer ao BPO; admin_bpo, gestor_bpo e operador_bpo podem aplicar modelo.
4. **And** tarefas geradas têm status "a fazer", copiam os itens de checklist do modelo (com ordem e obrigatoriedade) para cada instância de tarefa.

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,2)** – Modelo de dados: rotinas_cliente e tarefas
  - [x] Criar migração: tabela `rotinas_cliente` com id (UUID), bpo_id, cliente_id (FK clientes), rotina_modelo_id (FK rotinas_modelo), data_inicio (DATE), frequencia (TEXT: diaria, semanal, mensal, custom), responsavel_padrao_id (FK usuarios), prioridade (TEXT ou enum: baixa, media, alta, urgente), created_at, updated_at. RLS por bpo_id.
  - [x] Tabela `tarefas`: id, bpo_id, cliente_id, rotina_cliente_id (FK rotinas_cliente, nullable para tarefas manuais futuras), titulo, data_vencimento (DATE), status (enum: a_fazer, em_andamento, concluida, atrasada, bloqueada), prioridade, responsavel_id (FK usuarios), created_at, updated_at. RLS por bpo_id.
  - [x] Tabela `tarefa_checklist_itens`: id, tarefa_id (FK tarefas ON DELETE CASCADE), titulo, descricao, obrigatorio, ordem, concluido (BOOLEAN default false), concluido_por_id, concluido_em (timestamptz). Cópia dos itens do modelo no momento da geração da tarefa.
- [x] **Task 2 (AC: 1,4)** – Lógica de geração de tarefas recorrentes
  - [x] Função (lib/domain/rotinas ou server action): dado rotina_cliente (data_inicio, frequencia), gerar N ocorrências de tarefas (ex.: próximos 30 dias ou próximas 12 ocorrências). Para cada ocorrência: criar linha em tarefas (titulo do modelo + sufixo de data se útil), data_vencimento calculada (diária: +1 dia; semanal: +7; mensal: +1 mês); copiar itens do rotina_modelo_checklist_itens para tarefa_checklist_itens com concluido=false.
  - [x] Definir política de quantas tarefas gerar (ex.: 30 dias à frente ou 12 ocorrências); documentar para o dev.
- [x] **Task 3 (AC: 1,3)** – API: aplicar modelo a um cliente
  - [x] POST /api/clientes/[clienteId]/rotinas (ou POST /api/rotinas-cliente): body { rotinaModeloId, dataInicio, frequencia?, responsavelPadraoId?, prioridade? }. Validar cliente e modelo do mesmo bpo_id. Guard: admin_bpo, gestor_bpo ou operador_bpo. Criar rotinas_cliente; chamar lógica de geração de tarefas; retornar { data: { rotinaCliente: {...}, tarefasGeradas: number }, error: null } 201.
  - [x] GET /api/clientes/[clienteId]/rotinas: listar rotinas do cliente (para exibir na ficha e no calendário depois). Resposta { data: { rotinas: [...] }, error: null }.
- [x] **Task 4 (AC: 2)** – UI: "Adicionar rotina a partir de modelo" na ficha do cliente
  - [x] Na página do cliente (ex.: /clientes/[clienteId] ou aba Tarefas/Rotinas), botão "Adicionar rotina a partir de modelo". Modal ou drawer: select de modelo (GET /api/modelos), data de início, frequência, responsável padrão, prioridade. Submit → POST /api/clientes/[clienteId]/rotinas. Feedback e fechar/atualizar lista.
- [x] **Task 5** – Testes
  - [x] Aplicar modelo diário gera tarefas com datas consecutivas; semanal gera a cada 7 dias; mensal a cada mês.
  - [x] Tarefas criadas têm itens de checklist copiados do modelo (mesma ordem e obrigatoriedade).
  - [x] Cliente/modelo de outro BPO rejeitado (403 ou 400).

## Dev Notes

- **Depende de 2-1:** rotinas_modelo e rotina_modelo_checklist_itens existem. Clientes existem (Epic 1). Reutilizar getCurrentUser(), filtro bpo_id.
- **Quem pode aplicar:** admin_bpo, gestor_bpo e operador_bpo (decisão 2026-03-14). Guard na API deve permitir os três papéis.
- **Rotina_cliente vs tarefa:** rotina_cliente é a "instância de configuração" (este cliente usa este modelo a partir desta data); tarefas são as ocorrências concretas (cada dia/semana/mês uma tarefa). Histórico e comentários da tarefa vêm na 2.3/2.4.
- **Prioridade e responsável:** Armazenar em rotinas_cliente e propagar para cada tarefa gerada (responsavel_id = responsavel_padrao_id da rotina_cliente; prioridade copiada).
- **Custom:** Se frequencia = custom, pode exigir parâmetros extras (ex.: dias da semana). Implementação mínima: tratar como "mensal" ou permitir um valor default; evolução em story futura.

### Project Structure Notes

- API: app/api/clientes/[clienteId]/rotinas/route.ts (GET, POST) ou app/api/rotinas-cliente/route.ts com query clienteId.
- Domínio: lib/domain/rotinas/gerar-tarefas-recorrentes.ts (ou similar).
- UI: componente em clientes/[clienteId]/_components ou em aba tarefas do cliente.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — rotina_cliente, tarefa; RLS; naming.
- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 2, Story 2.2, RF-05.
- [Source: _bmad-output/implementation-artifacts/2-1-criar-modelo-de-rotina-padrao.md] — Schema rotinas_modelo e itens; API /api/modelos.

## Developer Context (Guardrails)

### Technical Requirements

- Banco: rotinas_cliente, tarefas, tarefa_checklist_itens com bpo_id e RLS. FKs para clientes, rotinas_modelo, usuarios.
- API: { data, error }; camelCase no JSON. Guards por bpo_id e papel.

### Architecture Compliance

- snake_case DB; camelCase API. Rotas sob /api/clientes/[clienteId]/... ou /api/rotinas-cliente.

### File Structure Requirements

- Migrações em supabase/migrations/. Lógica de geração em lib/domain/rotinas/ ou lib/domain/tarefas/.

### Testing Requirements

- Geração diária/semanal/mensal; checklist copiado; isolamento BPO.

### Project Context Reference

- PRD, Architecture, Epics. Projeto em bpo360-app/.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(Nenhum.)

### Completion Notes List

- **Task 1 – Evidência:** Migração `bpo360-app/supabase/migrations/20260314200000_create_rotinas_cliente_tarefas_checklist.sql` criada com tabelas `rotinas_cliente`, `tarefas` e `tarefa_checklist_itens`, FKs, índices, CHECK (frequencia, prioridade, status) e RLS (admin_bpo, gestor_bpo, operador_bpo; cliente_final com acesso às próprias tarefas). Trigger `set_updated_at` em rotinas_cliente e tarefas.
- **Task 2 – Evidência:** `bpo360-app/src/lib/domain/rotinas/gerar-tarefas-recorrentes.ts`: `calcularDatasOcorrencias(dataInicio, frequencia, n)` para diária/semanal/mensal/custom (custom = mensal); `gerarTarefasRecorrentes(params)` insere 12 ocorrências de tarefas e copia itens de `rotina_modelo_checklist_itens` para `tarefa_checklist_itens` com ordem e obrigatoriedade. Política: 12 ocorrências (documentada no próprio arquivo).
- **Task 3 – Evidência:** `bpo360-app/src/app/api/clientes/[clienteId]/rotinas/route.ts`: GET lista rotinas do cliente (buscarClientePorIdEBpo + from rotinas_cliente); POST valida cliente e modelo mesmo bpo_id, canAccessModelos (admin_bpo, gestor_bpo, operador_bpo), insere rotinas_cliente e chama gerarTarefasRecorrentes; resposta 201 com rotinaCliente e tarefasGeradas.
- **Task 4 – Evidência:** `bpo360-app/src/app/(bpo)/clientes/[clienteId]/_components/rotinas-cliente-section.tsx`: seção "Rotinas do cliente" com lista (GET /api/clientes/[clienteId]/rotinas), botão "Adicionar rotina a partir de modelo" que abre modal com select modelo (GET /api/modelos), data início, frequência, responsável padrão (GET /api/admin/usuarios quando disponível), prioridade; submit POST e atualização da lista. Página Resumo `page.tsx` renderiza a seção apenas para admin_bpo, gestor_bpo, operador_bpo.
- **Task 5 – Evidência:** `gerar-tarefas-recorrentes.test.ts`: 6 testes (calcularDatasOcorrencias diária/semanal/mensal/custom e default 12; gerarTarefasRecorrentes copia checklist com ordem e obrigatoriedade). `route.test.ts`: 9 testes (GET 401/403/404/200; POST 401/403/400/404/201 com rotinaCliente e tarefasGeradas). Suite completa 169 testes passando.
- **Code review – Correções aplicadas:** POST `/api/clientes/[clienteId]/rotinas` agora valida `responsavelPadraoId` no mesmo `bpo_id`, executa limpeza compensatória de `tarefas`/`rotinas_cliente` quando a geração falha e cobre o caso de recorrência mensal em fim de mês sem pular fevereiro. Testes ampliados para validar os três cenários.

### File List

- bpo360-app/supabase/migrations/20260314200000_create_rotinas_cliente_tarefas_checklist.sql
- bpo360-app/src/lib/domain/rotinas/types.ts
- bpo360-app/src/lib/domain/rotinas/gerar-tarefas-recorrentes.ts
- bpo360-app/src/lib/domain/rotinas/gerar-tarefas-recorrentes.test.ts
- bpo360-app/src/app/api/clientes/[clienteId]/rotinas/route.ts
- bpo360-app/src/app/api/clientes/[clienteId]/rotinas/route.test.ts
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/_components/rotinas-cliente-section.tsx
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/page.tsx

### Change Log

- 2026-03-14: Story 2-2 implementada – migração rotinas_cliente/tarefas/tarefa_checklist_itens, lógica de geração (12 ocorrências), API GET/POST rotinas por cliente, UI "Adicionar rotina a partir de modelo" na ficha do cliente, testes unitários e de API.
- 2026-03-14: Code review concluído – correções para validação de responsável por BPO, cleanup compensatório em falhas de geração e recorrência mensal em fim de mês, com testes adicionais.
