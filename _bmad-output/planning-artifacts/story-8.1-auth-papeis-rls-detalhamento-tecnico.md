# Story 8.1 – Autenticação e papéis (Supabase Auth + RLS) – Detalhamento técnico

**Épico:** EP8 – Segurança, Usuários e Cofre de Senhas  
**Story ID:** 8.1  
**Referências:** `epics.md`, `architecture.md`, `implementation-plan-sprint-1.md`

---

## 1. Objetivo

Implementar login seguro com Supabase Auth (e-mail/senha ou magic link), associar cada usuário a um tenant (`bpo_id`) e a um papel (`admin_bpo`, `gestor_bpo`, `operador_bpo`, `cliente_final`), e garantir isolamento de dados por BPO via RLS. O papel `cliente_final` fica restrito ao seu `cliente_id`. Middleware e guards devem aplicar papel em rotas e frontend; o app deve ter acesso a `bpo_id` e papel em toda requisição autenticada.

---

## 2. Pré-requisitos

- **Story 1.1 concluída:** projeto Next.js + Supabase com estrutura `src/app/(public)`, `src/app/(bpo)`, `src/lib/supabase`, login e callback de auth configurados.
- **Supabase:** projeto criado, URL e anon key em `.env.local`.
- **Convenções:** tabelas/colunas em `snake_case` (plural para tabelas); JSON/API em `camelCase` na borda.

---

## 3. Modelo de dados (multi-tenant + perfis)

### 3.1. Tabelas

Todas as tabelas de domínio do BPO360 terão `bpo_id` (e, quando aplicável, `cliente_id`). Para a Story 8.1 são necessárias apenas as tabelas de **tenant** e **perfil de usuário**.

#### Tabela `bpos` (tenant)

Cada “escritório BPO” é um tenant. Uma linha por BPO.

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_bpos_and_usuarios.sql

CREATE TABLE public.bpos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bpos ENABLE ROW LEVEL SECURITY;

-- Nenhum usuário acessa bpos via RLS direto no MVP; apenas service role ou backend com contexto.
-- Política mínima: ninguém seleciona bpos via anon/authenticated (uso apenas server-side com service role ou em funções).
CREATE POLICY "bpos_no_direct_select"
  ON public.bpos FOR SELECT
  TO authenticated
  USING (true);
-- Ajuste: em produção você pode restringir a "apenas o próprio bpo_id" quando ler de usuarios.
```

Na prática, para 8.1, pode-se usar uma política mais simples: **SELECT para authenticated** (cada um vê todos os bpos; o isolamento real é por `usuarios.bpo_id` e pelas outras tabelas que filtram por `bpo_id`). Ou deixar apenas o backend (service role) criar/ler bpos e não expor SELECT público em `bpos`. Para simplicidade: **SELECT para authenticated** (útil para dropdown “qual BPO” no admin; depois pode restringir).

#### Tabela `usuarios` (perfil por usuário Auth)

Uma linha por usuário do sistema; `id` = `auth.uid()`. Armazena `bpo_id`, `role` e, para `cliente_final`, `cliente_id`.

```sql
CREATE TYPE public.papel_bpo AS ENUM (
  'admin_bpo',
  'gestor_bpo',
  'operador_bpo',
  'cliente_final'
);

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bpo_id UUID NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  role public.papel_bpo NOT NULL,
  cliente_id UUID NULL,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cliente_final_deve_ter_cliente_id
    CHECK (
      (role <> 'cliente_final') OR
      (role = 'cliente_final' AND cliente_id IS NOT NULL)
    )
);

CREATE INDEX idx_usuarios_bpo_id ON public.usuarios(bpo_id);
CREATE INDEX idx_usuarios_email ON public.usuarios(email);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado só vê o próprio perfil.
CREATE POLICY "usuarios_select_own"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Inserção/atualização: apenas via backend (service role) ou função com security definer; não expor para anon.
-- Para 8.1 não damos INSERT/UPDATE para authenticated em usuarios (isso será feito na Story 8.2 pelo backend).
```

Com isso, **RLS em `usuarios`** garante que cada usuário só lê a própria linha. Inserções/updates em `usuarios` vêm da Story 8.2 (tela de admin), usando service role ou uma função `security definer` chamada pelo backend.

### 3.2. Funções auxiliares para RLS (e para o app)

Usadas nas políticas RLS das **outras** tabelas de domínio (clientes, tarefas, etc.) e, opcionalmente, no backend para obter contexto do usuário.

```sql
CREATE OR REPLACE FUNCTION public.get_my_bpo_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bpo_id FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.papel_bpo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_cliente_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cliente_id FROM public.usuarios WHERE id = auth.uid();
$$;
```

- **STABLE** + **SECURITY DEFINER** + **search_path = public**: seguros para uso em RLS e retornam o contexto do usuário atual.
- Nas tabelas futuras (ex.: `clientes`): política do tipo `USING (bpo_id = get_my_bpo_id())` e, para `cliente_final`, `AND (get_my_role() = 'cliente_final' AND cliente_id = get_my_cliente_id())`.

### 3.3. Exemplo de RLS em uma tabela de domínio (clientes)

Na Story 8.1 não é obrigatório criar a tabela `clientes`; ela virá no EP1. Como **template** para qualquer tabela com `bpo_id`:

```sql
-- Exemplo (rodar quando criar tabela clientes no EP1):
-- CREATE POLICY "clientes_isolamento_por_bpo"
--   ON public.clientes FOR ALL
--   TO authenticated
--   USING (bpo_id = get_my_bpo_id())
--   WITH CHECK (bpo_id = get_my_bpo_id());
--
-- Se cliente_final só pode ver seu cliente:
-- USING (
--   bpo_id = get_my_bpo_id()
--   AND (
--     get_my_role() <> 'cliente_final'
--     OR (get_my_role() = 'cliente_final' AND id = get_my_cliente_id())
--   )
-- );
```

Para 8.1, basta deixar as funções e as políticas em `bpos` e `usuarios` criadas; as demais tabelas usarão o mesmo padrão quando forem criadas.

---

## 4. Disponibilizar bpo_id e papel no app (session + profile)

O Supabase não coloca por padrão colunas de tabelas customizadas no JWT. Duas abordagens:

- **A) Perfil em toda requisição (recomendado para 8.1):** após obter a sessão (getSession), o app busca o perfil em `usuarios` (uma vez por request ou por layout). O resultado (`bpo_id`, `role`, `cliente_id`) funciona como “claims” da aplicação.
- **B) Custom claims no JWT:** usar Auth Hook (Supabase) ou trigger em `auth.users` que atualiza `raw_user_meta_data` com `bpo_id` e `role` a partir de `usuarios`. O JWT passará a carregar esses valores; RLS continua igual.

Para 8.1, **A** é suficiente e evita configuração de hooks. Documentar **B** como opcional.

### 4.1. Obter usuário atual + perfil no servidor

**Arquivo:** `src/lib/auth/get-current-user.ts`

- Usar o **client Supabase do servidor** (cookies) para `getUser()` ou `getSession()`.
- Se não houver sessão, retornar `null`.
- Se houver, fazer `SELECT id, bpo_id, role, cliente_id, nome, email FROM public.usuarios WHERE id = user.id`. Se não existir linha, o usuário está “sem perfil” (não deve acessar área BPO); retornar null ou um objeto de erro.
- Retornar tipo: `{ id, email, bpoId, role, clienteId | null, nome }` (camelCase na aplicação).

Exemplo de assinatura:

```ts
// get-current-user.ts
export async function getCurrentUser(): Promise<CurrentUser | null>
export type CurrentUser = {
  id: string
  email: string | null
  bpoId: string
  role: 'admin_bpo' | 'gestor_bpo' | 'operador_bpo' | 'cliente_final'
  clienteId: string | null
  nome: string | null
}
```

Implementação: criar cliente Supabase com `createServerClient` (cookies), chamar `getUser()`, depois query em `usuarios` com o `id` retornado. Garantir que o Supabase client usa o mesmo `cookieStore` do request (App Router: `cookies()`).

### 4.2. Middleware: proteger rotas e (opcional) injetar contexto

**Arquivo:** `src/app/middleware.ts`

- Listar rotas públicas: `/login`, `/auth/callback`, `/` (landing, se houver), assets.
- Para rotas sob `/(bpo)/*` (ou equivalente): redirecionar para `/login` se não houver cookie de sessão Supabase. Ver sessão via `createServerClient` e `getSession()` no middleware (usar approach recomendada pelo Supabase para Next.js middleware).
- Não é obrigatório no middleware carregar o perfil (`usuarios`); pode-se carregar apenas no layout de `(bpo)` para evitar duplicar lógica. O importante é **bloquear acesso não autenticado** às rotas da área BPO.
- Redirecionar pós-login: após login bem-sucedido, enviar para a home da área BPO (ex.: `/clientes` ou `/` do (bpo)).

### 4.3. Layout (bpo): garantir sessão + perfil e repassar contexto

No **layout** de `src/app/(bpo)/layout.tsx`:

- Chamar `getCurrentUser()`. Se `null`, redirecionar para `/login`.
- Passar `bpoId` e `role` (e `clienteId` se for `cliente_final`) para os filhos via **React Context** ou como props (evitar prop drilling excessivo). Assim, todas as páginas e componentes da área BPO têm acesso a “claims” (bpo_id, papel).

### 4.4. Guards por papel (RBAC)

**Arquivo:** `src/lib/auth/rbac.ts` (ou `src/lib/rbac.ts` conforme Arquitetura)

Funções que recebem o usuário atual (ou `role`/`bpoId`/`clienteId`) e retornam booleano:

- `canAccessAdmin(user)`: `user.role === 'admin_bpo'`
- `canManageUsers(user)`: `user.role === 'admin_bpo'`
- `canAccessCliente(user, clienteId)`: se `user.role === 'cliente_final'`, retornar `user.clienteId === clienteId`; caso contrário, retornar `true` (gestor/operador veem todos do BPO, filtrado por RLS).

Usar esses guards nas páginas (ex.: `/admin/usuarios` só renderiza ou redireciona se `canManageUsers(user)`) e, no backend, nas API routes que precisarem (repetir a checagem de papel além da RLS).

---

## 5. Restrição do papel `cliente_final`

- **Banco:** a política RLS nas tabelas de domínio que tiverem dados “por cliente” deve incluir: se `get_my_role() = 'cliente_final'`, então só permitir acesso a linhas onde `cliente_id = get_my_cliente_id()` (além de `bpo_id = get_my_bpo_id()`).
- **App:** no layout e nos guards, `cliente_final` não vê menu/routes de admin, gestão de usuários, outros clientes; só vê o que for do seu `cliente_id`. As rotas que recebem `clienteId` devem chamar `canAccessCliente(user, clienteId)` antes de carregar dados.
- **API:** nas route handlers que recebem `clienteId`, verificar `canAccessCliente(currentUser, clienteId)` e retornar 403 se falso; a RLS já bloqueia no banco, mas a checagem no app/API melhora a UX e a segurança em camadas.

---

## 6. Fluxo de login e callback

- **Login:** página `(public)/login` usa `supabase.auth.signInWithPassword({ email, password })` ou `signInWithOtp`. Após sucesso, redirecionar para a URL de destino (ex.: home do BPO) ou para `/auth/callback` se o Supabase exigir troca de code por sessão em OAuth/magic link.
- **Callback:** `(public)/auth/callback/route.ts` usa o client de servidor para `exchangeCodeForSession` (ou equivalente). Depois redireciona para a área BPO (ex.: `/` ou `/clientes`). Garantir que o middleware não bloqueie a rota `/auth/callback`.
- **Logout:** chamar `supabase.auth.signOut()` e redirecionar para `/login`.

Após o login, na primeira carga da área `(bpo)`, o layout chama `getCurrentUser()`. Se a tabela `usuarios` não tiver linha para aquele `auth.uid()`, o usuário “não tem perfil” e não pode usar o sistema: redirecionar para uma página de “Acesso não autorizado” ou exibir mensagem clara. Na Story 8.2, o admin criará usuários no Auth e em `usuarios`; para 8.1, usar **seed** para ter um usuário de teste.

---

## 7. Seed: primeiro BPO e primeiro admin

Para testar 8.1 sem a tela de cadastro de usuários (8.2), é necessário ter ao menos um BPO e um usuário com perfil em `usuarios`.

**Opção A – Seed SQL (recomendado):**

1. No painel Supabase (Authentication), criar manualmente um usuário (e-mail/senha) e copiar o **User UID**.
2. Em **SQL Editor**, rodar:

```sql
INSERT INTO public.bpos (id, nome) VALUES
  ('00000000-0000-0000-0000-000000000001', 'BPO Demo');

INSERT INTO public.usuarios (id, bpo_id, role, nome, email) VALUES
  ('<COLAR_AQUI_UID_DO_AUTH>', '00000000-0000-0000-0000-000000000001', 'admin_bpo', 'Admin Demo', 'admin@demo.bpo360.local');
```

**Opção B – Arquivo seed no repo:**

Criar `supabase/seed.sql` (executado com `supabase db reset` ou via painel):

- Inserir um `bpos` com ID fixo.
- Não é possível inserir em `auth.users` via SQL comum; o seed pode apenas inserir em `usuarios` referenciando um UID que você criou antes no Auth (como em A), ou documentar que o primeiro admin deve ser criado pelo painel do Supabase e depois um script/seed associa o UID a uma linha em `usuarios`.

Documentar no README ou no próprio detalhamento: “Para ambiente local, criar um usuário no Supabase Auth e em seguida inserir a linha correspondente em `usuarios` com role `admin_bpo` e o `bpo_id` do seed.”

---

## 8. Arquivos a criar/alterar (checklist)

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/YYYYMMDDHHMMSS_create_bpos_and_usuarios.sql` | Criar: tabelas `bpos`, `usuarios`, enum `papel_bpo`, políticas RLS, funções `get_my_bpo_id`, `get_my_role`, `get_my_cliente_id`. |
| `supabase/seed.sql` | Opcional: inserir um BPO e instruções para associar um usuário Auth a `usuarios`. |
| `src/lib/auth/get-current-user.ts` | Criar: obter sessão + perfil em `usuarios`, retornar `CurrentUser` (bpoId, role, clienteId, etc.). |
| `src/lib/auth/rbac.ts` (ou `src/lib/rbac.ts`) | Criar: `canAccessAdmin`, `canManageUsers`, `canAccessCliente`. |
| `src/app/middleware.ts` | Alterar: proteger rotas `/(bpo)/*`, redirecionar não autenticado para `/login`, permitir `/login` e `/auth/callback`. |
| `src/app/(bpo)/layout.tsx` | Alterar: chamar `getCurrentUser()`, redirecionar se null; fornecer contexto (bpoId, role, clienteId) via Context ou equivalente. |
| `src/app/(public)/login/page.tsx` | Manter/ajustar: usar Supabase Auth para login; redirecionar para área BPO após sucesso. |
| `src/app/(public)/auth/callback/route.ts` | Manter/ajustar: trocar code por sessão e redirecionar para área BPO. |
| `src/types/domain.ts` (ou `auth.ts`) | Criar/ajustar: tipo `CurrentUser`, tipo `PapelBpo`. |

---

## 9. Checklist de aceite (Story 8.1)

- [x] Supabase Auth configurado (e-mail/senha ou magic link); login e logout funcionando.
- [x] Tabelas `bpos` e `usuarios` criadas com RLS; enum `papel_bpo`; constraint para `cliente_final` ter `cliente_id`.
- [x] Funções `get_my_bpo_id()`, `get_my_role()`, `get_my_cliente_id()` criadas e usáveis em políticas RLS.
- [x] Cada usuário autenticado associado a um `bpo_id` e um `role` via tabela `usuarios`; `getCurrentUser()` retorna esses dados.
- [x] Middleware protege rotas da área BPO; usuário não autenticado é redirecionado para `/login`.
- [x] Layout `(bpo)` exige usuário com perfil; redireciona para `/login` ou página de “sem perfil” quando não houver sessão ou linha em `usuarios`.
- [x] Papel `cliente_final` restrito ao seu `cliente_id` (documentado e implementado em RLS nas tabelas que tiverem `cliente_id`; para 8.1 pode ser só a política template e a lógica em `canAccessCliente`).
- [x] Guards RBAC em `lib/auth/rbac.ts` (ou `lib/rbac.ts`): `canAccessAdmin`, `canManageUsers`, `canAccessCliente`.
- [x] Seed ou instruções para criar primeiro BPO e primeiro usuário admin; login como admin e acesso à área BPO validados.

---

## 10. Referências

- **Épicos:** `_bmad-output/planning-artifacts/epics.md` – Epic 8, Story 8.1.
- **Arquitetura:** `_bmad-output/planning-artifacts/architecture.md` – Authentication & Security, Data Architecture, Naming, `lib/auth/` e `lib/rbac/`.
- **Supabase Auth:** documentação oficial (Auth, RLS, custom claims / Auth Hooks).
- **Next.js middleware + Supabase:** guia Supabase “Auth Helpers” para Next.js App Router.
- **Plano Sprint 1:** `_bmad-output/planning-artifacts/implementation-plan-sprint-1.md`.
