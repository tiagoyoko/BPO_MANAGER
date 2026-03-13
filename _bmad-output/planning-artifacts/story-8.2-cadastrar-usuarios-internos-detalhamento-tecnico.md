# Story 8.2 – Cadastrar usuários internos (admin, gestor, operador) – Detalhamento técnico

**Épico:** EP8 – Segurança, Usuários e Cofre de Senhas  
**Story ID:** 8.2  
**Referências:** `epics.md`, `architecture.md`, `story-8.1-auth-papeis-rls-detalhamento-tecnico.md`

---

## 1. Objetivo

Permitir que o **admin do BPO** cadastre e edite usuários internos com nome, e-mail, papel (`admin_bpo`, `gestor_bpo`, `operador_bpo`) e, para operador, opcionalmente `cliente_id`. Cada usuário é criado/atualizado no **Supabase Auth** e na tabela **`usuarios`** (perfil); apenas o papel `admin_bpo` pode acessar a área e as APIs de gestão; alterações são **auditadas** (quem alterou e quando).

---

## 2. Pré-requisitos

- **Story 8.1 concluída:** Auth + RLS, tabelas `bpos` e `usuarios`, funções `get_my_*`, `getCurrentUser()`, guards RBAC (`canManageUsers`), middleware e layout `(bpo)` com contexto de usuário.
- **Variável de ambiente:** `SUPABASE_SERVICE_ROLE_KEY` (para criar/atualizar usuários no Auth e inserir/atualizar em `usuarios` pelo backend). **Não** expor no frontend; usar apenas em API routes no servidor.
- **Tabela `clientes`:** ainda não existe no EP1; o campo `cliente_id` em `usuarios` pode ficar opcional e sem dropdown na 8.2, ou ser preenchido quando EP1 estiver pronto (documentar ambas as opções).

---

## 3. Regras de negócio

- **Quem pode gerenciar:** somente usuários com `role = 'admin_bpo'`. Qualquer outra tentativa de acessar `/admin/usuarios` ou as APIs de admin/usuários deve retornar **403**.
- **Escopo:** o admin só cria/edita usuários do **mesmo `bpo_id`** que o seu. Listagem e formulários exibem apenas usuários do tenant atual.
- **Papéis internos (8.2):** `admin_bpo`, `gestor_bpo`, `operador_bpo`. O papel `cliente_final` é tratado na Story 8.3 (usuários de clientes).
- **Operador e `cliente_id`:** opcional; quando a tabela `clientes` existir, pode-se restringir operador a um subconjunto de clientes ou deixar `null` para “todos os clientes do BPO”. Para 8.2, aceitar `cliente_id` como UUID opcional (input manual ou dropdown vazio até existir EP1).
- **Auditoria:** registrar **quem** criou/alterou cada registro em `usuarios` e **quando**. Usar colunas `created_by`, `updated_by` (UUID referenciando `usuarios.id`) e manter `created_at` / `updated_at`.

---

## 4. Modelo de dados e migração

### 4.1. Colunas de auditoria em `usuarios`

Adicionar à tabela `usuarios` (migração nova):

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_audit_usuarios.sql

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.usuarios(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.usuarios(id);

COMMENT ON COLUMN public.usuarios.created_by IS 'Usuário (admin) que criou este perfil';
COMMENT ON COLUMN public.usuarios.updated_by IS 'Usuário (admin) que fez a última alteração';
```

- Em **INSERT:** preencher `created_by` com o `id` do usuário autenticado (admin) que está criando.
- Em **UPDATE:** preencher `updated_by` com o `id` do usuário que está editando.

Não é necessário RLS para `created_by`/`updated_by`; a política existente em `usuarios` (SELECT apenas própria linha) continua; INSERT/UPDATE em `usuarios` serão feitos apenas pelo backend com **service role**, que ignora RLS.

---

## 5. Uso do Service Role no backend

O frontend e o client Supabase com **anon key** não podem inserir/atualizar em `usuarios` (RLS não permite). Por isso:

- Criar um **cliente Supabase com `SUPABASE_SERVICE_ROLE_KEY`** usado **somente** em API routes (server-side).
- Esse client **não** deve ser exposto ao browser; usá-lo apenas em `src/app/api/...` ou em funções chamadas por essas rotas.
- Em toda rota de admin/usuários: primeiro obter o usuário atual com o client **autenticado** (cookies) e verificar `canManageUsers(currentUser)`; se não for admin, retornar 403. Só então usar o client com **service role** para:
  - Criar usuário no Auth (`auth.admin.createUser()` ou `inviteUserByEmail()`).
  - Inserir/atualizar linha em `usuarios`.

Exemplo de helper (não expor ao cliente):

```ts
// src/lib/supabase/server-admin.ts (ou server-service-role.ts)
import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service role env')
  return createClient(url, key, { auth: { persistSession: false } })
}
```

Garantir que **`.env.local`** contenha `SUPABASE_SERVICE_ROLE_KEY` e que esse arquivo não seja commitado.

---

## 6. APIs (Route Handlers)

Todas as rotas abaixo devem:

1. Obter o usuário atual (`getCurrentUser()` com client de sessão).
2. Se `currentUser === null` ou `!canManageUsers(currentUser)`, retornar **403** e corpo `{ data: null, error: { code: 'FORBIDDEN', message: '...' } }`.
3. Usar `currentUser.bpoId` como escopo: só listar/criar/editar usuários com esse `bpo_id`.
4. Usar o client com **service role** para operações em Auth e em `usuarios`.

### 6.1. GET /api/admin/usuarios

- **Objetivo:** listar usuários internos do BPO do admin (papéis admin_bpo, gestor_bpo, operador_bpo; excluir cliente_final se quiser listar “só internos”).
- **Resposta:** `{ data: { users: Usuario[] }, error: null }` com campos em camelCase (ex.: `bpoId`, `clienteId`, `role`, `nome`, `email`, `createdAt`, `updatedAt`).
- **Implementação:** com service role, `SELECT * FROM usuarios WHERE bpo_id = $bpoId AND role IN ('admin_bpo','gestor_bpo','operador_bpo') ORDER BY nome`. Não retornar dados sensíveis além do necessário para a tela (id, nome, email, role, cliente_id, created_at, updated_at).

### 6.2. POST /api/admin/usuarios

- **Body (JSON):** `{ nome: string, email: string, password: string, role: 'admin_bpo' | 'gestor_bpo' | 'operador_bpo', clienteId?: string | null }`.
  - **Alternativa “convite”:** sem `password`, usar `auth.admin.inviteUserByEmail(email, { data: { ... } })` e depois inserir em `usuarios`; o usuário define a senha no primeiro acesso. Para MVP, criar com senha é mais simples.
- **Validações:** e-mail válido e único no Auth; `role` obrigatório; `clienteId` opcional (só para operador; se a tabela `clientes` existir, validar que o cliente pertence ao mesmo `bpo_id`).
- **Fluxo:**
  1. Criar usuário no Supabase Auth com `auth.admin.createUser({ email, password, email_confirm: true })` (ou equivalente). Obter o `user.id` retornado.
  2. Inserir em `usuarios`: `id = user.id`, `bpo_id = currentUser.bpoId`, `role`, `cliente_id = body.clienteId ?? null`, `nome`, `email`, `created_by = currentUser.id`, `updated_by = currentUser.id`.
- **Resposta:** 201 e `{ data: { id, email, role, ... }, error: null }` ou 400/409 com `{ data: null, error: { code, message } }`.

### 6.3. PATCH /api/admin/usuarios/[id]

- **Body (JSON):** `{ nome?: string, email?: string, role?: 'admin_bpo' | 'gestor_bpo' | 'operador_bpo', clienteId?: string | null }`.
- **Validações:** o `id` deve ser de um usuário que pertença ao mesmo `bpo_id` do admin; não permitir alterar o próprio usuário para remover o último `admin_bpo` do BPO (regra opcional para 8.2).
- **Fluxo:**
  1. Se `email` foi alterado, atualizar no Auth com `auth.admin.updateUserById(id, { email })`.
  2. Atualizar em `usuarios`: `nome`, `email`, `role`, `cliente_id`, `updated_at = now()`, `updated_by = currentUser.id`.
- **Resposta:** 200 e `{ data: { ... }, error: null }` ou 403/404 com `{ data: null, error: { code, message } }`.

### 6.4. (Opcional) GET /api/admin/usuarios/[id]

- Retornar um único usuário do BPO para preencher o formulário de edição. Mesmo critério de escopo (`bpo_id`) e `canManageUsers`.

---

## 7. Frontend: página e formulários

### 7.1. Rota e guard

- **Rota:** `src/app/(bpo)/admin/usuarios/page.tsx`.
- No **layout** da página (ou no layout de `(bpo)`), garantir que apenas `admin_bpo` acessa: se `!canManageUsers(currentUser)`, redirecionar para home ou exibir “Acesso negado”.
- A API já retorna 403 para não-admin; o guard no frontend evita mostrar a tela e reduz chamadas desnecessárias.

### 7.2. Listagem

- Tabela ou lista com colunas: Nome, E-mail, Papel, Cliente (se houver), Última atualização (ou Criado em).
- Ações por linha: “Editar”. Opcional: “Desativar” (fora do escopo mínimo da 8.2; pode ser só criar/editar).
- Botão “Novo usuário” que leva ao formulário de criação (modal ou página `/admin/usuarios/novo`).

### 7.3. Formulário de criação

- Campos: **Nome**, **E-mail**, **Senha** (e “Confirmar senha”), **Papel** (select: Admin BPO, Gestor BPO, Operador BPO), **Cliente** (opcional; select ou input; pode ficar vazio até existir tabela `clientes`).
- Ao submeter: POST `/api/admin/usuarios` com body em camelCase. Em sucesso: fechar modal ou redirecionar para a listagem e mostrar feedback (toast). Em erro: exibir `error.message` (ex.: “E-mail já utilizado”).

### 7.4. Formulário de edição

- Mesmos campos, exceto senha (ou “Nova senha” opcional para alterar depois). Carregar dados com GET `/api/admin/usuarios/[id]` (se existir) ou usar os dados já listados.
- Ao submeter: PATCH `/api/admin/usuarios/[id]`. Tratar 403 (usuário de outro BPO) e 404.

### 7.5. Padrões de UI e erro

- Respostas da API no formato `{ data, error }`; exibir mensagens a partir de `error.message` (ou `error.code` mapeado para texto). Não expor detalhes técnicos.
- Loading: usar estado `isSubmittingXxx` durante POST/PATCH. Desabilitar botão de envio enquanto submeter.

---

## 8. Permissões por papel (referência)

Conforme Arquitetura, para uso nas próximas stories e na própria 8.2:

- **admin_bpo:** acesso total ao BPO (gestão de usuários, clientes, config, integrações, cofre, etc.).
- **gestor_bpo:** acesso operacional e de gestão (clientes, tarefas, dashboard, relatórios, rentabilidade); não gerencia usuários internos nem cofre (ou conforme regra de negócio).
- **operador_bpo:** execução do dia a dia (tarefas, hoje, modo foco, timesheet, solicitações); escopo opcional por `cliente_id` (quando preenchido).
- **cliente_final:** apenas dados do seu `cliente_id` (portal do cliente; Story 8.3).

Na 8.2, a única permissão crítica é: **apenas admin_bpo** chama as APIs de admin/usuários e vê a tela `/admin/usuarios`.

---

## 9. Arquivos a criar/alterar (checklist)

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/YYYYMMDDHHMMSS_add_audit_usuarios.sql` | Adicionar `created_by`, `updated_by` em `usuarios`. |
| `.env.example` | Incluir `SUPABASE_SERVICE_ROLE_KEY=` (sem valor). |
| `src/lib/supabase/server-admin.ts` | Criar helper que retorna client com `SUPABASE_SERVICE_ROLE_KEY` (uso só servidor). |
| `src/app/api/admin/usuarios/route.ts` | GET (listar) e POST (criar). |
| `src/app/api/admin/usuarios/[id]/route.ts` | GET (um usuário) e PATCH (atualizar). |
| `src/app/(bpo)/admin/usuarios/page.tsx` | Página de listagem + botão novo + formulários (criar/editar) ou links para páginas de formulário. |
| `src/lib/auth/rbac.ts` | Garantir que `canManageUsers(user)` retorna `user.role === 'admin_bpo'`. |
| `src/types/domain.ts` (ou `auth.ts`) | Tipos para payload da API (CreateUsuarioInput, UpdateUsuarioInput, Usuario). |

---

## 10. Checklist de aceite (Story 8.2)

- [ ] Área `/admin/usuarios` acessível apenas para usuário com papel `admin_bpo`; outros papéis recebem 403 ou redirecionamento.
- [ ] Listagem de usuários internos do BPO (admin_bpo, gestor_bpo, operador_bpo) com colunas nome, e-mail, papel, cliente (se houver), datas.
- [ ] Formulário de criação: nome, e-mail, senha, papel, cliente (opcional); submissão cria usuário no Auth e linha em `usuarios` com `created_by` preenchido.
- [ ] Formulário de edição: alterar nome, e-mail, papel, cliente; submissão atualiza Auth (se e-mail mudou) e `usuarios` com `updated_by` preenchido.
- [ ] Todas as operações restritas ao mesmo `bpo_id` do admin; tentativa de criar/editar usuário de outro BPO retorna 403.
- [ ] Respostas da API no formato `{ data, error }`; erros tratados no frontend (mensagem amigável).
- [ ] Colunas de auditoria (`created_by`, `updated_by`) preenchidas corretamente; alterações rastreáveis.

---

## 11. Referências

- **Épicos:** `_bmad-output/planning-artifacts/epics.md` – Epic 8, Story 8.2.
- **Arquitetura:** `_bmad-output/planning-artifacts/architecture.md` – Authentication & Security, API response format, Naming.
- **Story 8.1:** `_bmad-output/planning-artifacts/story-8.1-auth-papeis-rls-detalhamento-tecnico.md` – modelo `usuarios`, RLS, `getCurrentUser`, RBAC.
- **Supabase Admin API:** documentação oficial (createUser, updateUserById, inviteUserByEmail) com service role.
