# Story 4.3: Selecionar contas bancárias relevantes

Status: ready-for-dev

<!-- Revisão considerando Mastering TypeScript: tipos contas F360, Zod, tsc --noEmit no DoD. -->

## Story

As a **gestor de BPO**,
I want **escolher quais contas bancárias do F360 entram em saldo e conciliação**,
so that **não entrem contas fora do escopo (ex.: inativas ou pessoais)**.

## Acceptance Criteria

1. **Given** cada empresa F360 mapeada e a tela "Contas bancárias" (lista via API: nome, banco, agência/conta, tipo),
   **When** o gestor marcar quais contas entram no saldo do dia e nas conciliações,
   **Then** a configuração é salva (ex.: F360ContaMapeada / conta_erp_mapeada) e usada na geração de SnapshotFinanceiro.
2. **And** apenas contas selecionadas são consideradas nos indicadores.

## Tasks / Subtasks

- [ ] Task 1: API F360 e listagem contas (AC: #1)
  - [ ] Endpoint/listagem de contas bancárias por empresa F360 (nome, banco, agência/conta, tipo). Tipos TypeScript para resposta.
  - [ ] UI: tela "Contas bancárias" por empresa mapeada; checkboxes para incluir no saldo e na conciliação.
- [ ] Task 2: Persistência (AC: #1, #2)
  - [ ] Tabela/entidade conta_erp_mapeada (vínculo com empresa_erp_mapeada, id_conta_f360, incluir_saldo, incluir_conciliacao, etc.); migração se necessário.
  - [ ] F360SyncJob / SnapshotFinanceiro usar apenas contas marcadas (Story 4-4 consumirá).
- [ ] Task 3: Testes e TypeScript (AC: todos)
  - [ ] Testes para repositório e rotas; `tsc --noEmit` no DoD.

## Dev Notes

- **Arquitetura:** Entidade `conta_erp_mapeada` (architecture.md). SnapshotFinanceiro agrega por contas selecionadas.
- **Dependência:** Story 4-2 (empresas mapeadas) deve estar feita; contas são por empresa.

### TypeScript / Mastering TypeScript

- **Tipos:** Interfaces para resposta F360 de contas (ex.: `F360ContaBancariaRaw`, `ContaErpMapeadaRow`, `ContaErpMapeada`). Sem `any`.
- **Validação:** Body de POST/PATCH (ids de contas, flags incluir_saldo/incluir_conciliacao) com Zod.
- **Supabase:** Joins com conta_erp_mapeada usar `as unknown as Tipo`.
- **DoD:** `tsc --noEmit` no code review.

### Project Structure Notes

- Domínio: `lib/domain/` — conta_erp_mapeada (tipos + repositório).
- Integração: `lib/integrations/f360/` — listar contas por empresa.
- Rotas: ex. `GET/POST /api/clientes/[clienteId]/erp/f360/empresas/[empresaId]/contas` ou similar.
- UI: dentro da config do cliente ou integrações; abas ou seção por empresa com lista de contas e checkboxes.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — conta_erp_mapeada, SnapshotFinanceiro]

## Dev Agent Record

### Agent Model Used

-

### Debug Log References

-

### Completion Notes List

-

### File List

-
