# Story 4.5: Rodar sincronização F360 para um cliente via API

Status: ready-for-dev

<!-- Revisão considerando Mastering TypeScript: ApiResponse<T>, Zod para params, tsc --noEmit no DoD. -->

## Story

As a **backend / API interna**,
I want **disparar sincronização F360 apenas para um cliente**,
so that **a UI e integrações internas suportem "Atualizar agora" sem afetar toda a carteira**.

## Acceptance Criteria

1. **Given** um endpoint autenticado (ex.: POST /integrations/f360/sync/{clienteId}) restrito a admin/gestor,
   **When** o endpoint for chamado,
   **Then** executa F360SyncJob.runSingle(clienteId) e retorna status (OK/erro) e opcionalmente resumo ou ID do novo snapshot.
2. **And** erros são tratados e retornados no formato { data, error }.

## Tasks / Subtasks

- [ ] Task 1: Endpoint POST sync (AC: #1, #2)
  - [ ] Rota POST (ex.: `/api/clientes/[clienteId]/erp/f360/sync` ou `/api/integrations/f360/sync/[clienteId]`) restrita a admin/gestor (RBAC).
  - [ ] Chamar F360SyncJob.runSingle(clienteId); retornar jsonSuccess com status e opcionalmente id do snapshot ou resumo; em erro, jsonError com código e mensagem.
- [ ] Task 2: Testes e TypeScript (AC: todos)
  - [ ] Testes da rota (mock do job); validar formato { data, error }; `tsc --noEmit` no DoD.

## Dev Notes

- **Reuso:** F360SyncJob.runSingle(clienteId) deve ser a mesma lógica usada por um item do runAll, mas para um único cliente. Story 4-4 implementa o job; esta story expõe runSingle via API.
- **Histórico de execuções:** Registrar cada execução em `sync_f360_execucoes` ao chamar runSingle (tipo manual) — ver story 4.6 para modelo da tabela e campos.
- **Resposta:** Usar `jsonSuccess`/`jsonError` de `src/types/api.ts`. Tipo de `data`: ex. `{ status: 'ok', snapshotId?: string }` ou `{ status: 'error', message: string }` dentro de data; ou manter status HTTP e error no corpo. Alinhar ao padrão existente do projeto.

### TypeScript / Mastering TypeScript

- **Tipos de resposta:** Definir tipo para o corpo de sucesso (ex.: `SyncF360Response`: status, snapshotId opcional). Usar `ApiResponse<SyncF360Response>` e `jsonSuccess(…)`/`jsonError(…)`.
- **Params:** clienteId da URL validar (UUID); usar Zod se já houver schema de path params ou validar manualmente com tipo string e formato UUID.
- **DoD:** `tsc --noEmit` no code review.

### Project Structure Notes

- Rota: `app/api/clientes/[clienteId]/erp/f360/sync/route.ts` ou em `app/api/integrations/f360/sync/[clienteId]/route.ts`.
- Job: `lib/integrations/f360/F360SyncJob.ts` — método runSingle(clienteId).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — F360SyncJob, API]
- [Source: bpo360-app/src/types/api.ts — ApiResponse, jsonSuccess, jsonError]

## Dev Agent Record

### Agent Model Used

-

### Debug Log References

-

### Completion Notes List

-

### File List

-
