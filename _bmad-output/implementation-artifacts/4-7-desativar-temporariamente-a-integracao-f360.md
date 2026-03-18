# Story 4.7: Desativar temporariamente a integração F360

Status: ready-for-dev

<!-- Revisão considerando Mastering TypeScript: tipos para estado ativo, Zod para body, tsc --noEmit no DoD; RF-44 aviso UI. -->

## Story

As a **gestor de BPO**,
I want **desativar a integração F360 de um cliente sem apagar as configurações**,
so that **eu pause sincronizações (ex.: troca de token, auditoria, cliente em pausa)**.

## Acceptance Criteria

1. **Given** a config do cliente com toggle "Integração F360 ativa",
   **When** desativar,
   **Then** jobs não processam aquele cliente; a UI de indicadores mostra "Integração F360 desativada para este cliente".
2. **And** mapeamentos e token permanecem armazenados para reativação; aviso na UI (RF-44) em até 2s com texto objetivo (≤200 caracteres) quando dados desatualizados ou integração desconfigurada.

## Tasks / Subtasks

- [ ] Task 1: Toggle e backend (AC: #1)
  - [ ] Campo ativo na integração F360 (tabela integracoes_erp já tem `ativo`). Endpoint PATCH para alternar ativo (ex.: PATCH /api/clientes/[clienteId]/erp/f360) com body { ativo: boolean }. Validar com Zod.
  - [ ] F360SyncJob.runAll deve ignorar clientes com integração F360 inativa (filtrar por ativo = true).
- [ ] Task 2: UI e mensagens (AC: #1, #2)
  - [ ] Toggle "Integração F360 ativa" na seção de config do cliente; estado refletido na listagem e na área de indicadores.
  - [ ] RF-44: componente ou banner de aviso exibido em até 2s quando dados desatualizados ou integração desconfigurada; texto objetivo ≤200 caracteres. Ex.: "Dados do F360 desatualizados. Atualize agora ou verifique a integração."
- [ ] Task 3: Testes e TypeScript (AC: todos)
  - [ ] Testes para PATCH e para comportamento do job (não processar quando ativo = false); `tsc --noEmit` no DoD.

## Dev Notes

- **Persistência:** Coluna `ativo` em integracoes_erp já existe (architecture e migrações). Apenas expor PATCH e garantir que runAll e runSingle respeitam (runSingle pode retornar erro amigável se cliente estiver inativo).
- **RF-44:** Aviso na UI em até 2s — pode ser um componente que verifica último snapshot + status da integração e exibe banner/toast. Texto objetivo, ≤200 caracteres. Considerar reutilizar em Epic 5 (indicadores).

### TypeScript / Mastering TypeScript

- **Body do PATCH:** Schema Zod ex.: `PatchF360AtivoSchema = z.object({ ativo: z.boolean() })`; inferir tipo e usar em rota.
- **Resposta:** ApiResponse com tipo adequado (ex.: IntegracaoErp ou { ativo: boolean }).
- **DoD:** `tsc --noEmit` no code review.

### Project Structure Notes

- Rota: PATCH em `app/api/clientes/[clienteId]/erp/f360/route.ts` (ou equivalente).
- Domínio: atualizar em `lib/domain/integracoes-erp/` (função para atualizar ativo).
- UI: config do cliente — toggle; componente de aviso RF-44 pode ficar em `components/` ou na pasta de integrações/indicadores.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.7; RF-44]
- [Source: _bmad-output/planning-artifacts/architecture.md — integracao_erp, ativo]
- [Source: bpo360-app/src/lib/domain/integracoes-erp/]

## Dev Agent Record

### Agent Model Used

-

### Debug Log References

-

### Completion Notes List

-

### File List

-
