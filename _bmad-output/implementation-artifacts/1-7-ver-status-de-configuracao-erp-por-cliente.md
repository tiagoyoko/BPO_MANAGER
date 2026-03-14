# Story 1.7: Ver status de configuração ERP por cliente

Status: ready-for-dev

## Story

As a **gestor de BPO**,
I want **ver rapidamente se o ERP/integração de cada cliente está configurado**,
so that **eu saiba onde ainda preciso atuar**.

## Acceptance Criteria

1. **Given** a lista de clientes (`/clientes`),
   **When** a página carrega,
   **Then** a coluna "ERP/Integração" exibe um badge para cada cliente com um dos três estados:
   - `"Não configurado"` — sem linha em `integracoes_erp` para o cliente
   - `"F360 – config básica salva"` — linha em `integracoes_erp` com `tipo_erp = 'F360'` existe (com ou sem token)
   - `"F360 – integração ativa"` — linha com `tipo_erp = 'F360'` E `ativo = true` (EP4 ativa este estado)

2. **Given** o badge de ERP na lista,
   **When** o gestor passa o cursor sobre o badge (tooltip/hover),
   **Then** são exibidos: tipo do ERP (ex.: "F360") e a data da última alteração de token (`token_configurado_em`), ou "Token não configurado" se nulo.

3. **Given** o badge de ERP na lista,
   **When** o gestor clica no badge,
   **Then** navega para `/clientes/[clienteId]/config`.

4. **Given** o componente de filtros da lista,
   **When** o gestor seleciona um filtro de status ERP ("Todos", "Não configurado", "Config básica salva", "Integração ativa"),
   **Then** a lista exibe somente clientes com o status ERP correspondente.

5. **And** a coluna ERP não expõe nenhum dado sensível (token ou ciphertext) — somente o status e a data de alteração.

6. **And** a query de listagem não introduz regressão de performance perceptível para o MVP (≤ dezenas de clientes por BPO).

## Tasks / Subtasks

- [ ] **Task 1** – Migration: corrigir default de `ativo` em `integracoes_erp`
  - [ ] Criar `bpo360-app/supabase/migrations/20260314020000_fix_integracoes_erp_ativo_default.sql`
  - [ ] `ALTER TABLE public.integracoes_erp ALTER COLUMN ativo SET DEFAULT false;`
  - [ ] `UPDATE public.integracoes_erp SET ativo = false;` — resetar registros existentes (apenas dev; sem dados de produção neste ponto)
  - [ ] Comentário na migration: "Integração só é marcada ativa=true pela story 4.1 (EP4) após teste bem-sucedido de conexão F360"
  - [ ] **Motivo**: a migration 1.5 criou `DEFAULT true`, mas "integração ativa" deve ser controlada pelo EP4 após teste real de conexão. Sem esta correção, todo cliente com ERP selecionado apareceria como "integração ativa" incorretamente.

- [ ] **Task 2 (AC: 1,5,6)** – Estender `GET /api/clientes` para incluir status ERP por cliente
  - [ ] Abrir `bpo360-app/src/app/api/clientes/route.ts` (criado na story 1.4)
  - [ ] Alterar `.select('*', { count: 'exact' })` para incluir join com `integracoes_erp`:
    ```typescript
    .select('*, integracoes_erp(id, tipo_erp, ativo, token_configurado_em)', { count: 'exact' })
    ```
  - [ ] O join retorna array (pode ser `[]` ou `[{...}]` por cliente no MVP com apenas F360)
  - [ ] Criar função `computarErpStatus(integracoes: IntegracaoErpRow[]): ErpStatusCliente` que:
    - Array vazio → `"nao_configurado"`
    - Algum item com `ativo = true` → `"integracao_ativa"`
    - Caso contrário → `"config_basica_salva"`
  - [ ] Criar função `computarErpDetalhes(integracoes: IntegracaoErpRow[]): ErpDetalhesCliente | null`:
    - Retorna `{ tipoErp: string; ultimaAlteracao: string | null }` do item principal (primeiro com `ativo=true` ou primeiro do array)
    - **Nunca incluir** `token_f360_encrypted` no retorno
  - [ ] Atualizar `rowToCliente` (ou criar `rowToClienteComErp`) para mapear os novos campos:
    - `erpStatus: ErpStatusCliente`
    - `erpDetalhes: ErpDetalhesCliente | null`
  - [ ] Adicionar query param opcional `erpStatus` (AC: 4): se fornecido, filtrar por status computado
    - `"nao_configurado"`: `integracoes_erp.count() = 0` — usar `not.in` ou subquery
    - `"config_basica_salva"`: `integracoes_erp.ativo = false`
    - `"integracao_ativa"`: `integracoes_erp.ativo = true`
    - Nota: filtro por ERP requer inner join em vez de left join no Supabase — consultar padrão abaixo
  - [ ] Atualizar testes em `route.test.ts`:
    - GET sem filtro ERP → cada cliente retorna `erpStatus` correto (incluindo `"nao_configurado"` para clientes sem ERP)
    - GET com `erpStatus=nao_configurado` → somente clientes sem ERP
    - GET com `erpStatus=config_basica_salva` → somente clientes com ERP mas não ativo
    - GET com `erpStatus=integracao_ativa` → somente clientes com `ativo=true`
    - Garantir que `token_f360_encrypted` **nunca** aparece no payload de resposta (assertion explícita)

- [ ] **Task 3 (AC: 1,2,3,5)** – Atualizar tipos de domínio
  - [ ] Adicionar em `bpo360-app/src/lib/domain/clientes/types.ts`:
    ```typescript
    export type ErpStatusCliente =
      | "nao_configurado"
      | "config_basica_salva"
      | "integracao_ativa";

    export type ErpDetalhesCliente = {
      tipoErp: string;
      ultimaAlteracao: string | null; // ISO 8601 ou null
    };
    ```
  - [ ] Adicionar campos opcionais a `Cliente`:
    ```typescript
    erpStatus?: ErpStatusCliente;
    erpDetalhes?: ErpDetalhesCliente | null;
    ```
    (Campos opcionais para não quebrar código que usa `Cliente` sem ERP — stories anteriores continuam funcionando)

- [ ] **Task 4 (AC: 1,2,3)** – Atualizar `clientes-list.tsx` com coluna ERP
  - [ ] Abrir `bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx` (da story 1.4)
  - [ ] Adicionar coluna "ERP/Integração" entre "responsável interno" e os botões de ação
  - [ ] Badge com cores semânticas:
    - `"nao_configurado"` → badge cinza, texto "Não configurado"
    - `"config_basica_salva"` → badge amarelo/âmbar, texto "F360 – config salva"
    - `"integracao_ativa"` → badge verde, texto "F360 – ativo"
    - Sem valor (`erpStatus` undefined) → badge cinza, texto "Não configurado" (fallback)
  - [ ] Tooltip no badge: usar atributo `title` nativo ou wrapper Radix `<Tooltip>` se já estiver no projeto:
    - Linha 1: `tipoErp` (ex.: "ERP: F360")
    - Linha 2: `ultimaAlteracao` formatada (ex.: "Última alteração: 14/03/2026") ou "Token não configurado"
  - [ ] Badge deve ser um `<Link href={/clientes/${clienteId}/config}>` para AC: 3
  - [ ] Nenhuma alteração nas colunas existentes (nome, CNPJ, status, responsável, receita)

- [ ] **Task 5 (AC: 4)** – Adicionar filtro de status ERP ao componente de filtros
  - [ ] Abrir `bpo360-app/src/app/(bpo)/clientes/_components/clientes-filtros.tsx` (da story 1.4)
  - [ ] Adicionar select "Status ERP" com opções: `""` (Todos), `"nao_configurado"`, `"config_basica_salva"`, `"integracao_ativa"`
  - [ ] Labels amigáveis: "Não configurado", "Config básica salva", "Integração ativa"
  - [ ] Incluir no objeto `filtros` do state: `erpStatus: ErpStatusCliente | ""`
  - [ ] Atualizar `clientes-page-client.tsx` para passar `erpStatus` como query param ao chamar `GET /api/clientes`
  - [ ] "Limpar filtros" já existente deve resetar `erpStatus` para `""`

- [ ] **Task 6** – Testes de componente
  - [ ] `clientes-list.test.tsx` (se existir) ou novos casos em testes existentes:
    - Badge correto para cada status ERP
    - Badge com fallback para undefined `erpStatus`
    - Link do badge aponta para `/clientes/[clienteId]/config`
  - [ ] `clientes-filtros.test.tsx`: select de ERP status aparece; ao selecionar, callback `onFiltrosChange` inclui `erpStatus`
  - [ ] Regressões: todos os testes das stories anteriores continuam passando

## Dev Notes

### Contexto das stories anteriores

**Story 1.4** implementou e está em `review`:
- `GET /api/clientes` com busca, filtros e paginação em `bpo360-app/src/app/api/clientes/route.ts`
- `clientes-filtros.tsx` — componente de filtros (estender com select ERP)
- `clientes-list.tsx` — lista com paginação (adicionar coluna ERP)
- `clientes-page-client.tsx` — gerencia estado de filtros e paginação (atualizar para pass `erpStatus`)

**Story 1.5** cria `integracoes_erp` (ainda `ready-for-dev` — pode não estar implementada quando 1.7 iniciar; desenvolvimento pode ser paralelo).

**Story 1.6** adiciona `token_f360_encrypted` e `token_configurado_em` a `integracoes_erp`.

> ⚠️ **Ordem de implementação**: rodar migration 1.7 (`20260314020000`) somente após migrations 1.5 e 1.6 aplicadas. Se 1.5/1.6 ainda não foram executadas, esta migration pode ser executada em conjunto.

### Correção do `ativo` default

```sql
-- 20260314020000_fix_integracoes_erp_ativo_default.sql
-- Corrige o default de ativo para false.
-- Contexto: migration 20260314000000 (story 1.5) criou DEFAULT true incorretamente.
-- A integração só é ativada pelo EP4 (story 4.1) após teste real de conexão F360.
ALTER TABLE public.integracoes_erp ALTER COLUMN ativo SET DEFAULT false;
-- Resetar dados de dev (nenhum dado de produção existe neste ponto)
UPDATE public.integracoes_erp SET ativo = false WHERE ativo = true;
```

### Padrão de join no Supabase para erpStatus

```typescript
// src/app/api/clientes/route.ts — atualização do SELECT
// Join left: clientes sem ERP retornam integracoes_erp: []
let query = supabase
  .from("clientes")
  .select("*, integracoes_erp(id, tipo_erp, ativo, token_configurado_em)", { count: "exact" })
  .eq("bpo_id", user.bpoId)
  .range(offset, offset + limit - 1);

// NOTA: integracoes_erp retorna um array por cliente.
// No MVP com apenas F360, será [] ou [{...}].
// NÃO selecionar token_f360_encrypted aqui — dados de auditoria apenas.
```

> ⚠️ **Nunca selecionar `token_f360_encrypted` no join do GET /api/clientes.** Usar select explícito como mostrado acima. Qualquer adição futura de campos ao select deve verificar se há dados sensíveis.

### Função de cálculo de status ERP

```typescript
// Pode ficar em src/lib/domain/clientes/types.ts ou src/lib/domain/integracoes-erp/utils.ts
export type ErpDetalhesCliente = {
  tipoErp: string;
  ultimaAlteracao: string | null;
};

export function computarErpStatus(integracoes: Array<{ ativo: boolean }>): ErpStatusCliente {
  if (!integracoes || integracoes.length === 0) return "nao_configurado";
  if (integracoes.some((e) => e.ativo)) return "integracao_ativa";
  return "config_basica_salva";
}

export function computarErpDetalhes(
  integracoes: Array<{ tipo_erp: string; ativo: boolean; token_configurado_em: string | null }>
): ErpDetalhesCliente | null {
  if (!integracoes || integracoes.length === 0) return null;
  const principal = integracoes.find((e) => e.ativo) ?? integracoes[0];
  return {
    tipoErp: principal.tipo_erp,
    ultimaAlteracao: principal.token_configurado_em,
  };
}
```

### Filtro por `erpStatus` na query

O Supabase não suporta diretamente filtro em coluna de tabela relacionada via left join. Estratégias:

**Opção A (recomendada)**: subquery via `.not` / `.filter`:
```typescript
if (erpStatus === "nao_configurado") {
  // Clientes SEM linha em integracoes_erp
  // Supabase: .not("integracoes_erp", "is", null) não funciona para left join vazio
  // Usar abordagem de query separada:
  const { data: clientesComErp } = await supabase
    .from("integracoes_erp")
    .select("cliente_id")
    .eq("bpo_id", user.bpoId);
  const idsComErp = (clientesComErp ?? []).map((r) => r.cliente_id);
  if (idsComErp.length > 0) {
    query = query.not("id", "in", `(${idsComErp.join(",")})`);
  }
  // Se nenhum cliente tem ERP, não adicionar filtro (todos aparecem)
}

if (erpStatus === "config_basica_salva") {
  const { data: clientesBasica } = await supabase
    .from("integracoes_erp")
    .select("cliente_id")
    .eq("bpo_id", user.bpoId)
    .eq("ativo", false);
  const ids = (clientesBasica ?? []).map((r) => r.cliente_id);
  if (ids.length === 0) { /* retornar lista vazia */ }
  query = query.in("id", ids);
}

if (erpStatus === "integracao_ativa") {
  const { data: clientesAtivos } = await supabase
    .from("integracoes_erp")
    .select("cliente_id")
    .eq("bpo_id", user.bpoId)
    .eq("ativo", true);
  const ids = (clientesAtivos ?? []).map((r) => r.cliente_id);
  if (ids.length === 0) { /* retornar lista vazia */ }
  query = query.in("id", ids);
}
```

> Esta abordagem adiciona 1 query extra quando o filtro `erpStatus` é usado. Performance aceitável para MVP (dezenas de clientes). Para escala maior, adicionar view materializada ou filtro via stored procedure em EP4.

### Badge ERP no `clientes-list.tsx`

```tsx
// Dentro da linha da tabela (tr), nova célula para ERP:
<td>
  <Link href={`/clientes/${cliente.id}/config`}>
    <span
      className={badgeClass(cliente.erpStatus)}
      title={tooltipText(cliente.erpDetalhes)}
    >
      {labelErpStatus(cliente.erpStatus)}
    </span>
  </Link>
</td>

// Helpers (no mesmo arquivo ou em utils local):
function badgeClass(status?: ErpStatusCliente): string {
  switch (status) {
    case "integracao_ativa":   return "badge-green";
    case "config_basica_salva": return "badge-amber";
    default:                   return "badge-gray"; // nao_configurado ou undefined
  }
}

function labelErpStatus(status?: ErpStatusCliente): string {
  switch (status) {
    case "integracao_ativa":    return "F360 – ativo";
    case "config_basica_salva": return "F360 – config salva";
    default:                    return "Não configurado";
  }
}

function tooltipText(detalhes?: ErpDetalhesCliente | null): string {
  if (!detalhes) return "Nenhum ERP configurado";
  const data = detalhes.ultimaAlteracao
    ? new Date(detalhes.ultimaAlteracao).toLocaleDateString("pt-BR")
    : "Token não configurado";
  return `ERP: ${detalhes.tipoErp}\nÚltima alteração: ${data}`;
}
```

### Campos adicionados ao tipo `Cliente`

```typescript
// Em src/lib/domain/clientes/types.ts — adicionar (opcionais para backwards compat):
export type Cliente = {
  // ... campos existentes da story 1.2 ...
  erpStatus?: ErpStatusCliente;       // computed no route handler
  erpDetalhes?: ErpDetalhesCliente | null; // tipo ERP + data de alteração
};
```

Os campos são opcionais para não quebrar código legado de stories anteriores que usa `Cliente` sem ERP.

### Padrões obrigatórios da Arquitetura

- **API Response**: `{ "data": <payload> | null, "error": ... }` — o campo `clientes` no data já é um array de `Cliente`; apenas adicionar `erpStatus` e `erpDetalhes` a cada item.
- **Segurança crítica**: `token_f360_encrypted` **nunca** no select do join em `GET /api/clientes`.
- **JSON boundary**: camelCase (`erpStatus`, `erpDetalhes`, `tipoErp`, `ultimaAlteracao`) no JSON.
- **Loading**: `isLoadingClientes` já existe da story 1.4 — não criar novo.
- **Feedback de erro**: componentes de `src/components/feedback/`.
- **Testes co-localizados**: `*.test.ts` ao lado da unidade.

### Estrutura de arquivos desta story

```
bpo360-app/
├── supabase/
│   └── migrations/
│       └── 20260314020000_fix_integracoes_erp_ativo_default.sql    # NOVO (corretiva)
└── src/
    ├── lib/
    │   └── domain/
    │       └── clientes/
    │           └── types.ts          # ALTERAR: + ErpStatusCliente, ErpDetalhesCliente, campos em Cliente
    └── app/
        ├── api/
        │   └── clientes/
        │       ├── route.ts          # ALTERAR: + join integracoes_erp + filtro erpStatus
        │       └── route.test.ts     # ALTERAR: + casos de teste ERP status e segurança
        └── (bpo)/
            └── clientes/
                └── _components/
                    ├── clientes-list.tsx          # ALTERAR: + coluna ERP/Integração com badge
                    ├── clientes-filtros.tsx       # ALTERAR: + select de status ERP
                    └── clientes-page-client.tsx   # ALTERAR: + erpStatus nos filtros do state
```

### Limites de escopo desta story (NÃO implementar)

- ❌ Estado "F360 – integração ativa" não será atingido nesta story — a migration corretiva garante `ativo = false`. A UI deve suportar o estado mas ele será utilizado pelo EP4.
- ❌ Filtro por "risco" ou "margem" — outras stories futuras do EP5/EP6.
- ❌ Mini indicadores F360 na lista (saldo, pagar/receber) — EP5.
- ❌ Tooltip Radix/custom avançado — `title` nativo do HTML é suficiente para MVP.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — §Story 1.7 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md — §4.1 Lista de clientes – Carteira (filtros: ERP, F360 ativo)]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Naming Patterns, §Format Patterns, §API & Communication Patterns]
- [Source: _bmad-output/implementation-artifacts/1-4-listar-e-filtrar-clientes.md — arquivos alterados, padrões de query e filtros]
- [Source: _bmad-output/implementation-artifacts/1-5-configurar-erp-principal-f360-por-cliente.md — schema integracoes_erp, default ativo=true a corrigir]
- [Source: _bmad-output/implementation-artifacts/1-6-configurar-parametros-basicos-de-integracao-f360-sem-api.md — campo token_configurado_em usado em tooltip]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
