# Story 4.4: Sincronizar dados F360 por job agendado

Status: ready-for-dev

<!-- Revisão considerando Mastering TypeScript: tipos SnapshotFinanceiro, respostas F360, tsc --noEmit; mini-design para múltiplos joins (retro A4). -->

## Story

As a **gestor de BPO**,
I want **que os dados do F360 sejam sincronizados automaticamente em intervalos regulares**,
so that **os indicadores fiquem atualizados sem ação manual constante**.

## Acceptance Criteria

1. **Given** o job F360SyncJob.runAll configurável (ex.: 15 ou 30 min),
   **When** o job roda para cada cliente com integração ativa,
   **Then** obtém JWT via F360AuthService, chama endpoints (saldos, pagar/receber, conciliações), normaliza e grava SnapshotFinanceiro com dataReferencia, indicadores e detalhes.
2. **And** falhas são logadas e não impedem o processamento dos demais clientes; rate limiting (RF-43) é respeitado.

## Tasks / Subtasks

- [ ] Task 1: F360SyncJob.runAll (AC: #1, #2)
  - [ ] Implementar ou completar F360SyncJob: listar clientes com integração F360 ativa; para cada um, obter JWT (F360AuthService), chamar F360ApiClient (saldos, títulos, conciliações), normalizar em estrutura SnapshotFinanceiro.
  - [ ] Persistir em snapshot_financeiro (bpo_id, cliente_id, data_referencia, tipo, payload normalizado, origem F360). Tipos TypeScript para payload e row.
- [ ] Task 2: Agendamento e rate limiting (AC: #1, #2)
  - [ ] Job configurável (cron 15/30 min via Vercel ou chamada interna). Rate limiting interno (RF-43) para não exceder limites da API F360.
  - [ ] Tratamento de erro por cliente: logar falha, continuar com os demais; não lançar exceção que interrompa o runAll.
- [ ] Task 3: Testes e TypeScript (AC: todos)
  - [ ] Testes unitários para normalização e para o job (mocks de auth e API); `tsc --noEmit` no DoD.

## Dev Notes

- **Arquitetura:** F360SyncJob (architecture.md). SnapshotFinanceiro com data_referencia, indicadores agregados e detalhes (para drill-down em Epic 5). Usar empresas e contas mapeadas (4-2, 4-3).
- **Histórico de execuções:** Registrar cada execução (uma linha por cliente processado no runAll) em `sync_f360_execucoes` para o histórico da story 4.6 — sucesso/falha, duração, tipo agendada. Ver story 4.6 para modelo da tabela.
- **Mini-design:** Esta story tem múltiplas fontes (integracoes_erp, empresa_erp_mapeada, conta_erp_mapeada, API F360, snapshot_financeiro). Fazer nota de design curta antes da implementação: fluxo runAll, ordem de leitura, formato do payload de snapshot, tipos principais. [Source: epic-3-retro — A4.]

### TypeScript / Mastering TypeScript

- **Tipos de domínio:** Definir `SnapshotFinanceiro`, `SnapshotFinanceiroRow`, tipo do payload (saldos, contas_a_pagar, contas_a_receber, conciliacoes_pendentes) com estruturas bem tipadas. Respostas da API F360 tipadas (ex.: `F360SaldoResponse`, `F360TitulosResponse`) e funções de normalização que recebem `unknown` e retornam tipo conhecido (ou usam Zod para validar em runtime em pontos críticos).
- **Evitar any:** Em especial nos payloads de snapshot e nas respostas do cliente HTTP F360.
- **Supabase:** Inserts/selects em snapshot_financeiro e joins usar tipos explícitos; cast `as unknown as Tipo` quando necessário.
- **DoD:** `tsc --noEmit` no code review.

### Project Structure Notes

- Job: `lib/integrations/f360/F360SyncJob.ts` ou em `app/api/cron/` / serverless que chama o job.
- Domínio: `lib/domain/` — tipos e repositório de snapshot_financeiro (se ainda não existir).
- Integração: F360AuthService, F360ApiClient em `lib/integrations/f360/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.4]
- [Source: _bmad-output/planning-artifacts/architecture.md — F360SyncJob, snapshot_financeiro, rate limiting]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-03-15.md — A4]

## Dev Agent Record

### Agent Model Used

-

### Debug Log References

-

### Completion Notes List

-

### File List

-
