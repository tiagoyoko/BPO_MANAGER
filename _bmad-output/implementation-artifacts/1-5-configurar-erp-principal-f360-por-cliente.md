# Story 1.5: Configurar ERP principal (F360) por cliente

Status: ready-for-dev

## Story

As a **gestor de BPO**,
I want **definir qual ERP financeiro é usado por um cliente (F360 no MVP)**,
so that **o sistema saiba de onde buscar dados e quais integrações ativar**.

## Acceptance Criteria

1. **Given** a página de detalhes de um cliente (`/clientes/[clienteId]/config`),
   **When** o gestor acessa a aba "Configurações",
   **Then** é exibido um formulário com campo "ERP financeiro" com opção F360 (única no MVP) e toggle "ERP principal".

2. **Given** o formulário de ERP,
   **When** o gestor seleciona F360 como ERP principal e salva,
   **Then** a configuração é persistida em `integracoes_erp` e a UI exibe a subseção "Integração F360 ativa" com CTA para configurar parâmetros (story 1.6).

3. **Given** uma configuração ERP já salva,
   **When** o gestor abre a aba "Configurações" novamente,
   **Then** o estado atual é carregado (F360 selecionado, indicador de "Configuração básica salva").

4. **Given** um cliente sem ERP configurado,
   **When** a aba "Configurações" é carregada,
   **Then** é exibida mensagem "Nenhum ERP configurado" com CTA para adicionar.

5. **And** apenas `admin_bpo` e `gestor_bpo` podem salvar/alterar; `operador_bpo` pode visualizar; `cliente_final` recebe 403.

6. **And** a estrutura de dados suporta múltiplos ERPs por cliente (para evolução futura), mas no MVP somente F360 é exibido.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1,2,3,4,5,6)** – Migração: criar tabela `integracoes_erp`
  - [ ] Criar `bpo360-app/supabase/migrations/20260314000000_create_integracoes_erp_table.sql`
  - [ ] Tabela com colunas: `id UUID PK`, `bpo_id UUID NOT NULL REFERENCES bpos(id) ON DELETE CASCADE`, `cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE`, `tipo_erp TEXT NOT NULL`, `e_principal BOOLEAN NOT NULL DEFAULT true`, `ativo BOOLEAN NOT NULL DEFAULT true`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
  - [ ] Constraint CHECK: `tipo_erp IN ('F360')` — extensível em migrations futuras (EP4+)
  - [ ] Constraint UNIQUE: `(cliente_id, tipo_erp)` — apenas uma config por ERP por cliente
  - [ ] Índices: `idx_integracoes_erp_cliente_id ON (cliente_id)`, `idx_integracoes_erp_bpo_id ON (bpo_id)`
  - [ ] Trigger `set_updated_at` (reutilizar a função `public.set_updated_at()` já existente da migração da tabela `clientes`)
  - [ ] RLS: habilitar + políticas SELECT/INSERT/UPDATE usando `bpo_id = public.get_my_bpo_id()` e role guard

- [ ] **Task 2 (AC: 5,6)** – Domínio: tipos e repositório de `integracoes_erp`
  - [ ] Criar `bpo360-app/src/lib/domain/integracoes-erp/types.ts` com:
    - `ErpTipo = "F360"` (type literal, não enum — compatível com evolução)
    - `IntegracaoErpRow` (snake_case, linha do banco)
    - `IntegracaoErp` (camelCase, domínio)
    - `NovaIntegracaoErpInput` (payload POST)
    - `AtualizarIntegracaoErpInput` (payload PATCH)
  - [ ] Criar `bpo360-app/src/lib/domain/integracoes-erp/repository.ts` com:
    - `buscarIntegracoesPorCliente(supabase, clienteId, bpoId): Promise<IntegracaoErp[]>`
    - `buscarIntegracaoPrincipal(supabase, clienteId, bpoId): Promise<IntegracaoErp | null>`
    - `rowToIntegracaoErp(row: IntegracaoErpRow): IntegracaoErp` (mapper snake_case → camelCase)
  - [ ] Testes: `repository.test.ts` com casos básicos de mapeamento

- [ ] **Task 3 (AC: 2,3,4,5)** – API: `GET` e `POST /api/clientes/[clienteId]/erp`
  - [ ] Criar `bpo360-app/src/app/api/clientes/[clienteId]/erp/route.ts`
  - [ ] **GET**: retorna lista de `IntegracaoErp` do cliente. Guard: qualquer papel exceto `cliente_final` (403). Valida que `clienteId` pertence ao `bpoId` do user via `buscarClientePorIdEBpo`. Resposta: `{ data: { integracoes: IntegracaoErp[] }, error: null }`.
  - [ ] **POST**: cria ou atualiza config ERP (upsert por `cliente_id + tipo_erp`). Guard: somente `admin_bpo` e `gestor_bpo`. Body: `{ tipoErp: "F360", ePrincipal: true }`. Valida campos obrigatórios. Resposta: `{ data: { integracao: IntegracaoErp }, error: null }` HTTP 201 (criação) ou 200 (atualização).
  - [ ] Usar `buscarClientePorIdEBpo` para validar ownership antes de qualquer escrita
  - [ ] Criar `bpo360-app/src/app/api/clientes/[clienteId]/erp/route.test.ts` com testes para:
    - GET sem auth → 401
    - GET com `cliente_final` → 403
    - GET com cliente de outro BPO → 404
    - GET com cliente sem ERPs → `{ integracoes: [] }`
    - POST sem auth → 401
    - POST com `operador_bpo` → 403
    - POST com body inválido → 400
    - POST cria nova integração → 201
    - POST segunda vez (upsert) → 200

- [ ] **Task 4 (AC: 1,2,3,4)** – Página de detalhes do cliente com tabs
  - [ ] Criar `bpo360-app/src/app/(bpo)/clientes/[clienteId]/page.tsx` (Server Component)
    - Verificar auth com `getCurrentUser()` — redirecionar para `/login` se não autenticado
    - Carregar dados básicos do cliente via `buscarClientePorIdEBpo` (a função já existe no repositório)
    - Renderizar layout com nome do cliente e navegação de abas: `Resumo`, `Configurações`
    - Usar `Link` do Next.js para navegação entre tabs (`/clientes/[clienteId]` e `/clientes/[clienteId]/config`)
    - Placeholder simples para aba "Resumo" (expandida em stories futuras do EP1/EP5)
  - [ ] Criar `bpo360-app/src/app/(bpo)/clientes/[clienteId]/layout.tsx` com o shell de abas reutilizável entre sub-rotas

- [ ] **Task 5 (AC: 1,2,3,4,5)** – Página de configuração + formulário ERP
  - [ ] Criar `bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/page.tsx` (Server Component)
    - Auth + ownership check (`buscarClientePorIdEBpo`)
    - Carregar ERPs via `GET /api/clientes/[clienteId]/erp` ou direto via repositório no servidor
    - Renderizar `<ErpConfigClient integracoes={...} clienteId={...} userRole={...} />`
  - [ ] Criar `bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/_components/erp-config-client.tsx` (Client Component)
    - Props: `integracoes: IntegracaoErp[]`, `clienteId: string`, `userRole: string`
    - Estado: `isLoadingErp` (bool), `integracoes` local (array), `erro` (string | null)
    - Se `operador_bpo`: exibir config em modo somente-leitura (sem botão salvar)
    - Se `admin_bpo` ou `gestor_bpo`: exibir formulário editável
    - Selecionar ERP: radio/select com única opção "F360" no MVP
    - Botão "Salvar configuração ERP" → chama `POST /api/clientes/[clienteId]/erp`
    - Após salvar com sucesso: exibir seção "Integração F360 ativa" com CTA "Configurar token F360 →" apontando para `/clientes/[clienteId]/config` (aguarda story 1.6)
    - Estado vazio: exibir "Nenhum ERP configurado" + botão "Configurar F360"
    - Feedback de erro via `src/components/feedback/` (não criar novo padrão)
    - Convenção: `isLoadingErp` para loading, `isSubmittingErp` para submit

- [ ] **Task 6** – Testes de componente e integração
  - [ ] `erp-config-client.test.tsx`: renderização com/sem ERPs, modo readonly para `operador_bpo`, envio de formulário, exibição de erro
  - [ ] Regressões: garantir que os testes anteriores (stories 1.2, 1.3, 1.4) continuam passando

## Dev Notes

### Contexto das stories anteriores (LEIA ANTES DE CODAR)

**Tabela `clientes`** — criada em `bpo360-app/supabase/migrations/20260313200000_create_clientes_table.sql`
Colunas relevantes: `id UUID PK`, `bpo_id UUID NOT NULL`, `cnpj`, `razao_social`, `nome_fantasia`, `status`.

**Funções RLS já existentes** (criadas em `20260313180000_create_bpos_and_usuarios.sql`):
```sql
public.get_my_bpo_id()   -- retorna o bpo_id do usuário autenticado
public.get_my_role()     -- retorna o papel do usuário autenticado
public.get_my_cliente_id() -- retorna o cliente_id (para cliente_final)
public.set_updated_at()  -- trigger function para updated_at
```

⚠️ **NÃO recriar** `set_updated_at()` na nova migration — usar `CREATE TRIGGER` referenciando a função existente.

**Arquivos existentes (não recriar — reutilizar):**
```
bpo360-app/src/lib/auth/get-current-user.ts          # getCurrentUser() → { id, email, bpoId, role, clienteId, nome }
bpo360-app/src/lib/supabase/server.ts                 # createClient() para route handlers e Server Components
bpo360-app/src/lib/domain/clientes/repository.ts      # buscarClientePorIdEBpo(supabase, clienteId, bpoId)
bpo360-app/src/lib/domain/clientes/types.ts           # Cliente, ClienteRow, StatusCliente
bpo360-app/src/app/api/clientes/[clienteId]/route.ts  # PATCH (editar cliente) — não alterar
bpo360-app/src/components/feedback/                   # toasts, banners de erro — usar, não criar novo
```

**Suite de testes atual:** testes passando das stories 1.2 + 1.3 + 1.4. Não quebrar.

### Schema SQL completo da nova migration

```sql
-- Story 1.5: Configurar ERP principal por cliente
-- Tabela integracoes_erp com isolamento por bpo_id, RLS e suporte a múltiplos ERPs futuros.

CREATE TABLE public.integracoes_erp (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id       UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  cliente_id   UUID        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_erp     TEXT        NOT NULL,
  e_principal  BOOLEAN     NOT NULL DEFAULT true,
  ativo        BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Apenas um registro por tipo de ERP por cliente
  CONSTRAINT integracoes_erp_unique_per_cliente_tipo UNIQUE (cliente_id, tipo_erp),
  -- No MVP somente F360; adicionar novos valores em migrations futuras
  CONSTRAINT integracoes_erp_tipo_valido CHECK (tipo_erp IN ('F360'))
);

-- Índices para queries frequentes
CREATE INDEX idx_integracoes_erp_cliente_id ON public.integracoes_erp(cliente_id);
CREATE INDEX idx_integracoes_erp_bpo_id    ON public.integracoes_erp(bpo_id);

-- Reutilizar a função set_updated_at() existente (não recriar)
CREATE TRIGGER integracoes_erp_set_updated_at
  BEFORE UPDATE ON public.integracoes_erp
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.integracoes_erp ENABLE ROW LEVEL SECURITY;

-- SELECT: usuários do BPO podem ver ERPs de seus clientes; cliente_final não acessa
CREATE POLICY "integracoes_erp_select_same_bpo"
  ON public.integracoes_erp FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() <> 'cliente_final'
  );

-- INSERT: somente admin_bpo e gestor_bpo
CREATE POLICY "integracoes_erp_insert_gestores"
  ON public.integracoes_erp FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
  );

-- UPDATE: somente admin_bpo e gestor_bpo
CREATE POLICY "integracoes_erp_update_gestores"
  ON public.integracoes_erp FOR UPDATE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
  )
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
  );
```

### Tipos de domínio (`integracoes-erp/types.ts`)

```typescript
/** ERP suportados. Adicionar novos valores aqui em stories futuras (EP4 suporte multi-ERP). */
export type ErpTipo = "F360";

export const ERP_TIPOS_VALIDOS: ErpTipo[] = ["F360"];

/** Linha da tabela `integracoes_erp` retornada pelo Supabase (snake_case). */
export type IntegracaoErpRow = {
  id: string;
  bpo_id: string;
  cliente_id: string;
  tipo_erp: string;
  e_principal: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

/** Entidade de domínio (camelCase). */
export type IntegracaoErp = {
  id: string;
  bpoId: string;
  clienteId: string;
  tipoErp: ErpTipo;
  ePrincipal: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Payload para criação de nova integração. */
export type NovaIntegracaoErpInput = {
  tipoErp: ErpTipo;
  ePrincipal?: boolean;
  ativo?: boolean;
};

/** Payload para atualização (todos opcionais, exceto tipoErp que identifica o registro). */
export type AtualizarIntegracaoErpInput = {
  ePrincipal?: boolean;
  ativo?: boolean;
};
```

### Padrão de upsert no route handler POST

```typescript
// src/app/api/clientes/[clienteId]/erp/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json(
    { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado." } },
    { status: 401 }
  );
  if (!["admin_bpo", "gestor_bpo"].includes(user.role)) return NextResponse.json(
    { data: null, error: { code: "FORBIDDEN", message: "Acesso negado." } },
    { status: 403 }
  );

  const { clienteId } = await params;
  const supabase = createClient();

  // Ownership check: garante que o cliente pertence ao BPO do usuário
  const cliente = await buscarClientePorIdEBpo(supabase, clienteId, user.bpoId);
  if (!cliente) return NextResponse.json(
    { data: null, error: { code: "NOT_FOUND", message: "Cliente não encontrado." } },
    { status: 404 }
  );

  const body = await request.json();
  const { tipoErp, ePrincipal = true } = body;

  if (!tipoErp || !ERP_TIPOS_VALIDOS.includes(tipoErp)) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_ERP_TIPO", message: "Tipo de ERP inválido." } },
      { status: 400 }
    );
  }

  // Upsert por (cliente_id, tipo_erp) — conflict target
  const { data, error } = await supabase
    .from("integracoes_erp")
    .upsert(
      { bpo_id: user.bpoId, cliente_id: clienteId, tipo_erp: tipoErp, e_principal: ePrincipal, ativo: true },
      { onConflict: "cliente_id,tipo_erp", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return NextResponse.json(
    { data: null, error: { code: "DB_ERROR", message: error.message } },
    { status: 500 }
  );

  return NextResponse.json(
    { data: { integracao: rowToIntegracaoErp(data) }, error: null },
    { status: 201 }
  );
}
```

### Página de detalhes do cliente com tabs

```tsx
// src/app/(bpo)/clientes/[clienteId]/layout.tsx
import Link from "next/link";

// Layout com shell de tabs compartilhado entre page.tsx e config/page.tsx
export default async function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  return (
    <div>
      {/* Header e navegação de tabs */}
      <nav>
        <Link href={`/clientes/${clienteId}`}>Resumo</Link>
        <Link href={`/clientes/${clienteId}/config`}>Configurações</Link>
      </nav>
      {children}
    </div>
  );
}
```

### RBAC na UI

- `admin_bpo` → leitura + escrita de ERP config
- `gestor_bpo` → leitura + escrita de ERP config
- `operador_bpo` → somente leitura (sem botão Salvar)
- `cliente_final` → 403 na API; não deve ver a aba de configurações

Para verificar o papel no Client Component, receber `userRole` como prop vindo do Server Component (não chamar `getCurrentUser()` direto no Client Component).

### Padrões obrigatórios da Arquitetura

- **API Response:** `{ "data": <payload> | null, "error": null | { "code": "...", "message": "..." } }` com HTTP adequado.
- **JSON boundary:** camelCase no JSON (`tipoErp`, `ePrincipal`, `clienteId`); snake_case apenas no banco.
- **Nomes de arquivo:** componentes `kebab-case.tsx`; funções e variáveis `camelCase`; tipos `PascalCase`.
- **Loading:** `isLoadingErp` (não `loading`, `busy`, `isFetching`); submit: `isSubmittingErp`.
- **Feedback de erro:** componentes de `src/components/feedback/` — não criar novo padrão.
- **Testes co-localizados:** `*.test.ts` / `*.test.tsx` ao lado do módulo.
- **Server Components:** buscar dados no servidor via funções de domínio/repositório + `createClient()`.
- **Client Components:** receber dados como props; gerenciar estado local para mutações.

### Estrutura de arquivos desta story

```
bpo360-app/
├── supabase/
│   └── migrations/
│       └── 20260314000000_create_integracoes_erp_table.sql    # NOVO
├── src/
│   ├── lib/
│   │   └── domain/
│   │       └── integracoes-erp/
│   │           ├── types.ts          # NOVO: ErpTipo, IntegracaoErp, inputs
│   │           ├── repository.ts     # NOVO: buscarIntegracoesPorCliente, rowToIntegracaoErp
│   │           └── repository.test.ts # NOVO: testes de mapeamento
│   └── app/
│       ├── api/
│       │   └── clientes/
│       │       └── [clienteId]/
│       │           └── erp/
│       │               ├── route.ts      # NOVO: GET + POST /api/clientes/[clienteId]/erp
│       │               └── route.test.ts # NOVO: testes de rota
│       └── (bpo)/
│           └── clientes/
│               └── [clienteId]/
│                   ├── layout.tsx        # NOVO: shell com tabs (Resumo, Configurações)
│                   ├── page.tsx          # NOVO: placeholder Visão 360 (expandir em EP5)
│                   └── config/
│                       ├── page.tsx      # NOVO: carrega ERPs e renderiza ErpConfigClient
│                       └── _components/
│                           ├── erp-config-client.tsx      # NOVO: formulário ERP (Client Component)
│                           └── erp-config-client.test.tsx # NOVO: testes de componente
```

### Dependência crítica: `[clienteId]/page.tsx` ainda não existe

A rota `/clientes/[clienteId]/page.tsx` foi planejada na story 1.1 mas não consta na listagem atual de arquivos (`find src/app/(bpo)/clientes`). Esta story deve criá-la como placeholder simples. O conteúdo completo (indicadores, tarefas, timeline) será implementado nas stories do EP5. **Não implementar funcionalidade além do shell + tab de Configurações.**

### Integração com stories futuras

- **Story 1.6** usará a tabela `integracoes_erp` para adicionar coluna `token_hash` (ou tabela separada com dados sensíveis criptografados). Deixar a migration preparada com comentário indicando esse plano.
- **Story 1.7** usará `integracoes_erp.ativo` e `integracoes_erp.tipo_erp` para exibir status na lista de clientes.
- **EP4** adicionará `empresa_erp_mapeada`, `conta_erp_mapeada` e a lógica de auth/sync F360. A constraint CHECK de `tipo_erp` deve ser alterada via migration adicional em EP4 quando novos ERPs forem suportados.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — §Epic 1, Story 1.5 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/epics.md — §Requirements Inventory, RF-02, RF-03]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Data Architecture, §Naming Patterns, §Format Patterns, §API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Complete Project Directory Structure, §Architectural Boundaries]
- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md — §4.2 Detalhe do cliente – Visão 360, §4.2.1 tabs]
- [Source: _bmad-output/implementation-artifacts/1-4-listar-e-filtrar-clientes.md — Dev Notes, padrões estabelecidos]
- [Source: bpo360-app/supabase/migrations/20260313200000_create_clientes_table.sql — DDL e padrão de RLS]
- [Source: bpo360-app/supabase/migrations/20260313180000_create_bpos_and_usuarios.sql — funções get_my_bpo_id, get_my_role, set_updated_at]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
