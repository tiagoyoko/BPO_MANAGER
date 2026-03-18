# Story 4.6: Ver status e histórico de sincronizações F360

Status: ready-for-dev

<!-- Revisão considerando Mastering TypeScript: tipos para histórico, filtros com Zod, tsc --noEmit no DoD. -->

## Story

As a **gestor ou time técnico**,
I want **ver o histórico de sincronizações F360 por cliente**,
so that **eu diagnostique problemas e valide se os dados estão atualizando**.

## Acceptance Criteria

1. **Given** a seção de integração do cliente e a aba "Histórico de sincronizações",
   **When** visualizar as execuções (agendada ou manual),
   **Then** são exibidos data/hora, tipo, resultado (sucesso/falha), duração e, em falha, código/descrição resumida.
2. **And** é possível filtrar por período e tipo de execução.

## Tasks / Subtasks

- [ ] Task 1: Modelo e persistência do histórico (AC: #1)
  - [ ] Definir onde o histórico é armazenado: tabela de execuções (ex.: sync_f360_execucoes ou similar) com cliente_id, data_hora, tipo (agendada|manual), resultado (sucesso|falha), duracao_ms, mensagem_erro opcional. F360SyncJob (4-4 e 4-5) deve registrar cada execução.
  - [ ] Tipos TypeScript: SyncExecucaoRow, SyncExecucao; repositório para listar com filtros.
- [ ] Task 2: API e UI (AC: #1, #2)
  - [ ] GET endpoint (ex.: /api/clientes/[clienteId]/erp/f360/historico) com query params período (dataInicio, dataFim) e tipo (agendada|manual). Validar query com Zod.
  - [ ] UI: aba "Histórico de sincronizações" com tabela (data/hora, tipo, resultado, duração, mensagem em falha) e filtros.
- [ ] Task 3: Testes e TypeScript (AC: todos)
  - [ ] Testes para repositório e rota; `tsc --noEmit` no DoD.

## Dev Notes

- **Fonte dos dados:** Usar tabela dedicada `sync_f360_execucoes` (nome alinhado à architecture; criar migração se não existir). Campos: cliente_id, data_hora, tipo (agendada|manual), resultado (sucesso|falha), duracao_ms, mensagem_erro opcional. F360SyncJob nas stories 4.4 (runAll — uma linha por cliente processado) e 4.5 (runSingle) deve registrar cada execução nessa tabela. Não derivar histórico de snapshot_financeiro: falhas e duração exigem registro explícito.
- **RBAC:** Endpoint restrito a gestor/admin (e operador se o produto permitir); alinhar ao restante do app.

### TypeScript / Mastering TypeScript

- **Tipos:** `SyncExecucao`, `SyncExecucaoRow`, enum ou union para tipo e resultado. Resposta da API tipada com `ApiResponse<{ execucoes: SyncExecucao[] }>`.
- **Query params:** Validar com Zod (dataInicio, dataFim como string ISO ou date, tipo como enum). Retornar 400 com issues se inválido.
- **Supabase:** Selects/joins na tabela de execuções com tipo explícito; `as unknown as Tipo` se necessário.
- **DoD:** `tsc --noEmit` no code review.

### Project Structure Notes

- Domínio: `lib/domain/` — tipos e repositório de execuções de sync (ex.: sync-execucoes ou dentro de integracoes-erp).
- Rota: `app/api/clientes/[clienteId]/erp/f360/historico/route.ts`.
- UI: `app/(bpo)/clientes/[clienteId]/config/` ou página integrações — aba "Histórico de sincronizações".

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.6]
- [Source: _bmad-output/planning-artifacts/architecture.md — observabilidade, logs]

## Dev Agent Record

### Agent Model Used

-

### Debug Log References

-

### Completion Notes List

-

### File List

-
