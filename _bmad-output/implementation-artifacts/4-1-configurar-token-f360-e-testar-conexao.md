# Story 4.1: Configurar token F360 e testar conexão

Status: ready-for-dev

<!-- Revisão considerando Mastering TypeScript: tipos seguros, Zod em bordas, tsc --noEmit no DoD, padrão Supabase joins. -->

## Story

As a **gestor de BPO**,
I want **informar o token F360 e testar se a conexão funciona**,
so that **eu garanta que a integração está correta antes de usar os dados**.

## Acceptance Criteria

1. **Given** a seção "Integração F360" do cliente com campo Token e botão "Testar conexão",
   **When** clicar em testar e o backend chamar `/PublicLoginAPI/DoLogin`,
   **Then** em sucesso: mensagem "Conexão bem-sucedida" e estado "integração ativa"; em erro: mensagem clara (ex.: "Token inválido ou expirado") sem marcar ativa.
2. **And** o token é armazenado criptografado e nunca devolvido em texto puro pela API.

## Tasks / Subtasks

- [ ] Task 1: UI e fluxo (AC: #1)
  - [ ] Campo token e botão "Testar conexão" na seção Integração F360 do cliente.
  - [ ] Loading e feedback (sucesso/erro) conforme AC.
- [ ] Task 2: Backend e armazenamento (AC: #1, #2)
  - [ ] Endpoint que chama F360 `/PublicLoginAPI/DoLogin` e persiste token criptografado.
  - [ ] Resposta da API nunca expõe token em texto puro; usar token mascarado já existente em `rowToIntegracaoErp`.
- [ ] Task 3: Testes e TypeScript (AC: todos)
  - [ ] Testes unitários para repositório e rota; rodar `tsc --noEmit` antes de marcar done.

## Dev Notes

- **Camada F360:** Usar/estender `F360AuthService` (login via `/PublicLoginAPI/DoLogin`, gestão de JWT por cliente/BPO). Arquitetura: [Source: _bmad-output/planning-artifacts/architecture.md].
- **Persistência:** Tabela `integracoes_erp` já existe; coluna `token_f360_encrypted`, `token_configurado_em`. Repositório em `src/lib/domain/integracoes-erp/` — `buscarIntegracaoF360Row`, atualização com token criptografado. Nunca retornar token em texto puro na API.
- **Padrão de segredos:** Alinhar ao que será definido para Epic 8 (cofre). Story 4-1 deve criptografar antes de gravar e documentar o padrão escolhido (ex.: encrypt no app com chave em env). [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-03-15.md — A3].
- **Resposta padronizada:** `{ data, error }` com `jsonSuccess`/`jsonError` de `src/types/api.ts`. Códigos de erro claros (ex.: `F360_LOGIN_FAILED`, `VALIDATION_ERROR`).

### TypeScript / Mastering TypeScript

- **Validação de entrada:** Body da requisição (token, clienteId) validar com **Zod**; usar schemas em `src/lib/api/schemas/` (ex.: f360). `safeParse` e retorno 400 com `issues` em erro.
- **Tipos:** Definir tipos para resposta do F360 `/PublicLoginAPI/DoLogin` (JWT, expiração, etc.) e para payload de teste; evitar `any`. Usar `satisfies` onde ajudar a preservar literais.
- **Supabase:** Resultados de queries/joins usar padrão `as unknown as Tipo` quando necessário (não `as Tipo` direto). [Source: epic-3-retro — P3; documentar em CLAUDE.md se ainda não estiver.]
- **Definition of Done:** Incluir `tsc --noEmit` no checklist de conclusão da story (e no code review). [Source: epic-3-retro — A1.]
- **Referência:** [Source: bpo360-app/docs/typescript-recommendations.md] — Zod em bordas, ApiResponse<T>, sem any.

### Project Structure Notes

- Rotas: `app/api/clientes/[clienteId]/erp/f360/` ou equivalente para testar conexão e salvar token.
- Domínio: `lib/domain/integracoes-erp/`, `lib/integrations/f360/` (F360AuthService, cliente HTTP).
- UI: `app/(bpo)/clientes/[clienteId]/config/` — componentes já existentes para config ERP; estender com token F360 e botão testar.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — F360AuthService, integração F360, segurança tokens]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-03-15.md — A1, A2, A3, A4]
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
