# Story 4.2: Mapear empresas F360 para cliente BPO

Status: ready-for-dev

<!-- Revisão considerando Mastering TypeScript: tipos para empresas F360, Zod em bordas, tsc --noEmit no DoD. -->

## Story

As a **gestor de BPO**,
I want **mapear quais empresas do F360 correspondem a um cliente do BPO**,
so that **os relatórios e saldos certos sejam usados nos indicadores**.

## Acceptance Criteria

1. **Given** conexão bem-sucedida e "Carregar empresas do F360",
   **When** o sistema listar empresas (nome, CNPJ, ID F360) e o gestor selecionar uma ou mais e salvar,
   **Then** o mapeamento é persistido (ex.: F360EmpresaMapeada / empresa_erp_mapeada) e usado em todos os jobs de sincronização.
2. **And** a UI mostra claramente quais empresas estão vinculadas ao cliente.

## Tasks / Subtasks

- [ ] Task 1: API F360 e listagem (AC: #1)
  - [ ] Endpoint ou uso de F360ApiClient para listar empresas (nome, CNPJ, ID F360).
  - [ ] Tipos TypeScript para resposta da API de empresas; normalizar em DTO de domínio.
- [ ] Task 2: Persistência e UI (AC: #1, #2)
  - [ ] Tabela/entidade empresa_erp_mapeada (bpo_id, cliente_id, integracao_erp_id, id_empresa_f360, nome, cnpj, etc.); migração se ainda não existir.
  - [ ] UI: carregar empresas, seleção múltipla, salvar mapeamento; exibir empresas vinculadas ao cliente.
- [ ] Task 3: Testes e TypeScript (AC: todos)
  - [ ] Testes para repositório e rota; `tsc --noEmit` no DoD.

## Dev Notes

- **Arquitetura:** Entidade `empresa_erp_mapeada` (architecture.md). F360SyncJob e snapshots devem usar apenas empresas mapeadas para o cliente.
- **F360ApiClient:** Consumir endpoint de empresas do F360; resposta normalizada em estruturas BPO360 (evitar vazar estrutura bruta da API no domínio).
- **Integração com 4-1:** Cliente precisa ter integração F360 ativa e token válido para "Carregar empresas".

### TypeScript / Mastering TypeScript

- **Tipos da API F360:** Definir interfaces ou tipos para resposta "listar empresas" (ex.: `F360EmpresaRaw`, `EmpresaErpMapeadaRow`, `EmpresaErpMapeada`). Evitar `any`; usar `satisfies` onde apropriado.
- **Validação:** Body de POST (lista de id_empresa_f360 ou similar) validar com Zod; schemas em `src/lib/api/schemas/`.
- **Supabase:** Joins/select que retornem empresa_erp_mapeada usar padrão `as unknown as Tipo` para resultados tipados. [Source: epic-3-retro.]
- **DoD:** `tsc --noEmit` no checklist de code review.

### Project Structure Notes

- Domínio: `lib/domain/` — tipos e repositório para empresa_erp_mapeada; possível subpasta `empresa-erp-mapeada` ou dentro de `integracoes-erp`.
- Integração: `lib/integrations/f360/` — método para listar empresas.
- Rotas: ex. `GET/POST /api/clientes/[clienteId]/erp/f360/empresas`.
- UI: em `clientes/[clienteId]/config/` ou `integacoes` — seção "Empresas F360" com botão carregar e lista selecionável.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — empresa_erp_mapeada, F360]
- [Source: bpo360-app/docs/typescript-recommendations.md]

## Dev Agent Record

### Agent Model Used

-

### Debug Log References

-

### Completion Notes List

-

### File List

-
