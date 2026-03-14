# Story 1.1: Setup do projeto (Next.js + Supabase)

Status: done

<!-- Validação opcional: executar validate-create-story antes de dev-story. -->

## Story

As a **desenvolvedor**,
I want **inicializar o projeto com o Starter Next.js + Supabase**,
so that **a base do app esteja pronta para multi-tenant e integrações**.

## Acceptance Criteria

1. **Given** um repositório vazio ou novo,
   **When** executar `npx create-next-app --example with-supabase with-supabase-app` e configurar variáveis de ambiente,
   **Then** o projeto sobe com App Router, TypeScript, Tailwind e Supabase (auth, Postgres, client) configurados.
2. **And** a estrutura de pastas segue o definido na Arquitetura (`app/(public)`, `app/(bpo)`, `lib/`, etc.), conforme documento de arquitetura (route groups e organização por feature).

## Tasks / Subtasks

- [x] **Task 1 (AC: 1)** Inicializar projeto com template oficial
  - [x] Executar `npx create-next-app --example with-supabase with-supabase-app` (ou nome do app desejado, ex.: `bpo360-app`).
  - [x] Configurar `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e variáveis adicionais do exemplo, se houver).
  - [x] Verificar que o app sobe com `npm run dev`, com App Router, TypeScript e Tailwind funcionando.
- [x] **Task 2 (AC: 2)** Alinhar estrutura de pastas à Arquitetura
  - [x] Garantir route groups: `app/(public)/` (ex.: login, auth/callback) e `app/(bpo)/` (áreas autenticadas: clientes, tarefas, foco, integrações, admin, etc.).
  - [x] Criar esqueleto de pastas em `lib/`: `lib/supabase/`, `lib/auth/`, `lib/domain/`, `lib/integrations/f360/`, `lib/utils/`, `lib/logging/` (ou equivalente conforme template).
  - [x] Garantir que a raiz do app (ou `src/` se o template usar) reflita a estrutura do Architecture Decision Document (seção "Complete Project Directory Structure").
- [x] **Task 3 (AC: 1 e 2)** Documentação e verificação
  - [x] Atualizar `.env.example` com variáveis necessárias (sem valores sensíveis).
  - [x] Confirmar que Supabase (auth e client) está configurado e acessível a partir do app.

## Dev Notes

- **Starter oficial:** O comando exato recomendado pela arquitetura é `npx create-next-app --example with-supabase with-supabase-app`. O último argumento é o nome da pasta do app; pode ser substituído por `bpo360-app` para manter consistência com o ADR.
- **Estrutura alvo:** O Architecture Decision Document define estrutura sob `src/` (ou raiz) com `app/(public)`, `app/(bpo)`, `app/api/`, `lib/` e subpastas. Se o template gerar `app/` na raiz sem `src/`, adaptar criando os route groups `(public)` e `(bpo)` e as pastas em `lib/` conforme o ADR. Objetivo: deixar a base pronta para multi-tenant e para as próximas stories (auth/RLS em 8.1, cadastro de clientes em 1.2).
- **Convenções já válidas para o projeto:** DB snake_case (tabelas/colunas), API/JSON camelCase na borda, componentes PascalCase, arquivos kebab-case; organização por feature; testes co-localizados; domínio em `lib/domain/`, integrações em `lib/integrations/f360/`, auth em `lib/auth/`.

### Project Structure Notes

- **Fonte de verdade:** [Source: _bmad-output/planning-artifacts/architecture.md — seções "Starter Template Evaluation", "Project Structure & Boundaries", "Complete Project Directory Structure".]
- O template Vercel/Supabase já traz Auth e client Supabase; não trocar por outra lib de auth. Manter Tailwind como solução de estilo.
- Se o exemplo usar `app/` na raiz (sem `src/`), manter assim e criar apenas os route groups e subpastas faltantes; se o ADR exigir `src/app/` e `src/lib/`, mover/recriar para esse layout nesta story para evitar conflito com as demais.

### References

- **Épicos e critérios:** [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.1.]
- **Arquitetura (starter, estrutura, convenções):** [Source: _bmad-output/planning-artifacts/architecture.md.]
- **Plano Sprint 1 (ordem e contexto):** [Source: _bmad-output/planning-artifacts/implementation-plan-sprint-1.md.]
- **Arquitetura de informação (rotas/IA):** [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md.]

---

## Developer Context (guardrails para o agente de implementação)

### Technical requirements

- **Stack obrigatória:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Auth + Postgres + client). Nenhuma outra stack de auth ou DB nesta story.
- **Comando de criação:** `npx create-next-app --example with-supabase with-supabase-app` (ou nome do diretório desejado). Não usar outros starters (ex.: Create React App, Vite para este app).
- **Variáveis de ambiente:** Documentar em `.env.example` todas as variáveis usadas pelo template (ex.: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Não commitar valores reais.

### Architecture compliance

- Route groups: `(public)` para login/auth callback; `(bpo)` para áreas autenticadas (clientes, tarefas, foco, integrações, timesheet, cofre, monitoracao, admin).
- Estrutura em `lib/`: `supabase/`, `auth/`, `domain/`, `integrations/f360/`, `utils/`, `logging/` (ou equivalente do template). Manter convenções do ADR (naming, organização por feature).
- Não implementar lógica de negócio além do setup; não criar tabelas ou RLS nesta story (virão em 8.1 e épicos seguintes).

### Library / framework requirements

- **Next.js:** App Router apenas; não usar Pages Router para novas rotas.
- **Supabase:** Usar o client e helpers do template (browser/server conforme doc oficial). Não adicionar outro ORM ou cliente Postgres direto para esta story.
- **Tailwind:** Manter como no template; não introduzir outro sistema de CSS global sem alinhar com a arquitetura.

### File structure requirements

- Pastas e arquivos em **kebab-case** (ex.: `cliente-visao-360.tsx`).
- Componentes React em **PascalCase** (ex.: `ClienteVisao360`).
- APIs sob `app/api/` com rotas plural e minúsculas (ex.: `/api/clientes`). Só criar rotas necessárias para o setup mínimo; o restante virá nas stories de funcionalidade.
- Testes co-localizados: `*.test.ts` / `*.test.tsx` ao lado do código quando houver testes nesta story (opcional para setup inicial).

### Testing requirements

- Para esta story, foco em: app inicia sem erro, variáveis de ambiente documentadas, estrutura de pastas verificável. Testes automatizados (Jest/Playwright) podem ser configurados em story futura se o template não os trouxer; não é bloqueante para “pronto”.

### Project context reference

- Nenhum `project-context.md` encontrado no repositório. Todo o contexto vem do PRD, épicos, arquitetura e plano de Sprint 1 nos paths indicados acima.

---

## Dev Agent Record

### Agent Model Used

_(preenchido pós-implementação)_

### Debug Log References

_(opcional)_

### Completion Notes List

- Projeto criado com `npx create-next-app --example with-supabase bpo360-app`. Estrutura em `src/` com route groups `(public)` e `(bpo)`, client/server Supabase em `src/lib/supabase/`, `.env.example` com placeholders. Build e dev validados.
- Code review 2026-03-13: `.env.example` corrigido (credenciais reais removidas); pasta `lib/integrations/f360/` criada; story atualizada com File List e tasks [x].

### File List

- `bpo360-app/.env.example`
- `bpo360-app/.gitignore`
- `bpo360-app/package.json`
- `bpo360-app/tsconfig.json`
- `bpo360-app/next.config.ts`
- `bpo360-app/postcss.config.mjs`
- `bpo360-app/tailwind.config.ts`
- `bpo360-app/eslint.config.mjs`
- `bpo360-app/proxy.ts`
- `bpo360-app/supabase/config.toml`
- `bpo360-app/supabase/migrations/` (pasta; migrações futuras em 8.1)
- `bpo360-app/src/app/globals.css`
- `bpo360-app/src/app/layout.tsx`
- `bpo360-app/src/app/(public)/login/page.tsx`
- `bpo360-app/src/app/(public)/auth/callback/route.ts`
- `bpo360-app/src/app/(public)/auth/confirm/route.ts`
- `bpo360-app/src/app/(public)/auth/error/page.tsx`
- `bpo360-app/src/app/(public)/auth/error/auth-error-content.tsx`
- `bpo360-app/src/app/(bpo)/layout.tsx`
- `bpo360-app/src/app/(bpo)/page.tsx`
- `bpo360-app/src/lib/supabase/client.ts`
- `bpo360-app/src/lib/supabase/server.ts`
- `bpo360-app/src/lib/supabase/proxy.ts`
- `bpo360-app/src/lib/auth/` (get-current-user.ts, rbac.ts, user-context.tsx)
- `bpo360-app/src/lib/utils.ts`
- `bpo360-app/src/lib/domain/` (esqueleto)
- `bpo360-app/src/lib/integrations/` e `src/lib/integrations/f360/` (esqueleto)
- `bpo360-app/src/lib/logging/` (esqueleto)
- `bpo360-app/src/types/domain.ts`
- `bpo360-app/src/components/**` (login-form, ui/*, etc.)
- `bpo360-app/src/middleware.ts`
