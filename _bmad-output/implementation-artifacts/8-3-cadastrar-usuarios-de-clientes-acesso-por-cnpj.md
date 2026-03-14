# Story 8.3: Cadastrar usuários de clientes (acesso por CNPJ)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **admin ou gestor de BPO**,
I want **cadastrar usuários de clientes com acesso apenas aos dados do seu CNPJ**,
so that **o cliente acesse o portal e veja somente suas solicitações e documentos (RF-22)**.

## Acceptance Criteria

1. **Given** a área de usuários de clientes (vinculada ao cliente/CNPJ), **When** o admin/gestor criar ou editar um usuário de cliente (e-mail, cliente_id/CNPJ, papel cliente_final), **Then** o usuário é criado no Auth e no perfil com cliente_id; RLS e guards garantem que ele só acesse dados daquele cliente.
2. **And** o cliente consegue acessar o portal (solicitações, documentos, notificações) somente do seu CNPJ.
3. **And** apenas admin_bpo ou gestor_bpo podem cadastrar/editar usuários de clientes; listagem de usuários de clientes filtrada por cliente e por BPO.
4. **And** constraint existente: se role = 'cliente_final', então cliente_id IS NOT NULL (já garantido na migração 8.1).

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,2,3)** – RLS para usuários cliente_final e área de gestão
  - [x] Garantir políticas RLS em `usuarios` que permitam admin_bpo e gestor_bpo listar/criar/atualizar usuários com role cliente_final do mesmo bpo_id; validar que cliente_id pertence a um cliente do mesmo bpo_id.
  - [x] Política SELECT para gestor_bpo/admin_bpo: ver usuários cliente_final cujo cliente_id está em clientes do mesmo bpo_id.
  - [x] Política INSERT: admin_bpo/gestor_bpo podem inserir usuario com role cliente_final e cliente_id pertencente ao BPO.
  - [x] Política UPDATE: admin_bpo/gestor_bpo podem atualizar usuários cliente_final do mesmo BPO.
- [x] **Task 2 (AC: 1,2)** – API: criar usuário de cliente
  - [x] Criar POST em `/api/admin/usuarios` ou rota dedicada `/api/admin/clientes/[clienteId]/usuarios` para criar usuário com role cliente_final e cliente_id = clienteId.
  - [x] Guard: getCurrentUser(); permitir admin_bpo ou gestor_bpo; validar que clienteId pertence ao mesmo bpo_id do usuário logado.
  - [x] Usar createAdminClient() para Supabase Auth; inserir em usuarios com bpo_id, role 'cliente_final', cliente_id, criado_por_id.
  - [x] Resposta: { data: { id, nome, email, role, clienteId, criadoEm }, error: null } 201.
- [x] **Task 3 (AC: 1,3)** – API: listar e editar usuários de clientes
  - [x] GET listar usuários de clientes: filtrar por bpo_id e role = 'cliente_final'; opcionalmente por cliente_id (query param). Guard: admin_bpo ou gestor_bpo.
  - [x] PATCH editar usuário de cliente (nome, e-mail se permitido pelo Auth): apenas admin_bpo/gestor_bpo; usuário alvo deve ser cliente_final do mesmo BPO.
- [x] **Task 4 (AC: 2)** – Portal do cliente e guards
  - [x] Definir rotas do portal (ex.: app/(portal)/ ou app/(bpo)/portal/) acessíveis apenas por role cliente_final; middleware ou layout que redireciona cliente_final para área do portal e bloqueia acesso a /admin e dados de outros clientes.
  - [x] Garantir que get_my_cliente_id() e RLS em tabelas de solicitações/documentos (quando existirem) restrinjam por cliente_id para cliente_final.
- [x] **Task 5** – UI: área de usuários de clientes
  - [x] Página ou seção para admin/gestor listar e criar/editar usuários de clientes (ex.: por cliente, em /admin/clientes/[id]/usuarios ou /admin/usuarios?tipo=cliente). Formulário: e-mail, cliente (select de clientes do BPO), nome opcional. Excluir desta lista usuários internos (role != cliente_final).
- [x] **Task 6** – Testes
  - [x] Teste: gestor_bpo pode criar usuário cliente_final para cliente do seu BPO; não pode para cliente de outro BPO.
  - [x] Teste: cliente_final com cliente_id X não acessa dados de cliente_id Y (via API ou RLS).
  - [x] Teste: listagem de usuários de clientes não retorna usuários internos.

## Dev Notes

- **Contexto 8.1 e 8.2 (OBRIGATÓRIO):** Tabela `usuarios` já tem id, bpo_id, role, cliente_id, nome, email, criado_por_id, atualizado_por_id. Enum papel_bpo inclui 'cliente_final'. Constraint cliente_final_deve_ter_cliente_id já existe. Funções get_my_bpo_id(), get_my_role(), get_my_cliente_id() disponíveis. createAdminClient() em src/lib/supabase/admin.ts para criar usuário no Auth. getCurrentUser() e canManageUsers() em lib/auth; para esta story é preciso permitir também gestor_bpo (ex.: canManageClienteUsers(user)).
- **Reutilizar padrão 8.2:** API em /api/admin/usuarios com guards; ou criar /api/admin/clientes/[clienteId]/usuarios para manter escopo explícito por cliente. Resposta sempre { data, error }; camelCase no JSON.
- **Portal do cliente:** Epics 3 e 8 indicam que cliente_final acessa "portal" (solicitações, documentos). Nesta story o foco é cadastro e garantia de isolamento (RLS + guards); as telas do portal (solicitações, etc.) serão implementadas no Epic 3. Aqui: garantir rota(s) dedicadas ao portal e middleware/layout que aplica escopo cliente_id para cliente_final.
- **Tabela clientes:** Deve existir tabela clientes com bpo_id (Story 1.x). Validar cliente_id contra clientes.bpo_id = get_my_bpo_id() ao criar/editar usuario cliente_final.

### Project Structure Notes

- APIs: estender em `src/app/api/admin/usuarios/` ou criar `src/app/api/admin/clientes/[clienteId]/usuarios/` (GET/POST). PATCH pode ficar em `api/admin/usuarios/[usuarioId]` já existente, validando que o usuário alvo é cliente_final do mesmo BPO.
- Página: `src/app/(bpo)/admin/usuarios/page.tsx` já existe (8.2); adicionar aba ou filtro "Usuários de clientes" e formulário que exige seleção de cliente (do BPO) e cria usuario com role cliente_final. Ou nova página `admin/clientes/[clienteId]/usuarios`.
- Portal: `src/app/(portal)/layout.tsx` (ou equivalente) que verifica role cliente_final e get_my_cliente_id(); rotas internas do portal sob esse layout.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Authentication & Security, RLS, papéis, cliente_final restrito ao cliente_id.
- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 8, Story 8.3, RF-22.
- [Source: _bmad-output/implementation-artifacts/8-1-autenticacao-e-papeis-supabase-auth-rls.md] — Schema usuarios, get_my_cliente_id(), RLS, middleware.
- [Source: _bmad-output/implementation-artifacts/8-2-cadastrar-usuarios-internos-admin-gestor-operador.md] — createAdminClient(), API admin/usuarios, políticas RLS admin, padrão de formulário e listagem.

## Developer Context (Guardrails)

### Technical Requirements

- **Banco:** Reutilizar tabela `usuarios`; não adicionar nova tabela para "usuários de clientes". role = 'cliente_final' e cliente_id NOT NULL já definidos. Novas políticas RLS para que gestor_bpo e admin_bpo possam gerenciar usuários cliente_final do mesmo bpo_id (e cliente_id dentro de clientes do BPO).
- **Auth:** Criar usuário no Supabase Auth via createAdminClient().auth.admin.createUser(); inserir em usuarios com bpo_id do admin/gestor, role 'cliente_final', cliente_id escolhido.
- **Guards:** Novo helper em lib/auth/rbac.ts (ex.: canManageClienteUsers(user): user.role === 'admin_bpo' || user.role === 'gestor_bpo'). Usar em todas as rotas de usuários de clientes.

### Architecture Compliance

- Naming: DB snake_case; API/JSON camelCase. Resposta de API: { data, error } com códigos HTTP adequados.
- Estrutura: auth em lib/auth/; APIs em app/api/admin/; páginas admin em app/(bpo)/admin/.

### Library / Framework Requirements

- Supabase JS (@supabase/supabase-js); Admin Client apenas server-side. Next.js App Router; Server Components onde possível.

### File Structure Requirements

- Não duplicar lógica de createAdminClient ou de criação de usuário Auth; reutilizar padrão de 8-2. Migrações em supabase/migrations/ apenas se novas políticas RLS (ex.: YYYYMMDD_add_cliente_users_rls.sql).
- Testes co-localizados: *.test.ts ao lado das routes ou em __tests__.

### Testing Requirements

- Testar que gestor_bpo e admin_bpo podem criar/listar/editar usuários cliente_final do seu BPO; que operador_bpo não pode.
- Testar que cliente_id deve pertencer a um cliente do mesmo bpo_id (rejeitar 400 se não).
- Testar isolamento: cliente_final não acessa dados de outro cliente (via RLS ou API).

### Project Context Reference

- Nenhum project-context.md no repositório. PRD, Architecture e Epics são fonte de verdade.

---

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-14 13:45 BRT — branch `feature/story-8-3-cadastrar-usuarios-de-clientes-acesso-por-cnpj` criada; implementação iniciada em `bpo360-app/`.
- 2026-03-14 13:52 BRT — `npm test` executado em `bpo360-app/`: 152 testes passando.
- 2026-03-14 13:53 BRT — `npm run lint` executado em `bpo360-app/`: sem erros.
- 2026-03-14 13:56 BRT — tentativa de aplicar a migration `add_cliente_final_user_management_rls` no projeto Supabase falhou com `ERROR: relation "public.clientes" does not exist`; repositório está pronto, mas o banco remoto está atrás das migrações base.

### Completion Notes List

- RLS expandida em `usuarios` para separar gestão de usuários internos e `cliente_final`, permitindo `admin_bpo` e `gestor_bpo` operar apenas no próprio `bpo_id` e validando `cliente_id` contra `clientes`.
- API `/api/admin/usuarios` passou a suportar `GET ?tipo=cliente`, `POST role=cliente_final` e `PATCH` seguro para usuários cliente, com `createAdminClient()` no Auth e payload camelCase.
- RBAC e navegação atualizados com `canManageClienteUsers`, acesso de `gestor_bpo` a `/admin/usuarios` e redirecionamento obrigatório de `cliente_final` para `/portal`, bloqueando a área `(bpo)` fora do escopo do portal.
- Portal inicial criado em `app/(portal)/portal/page.tsx` com layout dedicado; `/` redireciona `cliente_final` para `/portal`.
- UI de `/admin/usuarios` agora mostra seções distintas para internos e clientes, com select de clientes do BPO e exclusão explícita de usuários internos da listagem de clientes.
- Não existiam tabelas de solicitações/documentos no estado atual do repositório; o isolamento de `cliente_final` permanece garantido por `get_my_cliente_id()`/RLS já existente em `clientes` e pelo novo gate do portal, ficando a aplicação do mesmo padrão às tabelas do Epic 3 como continuação natural.
- `mcp__supabase__apply_migration` foi tentado no projeto atual, mas o banco remoto não possui `public.clientes`; a DDL ficou registrada no arquivo de migration e exige alinhamento prévio das migrações base antes do deploy.

### File List

- bpo360-app/src/app/(bpo)/admin/usuarios/page.tsx
- bpo360-app/src/app/(bpo)/admin/usuarios/_components/admin-usuarios-client.tsx
- bpo360-app/src/app/(bpo)/admin/usuarios/_components/usuario-form.tsx
- bpo360-app/src/app/(bpo)/admin/usuarios/_components/usuarios-table.tsx
- bpo360-app/src/app/(bpo)/layout.tsx
- bpo360-app/src/app/(bpo)/page.tsx
- bpo360-app/src/app/(portal)/layout.tsx
- bpo360-app/src/app/(portal)/portal/page.tsx
- bpo360-app/src/app/api/admin/usuarios/_shared.ts
- bpo360-app/src/app/api/admin/usuarios/route.ts
- bpo360-app/src/app/api/admin/usuarios/route.test.ts
- bpo360-app/src/app/api/admin/usuarios/[usuarioId]/route.ts
- bpo360-app/src/app/api/admin/usuarios/[usuarioId]/route.test.ts
- bpo360-app/src/app/api/clientes/[clienteId]/route.test.ts
- bpo360-app/src/lib/auth/rbac.ts
- bpo360-app/src/lib/auth/rbac.test.ts
- bpo360-app/src/lib/auth/navigation.ts
- bpo360-app/src/lib/auth/navigation.test.ts
- bpo360-app/src/middleware.ts
- bpo360-app/src/middleware.test.ts
- bpo360-app/supabase/migrations/20260314143000_add_cliente_final_user_management_rls.sql

### Change Log

- 2026-03-14 — Implementada a Story 8.3 com RLS para `cliente_final`, gestão por `admin_bpo/gestor_bpo`, portal inicial do cliente e correção pós-review para forçar `cliente_final` ao `/portal`, com cobertura automatizada validada por `npm test`.
