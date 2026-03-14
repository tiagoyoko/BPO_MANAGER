# Story 8.2: Cadastrar usuários internos (admin, gestor, operador)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **admin do BPO**,
I want **cadastrar, editar e visualizar usuários internos com papéis e permissões**,
so that **o time tenha acesso adequado às funções do sistema (RF-21)**.

## Acceptance Criteria

1. **Given** a área `/admin/usuarios` acessível apenas para `admin_bpo`, **When** o admin acessar a rota, **Then** vê a lista de usuários internos do seu BPO (excluindo `cliente_final`), com nome, e-mail, papel e data de criação.
2. **Given** o formulário de novo usuário, **When** o admin preencher nome, e-mail e papel (`admin_bpo`, `gestor_bpo`, `operador_bpo`), e opcionalmente `cliente_id` para `operador_bpo`, **Then** o usuário é criado no Supabase Auth (via Admin API) e na tabela `usuarios` com `bpo_id` herdado do admin e papel definido.
3. **Given** um usuário interno existente, **When** o admin editar nome, papel ou `cliente_id`, **Then** a linha em `usuarios` é atualizada e a alteração fica registrada com `updated_at` e `atualizado_por_id` (quem fez a alteração).
4. **And** apenas `admin_bpo` consegue acessar `/admin/usuarios` e as rotas `/api/admin/usuarios/*`; qualquer outro papel recebe 403 / redirect para home.
5. **And** a listagem exclui usuários com papel `cliente_final` (esses são gerenciados na Story 8.3).

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,2,3,4)** – Migração: RLS e campos de auditoria em `usuarios`
  - [x] Criar migração `YYYYMMDD_add_admin_rls_and_audit_to_usuarios.sql`:
    - Adicionar colunas `criado_por_id UUID NULL REFERENCES auth.users(id)` e `atualizado_por_id UUID NULL REFERENCES auth.users(id)` em `usuarios`.
    - Adicionar política RLS `usuarios_select_same_bpo` para `admin_bpo` ver todos os usuários do mesmo BPO: `USING (bpo_id = public.get_my_bpo_id())`.
    - Adicionar política RLS `usuarios_insert_admin` para `admin_bpo` inserir: `WITH CHECK (bpo_id = public.get_my_bpo_id())`.
    - Adicionar política RLS `usuarios_update_admin` para `admin_bpo` atualizar: `USING (bpo_id = public.get_my_bpo_id())`.
  - [x] Verificar que a política `usuarios_select_own` (Story 8.1) permanece intacta (acesso à própria linha não é quebrado).

- [x] **Task 2 (AC: 2,4)** – API Route: criar usuário interno
  - [x] Criar `src/app/api/admin/usuarios/route.ts` com método `POST`.
  - [x] Guard: chamar `getCurrentUser()`; retornar `{ data: null, error: { code: "FORBIDDEN", message: "Acesso negado" } }` com HTTP 403 se papel não for `admin_bpo`.
  - [x] Usar Supabase Admin Client (service role key) para `supabase.auth.admin.createUser({ email, password: temporária ou email_confirm: false, user_metadata: { nome } })` ou `supabase.auth.admin.inviteUserByEmail(email)`.
  - [x] Inserir linha em `usuarios` com `id` retornado pelo Auth, `bpo_id` do admin logado, `role`, `nome`, `email`, `cliente_id` (se operador_bpo e fornecido), `criado_por_id = currentUser.id`.
  - [x] Validar: papel informado deve ser `admin_bpo`, `gestor_bpo` ou `operador_bpo` (rejeitar `cliente_final`).
  - [x] Resposta de sucesso: `{ data: { id, nome, email, role, bpoId, clienteId, criadoEm }, error: null }` HTTP 201.

- [x] **Task 3 (AC: 3,4)** – API Route: editar usuário interno
  - [x] Criar `src/app/api/admin/usuarios/[usuarioId]/route.ts` com método `PATCH`.
  - [x] Guard: apenas `admin_bpo`; garantir que o `usuarioId` pertence ao mesmo `bpo_id` (buscar antes de atualizar).
  - [x] Campos editáveis: `nome`, `role` (`admin_bpo`/`gestor_bpo`/`operador_bpo`), `cliente_id`.
  - [x] Atualizar `updated_at` e `atualizado_por_id = currentUser.id`.
  - [x] Resposta: `{ data: { id, nome, email, role, bpoId, clienteId, atualizadoEm }, error: null }` HTTP 200.

- [x] **Task 4 (AC: 1,4)** – API Route: listar usuários internos
  - [x] Criar método `GET` em `src/app/api/admin/usuarios/route.ts`.
  - [x] Guard: apenas `admin_bpo`.
  - [x] Query em `usuarios` onde `bpo_id = currentUser.bpoId` e `role != 'cliente_final'`, ordenado por `nome`.
  - [x] Resposta: `{ data: [{ id, nome, email, role, clienteId, criadoEm, atualizadoEm }], error: null }` HTTP 200.

- [x] **Task 5 (AC: 1,2,3)** – Página `/admin/usuarios`
  - [x] Criar `src/app/(bpo)/admin/usuarios/page.tsx` (Server Component).
  - [x] Chamar `getCurrentUser()`; redirecionar para `/` se papel != `admin_bpo`.
  - [x] Renderizar lista de usuários internos (buscar via Server Action ou fetch server-side a `/api/admin/usuarios`).
  - [x] Botão "Novo usuário" que abre modal/drawer com formulário: nome, e-mail, papel (select), cliente_id (campo condicional para `operador_bpo`).
  - [x] Ação de "Editar" por linha: abre mesmo formulário preenchido.
  - [x] Feedback visual: toast de sucesso/erro usando padrão de `components/feedback/` (padrão da Arquitetura).

- [x] **Task 6** – Testes
  - [x] Teste unitário: `canManageUsers()` retorna `true` apenas para `admin_bpo` (já existe em `rbac.test.ts` da Story 8.1 — verificar cobertura e complementar se necessário).
  - [x] Teste de integração/API: `POST /api/admin/usuarios` com papel `gestor_bpo` retorna 403.
  - [x] Teste de integração/API: `GET /api/admin/usuarios` não retorna usuários com `role = 'cliente_final'`.
  - [x] Teste de migração: verificar que a política `usuarios_select_same_bpo` permite que admin_bpo veja todos do BPO, e que usuário de outro BPO não enxerga nada.

## Dev Notes

### Contexto da Story 8.1 (fundação — LEIA ANTES DE CODAR)

- **Tabela `usuarios`** já existe em `supabase/migrations/20260313180000_create_bpos_and_usuarios.sql`:
  - Colunas: `id UUID PK` (FK `auth.users.id`), `bpo_id UUID NOT NULL`, `role papel_bpo NOT NULL`, `cliente_id UUID NULL`, `nome TEXT`, `email TEXT`, `created_at`, `updated_at`.
  - Enum `papel_bpo`: `'admin_bpo'`, `'gestor_bpo'`, `'operador_bpo'`, `'cliente_final'`.
  - Constraint: `cliente_final_deve_ter_cliente_id` — se `role = 'cliente_final'`, então `cliente_id IS NOT NULL`.
  - RLS existente: somente `usuarios_select_own` (`id = auth.uid()`). **Esta story adiciona políticas para admin_bpo.**
- **Funções auxiliares RLS** (SECURITY DEFINER): `get_my_bpo_id()`, `get_my_role()`, `get_my_cliente_id()` — use-as nas novas políticas.
- **`getCurrentUser()`** em `src/lib/auth/get-current-user.ts` retorna `CurrentUser | null` com `{ id, email, bpoId, role, clienteId, nome }`.
- **`canManageUsers(user)`** em `src/lib/auth/rbac.ts` já implementado — use como guard nas API routes.
- **`UserProvider` / `useUser()`** em `src/lib/auth/user-context.tsx` disponível para componentes client-side.
- **Vitest** configurado (`vitest.config.ts`); testes co-localizados; cobertura existente em `rbac.test.ts` e `get-current-user.test.ts`.

### Supabase Admin Client (CRÍTICO — não confundir com cliente normal)

Criar usuários no Supabase Auth **exige service role key**, nunca a anon key:

```typescript
// src/lib/supabase/admin.ts (NOVO — criar este arquivo)
import { createClient } from "@supabase/supabase-js";

// Só usar server-side (API routes / Server Actions). NUNCA expor ao browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // env server-only (sem NEXT_PUBLIC_)
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- `SUPABASE_SERVICE_ROLE_KEY` já deve estar em `.env.local` (obtido no Supabase Dashboard → Project Settings → API → service_role).
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` ao cliente; nunca usar `createAdminClient()` em Client Components.
- Para criar usuário: `adminClient.auth.admin.createUser({ email, email_confirm: true, user_metadata: { nome } })` — retorna `{ data: { user }, error }`.
- Alternativamente, `adminClient.auth.admin.inviteUserByEmail(email)` envia convite por e-mail.

### RLS: políticas a adicionar na migração

```sql
-- Política: admin_bpo vê todos os usuários do mesmo BPO (inclui os próprios)
CREATE POLICY "usuarios_select_same_bpo"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  );

-- Política: admin_bpo insere usuários no mesmo BPO
CREATE POLICY "usuarios_insert_admin"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  );

-- Política: admin_bpo atualiza usuários do mesmo BPO
CREATE POLICY "usuarios_update_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  )
  WITH CHECK (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  );
```

**Atenção:** a política `usuarios_select_own` (8.1) cobre SELECT do próprio registro para qualquer papel — as novas políticas são **aditivas** (OR implícito do RLS). Não remover a política existente.

### Fluxo de criação de usuário (sequência correta)

1. API route recebe `{ nome, email, role, clienteId? }` via `POST /api/admin/usuarios`.
2. Guard: `getCurrentUser()` → verificar `canManageUsers(user)` → 403 se não.
3. Validar payload (role não pode ser `cliente_final`; se `operador_bpo` com `clienteId`, validar que `clienteId` pertence ao mesmo `bpoId`).
4. `createAdminClient().auth.admin.createUser({ email, email_confirm: true })` — obter `userId`.
5. Inserir em `usuarios` via cliente normal (server) com `bpo_id = user.bpoId`, `role`, `nome`, `email`, `criado_por_id = user.id`.
6. Se passo 5 falhar, tentar `adminClient.auth.admin.deleteUser(userId)` como compensação (best effort).
7. Retornar `{ data: {...}, error: null }` 201.

### Estrutura de arquivos desta story

```
src/
  app/
    (bpo)/
      admin/
        usuarios/
          page.tsx                    # NOVO: Server Component, lista + modal
          _components/
            usuario-form.tsx          # NOVO: formulário criar/editar (Client Component)
            usuarios-table.tsx        # NOVO: tabela de listagem
    api/
      admin/
        usuarios/
          route.ts                    # NOVO: GET (listar) + POST (criar)
          [usuarioId]/
            route.ts                  # NOVO: PATCH (editar)
  lib/
    supabase/
      admin.ts                        # NOVO: createAdminClient (service role)
supabase/
  migrations/
    YYYYMMDD_add_admin_rls_and_audit_to_usuarios.sql  # NOVO
```

### Padrões obrigatórios da Arquitetura

- **Resposta de API**: sempre `{ "data": <payload> | null, "error": null | { "code": "SOME_CODE", "message": "..." } }` com HTTP status adequado.
- **Guards**: chamar `getCurrentUser()` no início de toda API route; nunca confiar no cliente para controle de acesso.
- **JSON boundary**: campos em camelCase no JSON da API; colunas snake_case no banco.
- **Nomes de arquivo**: componentes em `kebab-case.tsx`; tipos PascalCase; funções camelCase.
- **Feedback**: usar componentes de `src/components/feedback/` (toasts/banners) — padrão estabelecido na Arquitetura.
- **Testes co-localizados**: `*.test.ts` ao lado do módulo.

### Project Structure Notes

- Página em `src/app/(bpo)/admin/usuarios/page.tsx` (já prevista na árvore da Arquitetura).
- API em `src/app/api/admin/usuarios/route.ts` — criar pasta `/admin/` dentro de `/api/` (não existe ainda).
- Admin client em `src/lib/supabase/admin.ts` — separado do `client.ts` existente.
- Migração em `supabase/migrations/` — seguir formato `YYYYMMDD_descricao.sql`.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Authentication & Security, Naming Patterns, Project Structure, API Response Format.
- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 8, Story 8.2, critérios de aceite; RF-21.
- [Source: _bmad-output/implementation-artifacts/8-1-autenticacao-e-papeis-supabase-auth-rls.md] — Completion Notes (schema real da tabela `usuarios`), File List (arquivos criados), Dev Notes (rbac, getCurrentUser, UserProvider).
- [Source: bpo360-app/supabase/migrations/20260313180000_create_bpos_and_usuarios.sql] — DDL real: colunas, enum, índices, constraint, funções auxiliares RLS.
- [Source: bpo360-app/src/lib/auth/rbac.ts] — `canManageUsers()` já implementado.
- [Source: bpo360-app/src/types/domain.ts] — `CurrentUser`, `PapelBpo`.
- [Source: _bmad-output/planning-artifacts/implementation-plan-sprint-1.md] — Dependência: 8.1 deve estar concluída antes de 8.2.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Migração `20260313190000_add_admin_rls_and_audit_to_usuarios.sql`: colunas `criado_por_id`, `atualizado_por_id`; políticas `usuarios_select_same_bpo`, `usuarios_insert_admin`, `usuarios_update_admin`. Política `usuarios_select_own` (8.1) não alterada.
- `src/lib/supabase/admin.ts`: `createAdminClient()` com service role; usado apenas server-side.
- API `GET/POST /api/admin/usuarios` e `PATCH /api/admin/usuarios/[usuarioId]`: guard `canManageUsers()`, respostas `{ data, error }`, camelCase no JSON.
- Página `(bpo)/admin/usuarios`: Server Component com redirect se não admin_bpo; lista + modal criar/editar; feedback via estado (banner sucesso/erro) — pasta `components/feedback/` não existia no repo, padrão aplicado com estado local.
- Code review fix: `clienteId` de `operador_bpo` agora é validado contra o mesmo `bpo_id` tanto no `POST` quanto no `PATCH`, evitando vínculo cruzado entre tenants.
- Testes: `route.test.ts` agora cobre criação com `clienteId` válido/inválido; `[usuarioId]/route.test.ts` cobre edição com `clienteId` válido/inválido; migração ganhou validação estática extra para preservar `usuarios_select_own`.

### File List

- bpo360-app/supabase/migrations/20260313190000_add_admin_rls_and_audit_to_usuarios.sql
- bpo360-app/supabase/migrations/20260313190000_add_admin_rls_and_audit_to_usuarios.test.ts
- bpo360-app/src/lib/supabase/admin.ts
- bpo360-app/src/app/api/admin/usuarios/route.ts
- bpo360-app/src/app/api/admin/usuarios/_shared.ts
- bpo360-app/src/app/api/admin/usuarios/route.test.ts
- bpo360-app/src/app/api/admin/usuarios/[usuarioId]/route.ts
- bpo360-app/src/app/api/admin/usuarios/[usuarioId]/route.test.ts
- bpo360-app/src/app/(bpo)/admin/usuarios/page.tsx
- bpo360-app/src/app/(bpo)/admin/usuarios/_components/admin-usuarios-client.tsx
- bpo360-app/src/app/(bpo)/admin/usuarios/_components/usuarios-table.tsx
- bpo360-app/src/app/(bpo)/admin/usuarios/_components/usuario-form.tsx
- bpo360-app/.env.example
