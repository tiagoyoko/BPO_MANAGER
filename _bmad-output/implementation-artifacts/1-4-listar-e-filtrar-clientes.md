# Story 1.4: Listar e filtrar clientes

Status: done

## Story

As a **gestor de BPO**,
I want **ver uma lista de clientes com busca e filtros**,
so that **posso localizar rapidamente empresas por nome, CNPJ, status ou tags e entrar no painel do cliente**.

## Acceptance Criteria

1. **Given** acesso à lista de clientes,
   **When** a página carrega,
   **Then** é exibida uma lista paginada com colunas: Cliente (nome fantasia + razão social), CNPJ, status, responsável interno, receita estimada.

2. **Given** a barra de busca,
   **When** o gestor digita nome ou CNPJ (parcial ou completo),
   **Then** a lista é filtrada para exibir apenas clientes cujo nome fantasia, razão social ou CNPJ contenham o texto digitado (case-insensitive).

3. **Given** os filtros disponíveis,
   **When** o gestor seleciona um ou mais filtros (status, tags/setor, responsável interno),
   **Then** a lista é filtrada aplicando os critérios selecionados, podendo combinar busca textual com filtros.

4. **Given** a lista filtrada ou não,
   **When** o gestor clica em uma linha/linha de cliente,
   **Then** navega para o painel do cliente em `/clientes/[clienteId]`.

5. **Given** uma lista longa (> 20 clientes),
   **When** a lista é exibida,
   **Then** a paginação está disponível e funcional (próxima página, página anterior, total de resultados).

6. **And** apenas usuários autenticados com papel `admin_bpo`, `gestor_bpo` ou `operador_bpo` podem acessar; `cliente_final` recebe 403.

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,2,3,5,6)** – Atualizar GET `/api/clientes` para suportar busca, filtros e paginação
  - [x] Abrir `bpo360-app/src/app/api/clientes/route.ts` e expandir o handler `GET` existente.
  - [x] Ler query params: `search` (string), `status` (string, um dos valores de `StatusCliente`), `tags` (string, valor único ou array separado por vírgula), `responsavelInternoId` (UUID), `page` (int, default 1), `limit` (int, default 20, máx 100).
  - [x] Guard de autenticação: `getCurrentUser()` — retornar 401 se sem sessão; retornar 403 se papel for `cliente_final`.
  - [x] Filtro obrigatório: `bpo_id = user.bpoId` em todas as queries (isolamento multi-tenant).
  - [x] Aplicar filtro `search` como `ilike` em `nome_fantasia`, `razao_social` e `cnpj` (OR entre os três campos).
  - [x] Aplicar filtro `status` como `eq('status', status)` se fornecido.
  - [x] Aplicar filtro `tags` usando `contains` (JSONB) se fornecido — ex.: `clientes.tags @> '["tag1"]'`.
  - [x] Aplicar filtro `responsavelInternoId` como `eq('responsavel_interno_id', responsavelInternoId)` se fornecido.
  - [x] Paginação: usar `.range(offset, offset + limit - 1)` do Supabase; calcular `offset = (page - 1) * limit`.
  - [x] Usar `.select('*', { count: 'exact' })` para obter total de registros (`count`).
  - [x] Resposta sucesso: `{ data: { clientes: Cliente[], total: number, page: number, limit: number }, error: null }` HTTP 200.
  - [x] Atualizar `bpo360-app/src/app/api/clientes/route.test.ts` com casos de teste para busca, filtros e paginação.

- [x] **Task 2 (AC: 1,2,3,4,5)** – Componente de busca e filtros no frontend
  - [x] Criar `bpo360-app/src/app/(bpo)/clientes/_components/clientes-filtros.tsx` (Client Component).
  - [x] Inputs: campo de busca textual (placeholder "Buscar por nome ou CNPJ"), select de status (opções: todas + `Ativo`, `Em implantação`, `Pausado`, `Encerrado`), select de responsável interno (lista de usuários do BPO — pode usar estado carregado no page), select de tags (se houver tags cadastradas).
  - [x] Estado gerenciado localmente com `useState`; ao mudar qualquer filtro, chamar callback `onFiltrosChange(filtros)` recebido via props.
  - [x] Incluir botão "Limpar filtros" visível quando há filtros ativos.
  - [x] Debounce de 300ms no campo de busca textual para evitar excesso de requisições.
  - [x] Convenção de nomes de estado: `isLoadingClientes` para loading da lista.

- [x] **Task 3 (AC: 1,2,3,4,5)** – Atualizar `clientes-page-client.tsx` para busca server-side + paginação
  - [x] Atualizar `bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.tsx`:
    - Adicionar estado: `filtros` (objeto com search, status, tags, responsavelInternoId), `page` (int, default 1), `total` (int), `isLoadingClientes` (bool).
    - Ao montar e sempre que `filtros` ou `page` mudar, chamar `GET /api/clientes` com os query params correspondentes.
    - Passar `clientes`, `isLoadingClientes`, `total`, `page`, `limit` para `clientes-list.tsx`.
    - Renderizar `<ClientesFiltros onFiltrosChange={...} />` acima da lista.
    - Ao mudar filtros, resetar `page` para 1.
    - Manter `clienteEditando` e lógica de edição da story 1.3 sem alterações.

- [x] **Task 4 (AC: 1,4,5)** – Atualizar `clientes-list.tsx` para paginação e navegação
  - [x] Atualizar `bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx`:
    - Aceitar novas props: `total: number`, `page: number`, `limit: number`, `onPageChange: (page: number) => void`.
    - Adicionar controles de paginação (exibir total de resultados, botões "Anterior" / "Próximo", indicador "Página X de Y").
    - Garantir que cada linha é clicável (link para `/clientes/[clienteId]`) além do botão Editar existente — `Link` do Next.js envolvendo a linha ou célula de nome.
    - Estado vazio: mensagem "Nenhum cliente encontrado" quando lista for vazia com filtros ativos; "Nenhum cliente cadastrado" quando não há clientes no BPO.

- [x] **Task 5** – Testes
  - [x] `GET /api/clientes` com `search`: retorna somente clientes com nome/CNPJ correspondente.
  - [x] `GET /api/clientes` com `status=Pausado`: retorna somente clientes pausados.
  - [x] `GET /api/clientes` com `page=2&limit=5`: retorna segunda página corretamente.
  - [x] `GET /api/clientes` com usuário `cliente_final`: retorna 403.
  - [x] `GET /api/clientes` sem auth: retorna 401.
  - [x] Componente `clientes-filtros.tsx`: debounce do campo busca; limpar filtros; callback `onFiltrosChange`.
  - [x] Regressões: suite completa de 57 testes da story 1.3 continua passando.

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Ajustar `clientes-list.tsx` para cumprir AC1 com as colunas exigidas: Cliente (nome fantasia + razão social), CNPJ, status, responsável interno e receita estimada. Remover dependência de `email` como coluna principal da lista. [bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx:55]
- [x] [AI-Review][HIGH] Expor filtro funcional de tags/setor na tela principal carregando `tagsDisponiveis` reais em `clientes-page-client.tsx`/`page.tsx`; hoje o componente suporta tags, mas a página passa `[]` e o filtro nunca aparece. [bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.tsx:130]
- [x] [AI-Review][HIGH] Tornar a linha inteira do cliente navegável para `/clientes/[clienteId]` ou implementar comportamento equivalente que satisfaça AC4; atualmente só duas células têm `Link`. [bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx:65]
- [x] [AI-Review][MEDIUM] Adicionar testes de interface cobrindo colunas obrigatórias da lista, presença/uso do filtro de tags e navegação ao clicar na linha para evitar regressão dos ACs 1, 3 e 4. [bpo360-app/src/app/(bpo)/clientes/_components/clientes-filtros.test.tsx:1]

## Dev Notes

### Fundação das stories anteriores (LEIA ANTES DE CODAR)

**Tabela `clientes`** — já existe via migração da story 1.2:
```
bpo360-app/supabase/migrations/20260313200000_create_clientes_table.sql
```
Colunas: `id UUID PK`, `bpo_id UUID NOT NULL`, `cnpj TEXT`, `razao_social TEXT`, `nome_fantasia TEXT`, `email TEXT`, `telefone TEXT NULL`, `responsavel_interno_id UUID NULL`, `receita_estimada NUMERIC NULL`, `status TEXT DEFAULT 'Ativo'`, `tags JSONB NULL`, `created_at`, `updated_at`.
Índice único composto `(bpo_id, cnpj)`. RLS ativo via `get_my_bpo_id()`.

**Arquivos existentes (não recriar — estender):**
```
bpo360-app/src/lib/domain/clientes/types.ts               # Cliente, StatusCliente, NovoClienteInput, AtualizarClienteInput
bpo360-app/src/lib/domain/clientes/cnpj.ts                # normalizarCnpj, validarFormatoCnpj
bpo360-app/src/lib/domain/clientes/repository.ts          # buscarClientePorIdEBpo
bpo360-app/src/app/api/clientes/route.ts                  # GET (lista simples) + POST (criar) ← ESTENDER o GET
bpo360-app/src/app/api/clientes/[clienteId]/route.ts      # PATCH (editar)
bpo360-app/src/app/(bpo)/clientes/page.tsx                # Server Component (suspenso, renderiza clientes-page-client)
bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.tsx  ← ALTERAR
bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx         ← ALTERAR
bpo360-app/src/app/(bpo)/clientes/_components/novo-cliente-form.tsx     # não alterar
bpo360-app/src/app/(bpo)/clientes/_components/confirmar-encerramento-dialog.tsx  # não alterar
```

**Suite de testes atual:** 57 testes passando (stories 1.2 + 1.3). Manter.

### Padrão de query com filtros no Supabase

```typescript
// src/app/api/clientes/route.ts — expansão do GET
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado" } }, { status: 401 });
  if (user.role === "cliente_final") {
    return NextResponse.json({ data: null, error: { code: "FORBIDDEN", message: "Acesso negado" } }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const tags = searchParams.get("tags") ?? "";
  const responsavelInternoId = searchParams.get("responsavelInternoId") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = createClient();
  let query = supabase
    .from("clientes")
    .select("*", { count: "exact" })
    .eq("bpo_id", user.bpoId)
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`nome_fantasia.ilike.%${search}%,razao_social.ilike.%${search}%,cnpj.ilike.%${search}%`);
  }
  if (status) query = query.eq("status", status);
  if (responsavelInternoId) query = query.eq("responsavel_interno_id", responsavelInternoId);
  if (tags) query = query.contains("tags", [tags]); // JSONB contains

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ data: null, error: { code: "DB_ERROR", message: error.message } }, { status: 500 });

  return NextResponse.json({
    data: { clientes: (data ?? []).map(rowToCliente), total: count ?? 0, page, limit },
    error: null,
  });
}
```

> ⚠️ Usar `rowToCliente` já existente no arquivo para converter snake_case → camelCase. Não duplicar.

### Filtro textual: `ilike` vs `fts`

Para MVP, usar `.ilike` é suficiente e não requer configuração extra de índice FTS. A consulta faz OR entre `nome_fantasia`, `razao_social` e `cnpj`. Performance aceitável para dezenas a poucos milhares de clientes por BPO.

Se o projeto tiver muitos registros no futuro, adicionar índice trigram (`pg_trgm`) em migração separada — fora do escopo desta story.

### Debounce no campo de busca

```typescript
// Em clientes-filtros.tsx
import { useState, useEffect } from "react";

const [searchInput, setSearchInput] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
  return () => clearTimeout(timer);
}, [searchInput]);

useEffect(() => {
  onFiltrosChange({ ...filtros, search: debouncedSearch });
}, [debouncedSearch]);
```

### Paginação: Supabase `.range()`

- `.range(0, 19)` retorna registros 0–19 (primeira página de 20).
- `.range(20, 39)` retorna registros 20–39 (segunda página).
- `{ count: 'exact' }` no `.select()` retorna o campo `count` com total de registros (considerando filtros).

### Navegação para painel do cliente

A arquitetura prevê `/clientes/[clienteId]`. A rota `app/(bpo)/clientes/[clienteId]/page.tsx` já existe (criada na story 1.1). Cada linha da lista deve ser um link navegável:

```tsx
// Em clientes-list.tsx — linha clicável
import Link from "next/link";

// Envolver linha ou célula de nome com Link
<Link href={`/clientes/${cliente.id}`} className="...">
  {cliente.nomeFantasia}
</Link>
```

Preservar o botão "Editar" por linha (da story 1.3) sem alterações.

### Padrões de autenticação e RBAC

- `getCurrentUser()` em `src/lib/auth/get-current-user.ts` → `{ id, email, bpoId, role, clienteId, nome }`.
- `useUser()` de `src/lib/auth/user-context.tsx` em Client Components.
- Papéis que podem acessar lista: `admin_bpo`, `gestor_bpo`, `operador_bpo`. Bloquear apenas `cliente_final` (403).

### Padrões obrigatórios da Arquitetura

- **API Response:** `{ "data": <payload> | null, "error": null | { "code": "...", "message": "..." } }` com HTTP adequado.
- **JSON boundary:** camelCase no JSON (ex.: `nomeFantasia`, `razaoSocial`, `responsavelInternoId`); snake_case somente no banco.
- **Nomes de arquivo:** componentes `kebab-case.tsx`; funções e variáveis `camelCase`.
- **Loading:** convenção `isLoadingClientes` (não `loading`, `busy`, `isFetching`).
- **Feedback de erro:** componentes de `src/components/feedback/` — não criar novo padrão.
- **Testes co-localizados:** `*.test.ts` / `*.test.tsx` ao lado do módulo.

### Estrutura de arquivos desta story

```
src/
  app/
    api/
      clientes/
        route.ts                          # ALTERADO: GET com search, filtros e paginação
        route.test.ts                     # ALTERADO: novos casos de teste
    (bpo)/
      clientes/
        _components/
          clientes-filtros.tsx            # NOVO: barra de busca + filtros
          clientes-filtros.test.tsx       # NOVO: testes de componente
          clientes-list.tsx               # ALTERADO: paginação + linha clicável
          clientes-page-client.tsx        # ALTERADO: estado de filtros + paginação
```

### Project Structure Notes

- **Não criar** nova pasta de rotas — a lista de clientes já vive em `app/(bpo)/clientes/page.tsx`.
- A coluna "indicadores resumidos" mencionada no épico está marcada como `(opcional)` e **não faz parte desta story** — não implementar.
- `tags` na tabela é `JSONB` (array de strings). O filtro por tag usa `contains` — garantir que o valor enviado como query param seja convertido corretamente antes da query Supabase.
- Verificar se `responsavel_interno_id` já tem join/lookup de nome na query GET existente; se não, incluir `.select('*, usuarios(id, nome)')` para exibir o nome do responsável na lista (ajustar `rowToCliente` se necessário).

### References

- [Source: _bmad-output/planning-artifacts/bpo360-ep1-client-and-erp-stories.md — US 1.3, critérios de aceite]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Response Formats, Naming Patterns, Frontend Architecture, Data Boundaries]
- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md — §4.1 Lista de clientes – Carteira]
- [Source: _bmad-output/implementation-artifacts/1-3-editar-dados-e-status-de-cliente.md — File List, Dev Notes, padrões estabelecidos]
- [Source: bpo360-app/supabase/migrations/20260313200000_create_clientes_table.sql — DDL real da tabela clientes]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: GET /api/clientes expandido com NextRequest, query params (search, status, tags, responsavelInternoId, page, limit), filtros ilike/or, eq status, contains tags, range paginação, resposta { data: { clientes, total, page, limit } }. Testes route.test.ts atualizados para GET(request) e 5 novos casos (search, status=Pausado, page/limit, 401, 403).
- Task 2: ClientesFiltros criado com busca (debounce 300ms), select status, responsável, tags, botão Limpar filtros, onFiltrosChange.
- Task 3: ClientesPageClient refatorado para estado filtros/page/total/isLoadingClientes, fetch GET /api/clientes ao montar e ao mudar filtros/page; page.tsx passa user e responsaveis (lista de usuários BPO).
- Task 4: ClientesList com props total, page, limit, onPageChange, isLoadingClientes, filtrosAtivos; controles de paginação; Link em razão social e nome fantasia para /clientes/[id]; mensagens de estado vazio diferenciadas.
- Task 5: clientes-filtros.test.tsx com 4 testes (onFiltrosChange inicial, debounce, limpar filtros, callback ao mudar status). Suite total 66 testes passando.
- Code review fixes: lista ajustada para exibir Cliente/Status/Responsável interno/Receita estimada; linha inteira navegável para `/clientes/[clienteId]`; `page.tsx` passou a carregar `tagsDisponiveis` reais do BPO; testes adicionados para colunas, clique na linha e filtro de tags. Suite total 88 testes passando.

### File List

- bpo360-app/src/app/api/clientes/route.ts (alterado)
- bpo360-app/src/app/api/clientes/route.test.ts (alterado)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-filtros.tsx (novo)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-filtros.test.tsx (novo)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx (alterado)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.test.tsx (novo)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.tsx (alterado)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.test.tsx (novo)
- bpo360-app/src/app/(bpo)/clientes/page.tsx (alterado)

## Change Log

- 2026-03-14: Story 1.4 implementada — GET /api/clientes com busca, filtros e paginação; ClientesFiltros; clientes-page-client com fetch e paginação; clientes-list com links e paginação; testes unitários e de componente; 66 testes passando.
- 2026-03-14: Code review fixes aplicados — colunas obrigatórias da lista, filtro de tags funcional carregado do BPO, navegação pela linha inteira e novos testes de regressão; 88 testes passando.
