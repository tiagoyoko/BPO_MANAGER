# Story 1.8: Painel das empresas – resumo em números

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor de BPO**,
I want **ver na Home um painel com resumo em números da carteira (total de clientes, contagens por status, resumo de integrações)**,
so that **eu acompanhe a saúde da carteira rapidamente sem precisar abrir a lista completa de clientes**.

## Acceptance Criteria

1. **Given** um gestor (ou admin) autenticado,
   **When** acessa a rota raiz do app BPO (`/` ou `/app` conforme layout),
   **Then** a página exibe um painel (dashboard) com cards de resumo contendo:
   - Total de clientes da carteira do BPO.
   - Quantidade de clientes por status operacional (Ativo, Em implantação, Pausado, Encerrado) — ao menos total ativos e totais por status que fizerem sentido para decisão rápida.
   - Resumo de integrações: quantidade de clientes "Não configurado", "F360 – config básica salva", "F360 – integração ativa" (reutilizando a mesma lógica de status ERP da story 1.7).

2. **Given** o painel na Home,
   **When** o gestor visualiza os cards,
   **Then** cada card exibe número e label claro (ex.: "Total de clientes", "Clientes ativos", "F360 – integração ativa"); valores numéricos atualizados conforme dados do BPO (RLS).

3. **Given** o painel na Home,
   **When** o gestor clica em atalho "Carteira de clientes",
   **Then** navega para `/clientes`.
   **And** quando clica em atalho "Integrações", navega para `/integacoes` (rota existente na arquitetura; se a página ainda for stub, o link deve apontar para a rota e exibir a página atual).

4. **Given** a rota Home com dados da carteira,
   **When** a página carrega,
   **Then** o tempo de resposta percebido (até exibir os cards com dados) é ≤ 3s para carteiras de 10–50 clientes (NFR1 – performance). Isso exige um endpoint de resumo agregado (contagens) em vez de carregar a lista completa de clientes.

5. **Given** carregamento ou erro,
   **When** os dados estão sendo buscados,
   **Then** a UI exibe estado de loading (ex.: skeletons ou spinner) com convenção `isLoadingResumo` (ou equivalente).
   **And** em caso de erro da API, a UI exibe mensagem amigável (banner ou toast) derivada de `error.code`, sem expor detalhes técnicos (padrão da arquitetura).

6. **And** a Home continua exibindo conteúdo diferenciado por papel quando aplicável (ex.: gestor/admin veem painel de resumo; operador pode ver bloco "Tarefas de hoje" em story futura — nesta story o foco é o painel de resumo para gestor). Cliente final já é redirecionado para `/portal` (comportamento atual mantido).

7. **And** acessibilidade: cards e atalhos com rótulos e estrutura semântica adequados (WCAG 2.1 AA nas telas principais); suporte a leitores de tela para os números e links.

## Tasks / Subtasks

- [x] **Task 1 (AC: 4)** – API de resumo para o dashboard
  - [x] Criar `GET /api/dashboard/resumo` (ou `GET /api/home/resumo`) que retorne apenas agregados:
    - `totalClientes: number`
    - `clientesPorStatus: { ativo: number, emImplantacao: number, pausado: number, encerrado: number }` (ou equivalente em camelCase)
    - `clientesPorErpStatus: { naoConfigurado: number, configBasicaSalva: number, integracaoAtiva: number }`
  - [x] Implementar com queries agregadas (COUNT, GROUP BY) no Supabase, filtradas por `bpo_id` do usuário autenticado (RLS). Não buscar lista de clientes; apenas contagens.
  - [x] Resposta no formato `{ data: ResumoDashboard, error: null }` e em erro `{ data: null, error: { code, message } }`.
  - [x] Testes unitários para o route (sucesso, falha de auth, contagens corretas).

- [x] **Task 2 (AC: 1, 2, 5, 7)** – Página Home com painel de resumo
  - [x] Alterar `bpo360-app/src/app/(bpo)/page.tsx`: remover stub "Dashboard gestor (em construção)" e implementar:
    - Fetch de `GET /api/dashboard/resumo` (ou equivalente).
    - Renderização de cards com os números (Total de clientes, Client ativos, por status ERP).
    - Estado `isLoadingResumo` e UI de loading (skeleton ou spinner).
    - Tratamento de erro com componente de feedback padronizado (banner/toast).
    - Atalhos: links/botões "Carteira de clientes" → `/clientes`, "Integrações" → `/integacoes`.
  - [x] Manter redirecionamento de `cliente_final` para `/portal` no layout ou página.
  - [x] Labels e estrutura semântica (headings, landmarks) para acessibilidade.

- [x] **Task 3 (AC: 6)** – Garantir que apenas gestor/admin veem o painel de resumo
  - [x] Se operador puder acessar a mesma rota, exibir o mesmo painel de resumo (visão da carteira é útil) ou apenas atalhos; não bloquear operador na Home. Documentar decisão na story.

- [x] **Task 4** – Testes e regressão
  - [x] Teste de componente ou página: cards exibem valores do mock ou da API; atalhos navegam corretamente.
  - [x] Verificar que listagem de clientes (1.4) e coluna ERP (1.7) não sofrem regressão.

## Dev Notes

### Contexto das stories anteriores

- **Story 1.4**: `GET /api/clientes` com filtros e paginação; componentes em `(bpo)/clientes/_components/`.
- **Story 1.7**: Status ERP por cliente (`erpStatus`, `erpDetalhes`) já computados em `GET /api/clientes`; funções `computarErpStatus` e contagens podem ser reutilizadas ou espelhadas em query agregada para o resumo.
- **Story 1.8** não deve chamar `GET /api/clientes` com limit alto só para contar — isso quebraria NFR de 3s. Criar endpoint dedicado com COUNT/GROUP BY.

### Padrões obrigatórios da arquitetura

- **API**: Route handler Next.js; resposta `{ data, error }`; JSON camelCase; HTTP status adequados; datas ISO 8601.
- **Segurança**: RLS e `bpo_id` do usuário em todas as queries do resumo.
- **Frontend**: Server Components + fetch no servidor preferencial; loading `isLoadingXxx`; feedback de erro via `error.code`.
- **Estrutura**: Feature em `app/(bpo)/`; API em `app/api/dashboard/` ou `app/api/home/`; testes co-localizados.

### Sugestão de contrato do endpoint de resumo

```typescript
// GET /api/dashboard/resumo
// Response 200: { data: ResumoDashboard, error: null }
type ResumoDashboard = {
  totalClientes: number;
  clientesPorStatus: {
    ativo: number;
    emImplantacao: number;
    pausado: number;
    encerrado: number;
  };
  clientesPorErpStatus: {
    naoConfigurado: number;
    configBasicaSalva: number;
    integracaoAtiva: number;
  };
};
```

Queries Supabase: uma por agregação ou uma query com subqueries/raw se necessário. Tabelas: `clientes` (status), `integracoes_erp` (ativo, tipo_erp) com join por cliente e filtro por bpo_id.

### Escopo explícito fora desta story

- **Não implementar**: "Clientes em risco" (tarefas atrasadas, margem) — EP5/EP6; mini indicadores F360 na lista (EP5); painel "Hoje" do operador (story futura); Relatórios como página completa.
- **Atalho Relatórios**: pode ser link inativo ou apontar para `/timesheet/relatorios` se existir; não obrigatório nesta story.

### Estrutura de arquivos esperada

```
bpo360-app/src/
├── app/
│   ├── api/
│   │   └── dashboard/
│   │       ├── resumo/
│   │       │   ├── route.ts       # GET agregados
│   │       │   └── route.test.ts
│   └── (bpo)/
│       └── page.tsx               # Home com cards + atalhos
└── lib/
    └── domain/
        └── dashboard/            # opcional: tipos ResumoDashboard
            └── types.ts
```

### References

- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md — §3 Dashboard/Home para gestor]
- [Source: _bmad-output/planning-artifacts/prd/8-requisitos-no-funcionais.md — NFR1 dashboard ≤3s]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Princípios e estados visuais]
- [Source: _bmad-output/planning-artifacts/architecture.md — API patterns, Frontend, Structure]
- [Source: _bmad-output/implementation-artifacts/1-7-ver-status-de-configuracao-erp-por-cliente.md — erpStatus e integracoes_erp]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- `npm test -- src/app/api/dashboard/resumo/route.test.ts 'src/app/(bpo)/_components/bpo-home-dashboard-client.test.tsx'`
- `npm test -- src/app/api/clientes/route.test.ts 'src/app/(bpo)/clientes/_components/clientes-page-client.test.tsx'`
- `npm test`
- `npm run lint` (falhou por erros pré-existentes fora do escopo desta story)

### Completion Notes List

- Implementado `GET /api/dashboard/resumo` com contagens agregadas por status operacional e status ERP, filtradas por `bpo_id` do usuário autenticado.
- Criado `ResumoDashboard` como tipo compartilhado do domínio para o payload do dashboard.
- Substituído o stub da Home por um painel com cards numéricos, loading via `isLoadingResumo`, feedback de erro amigável e atalhos para `/clientes` e `/integacoes`.
- Mantido o redirecionamento de `cliente_final` para `/portal`.
- Decisão da story 3: operador também visualiza o mesmo painel de resumo da carteira; o bloqueio permanece apenas para `cliente_final`.
- Criada a rota stub `/integacoes` para que o atalho da Home navegue para uma página existente enquanto as stories do Epic 4 evoluem.
- Regressão validada em `GET /api/clientes`, `ClientesPageClient` e suíte completa (`308/308` testes verdes).
- `npm run lint` continua falhando por problemas prévios em arquivos não alterados nesta story.

### File List

- _bmad-output/implementation-artifacts/1-8-painel-das-empresas-resumo-em-numeros.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- bpo360-app/src/app/(bpo)/page.tsx
- bpo360-app/src/app/(bpo)/_components/bpo-home-dashboard-client.tsx
- bpo360-app/src/app/(bpo)/_components/bpo-home-dashboard-client.test.tsx
- bpo360-app/src/app/(bpo)/integacoes/page.tsx
- bpo360-app/src/app/api/dashboard/resumo/route.ts
- bpo360-app/src/app/api/dashboard/resumo/route.test.ts
- bpo360-app/src/lib/domain/dashboard/types.ts

### Change Log

- 2026-03-15: Implementado painel Home com resumo agregado da carteira, nova API `/api/dashboard/resumo`, atalho funcional para `/integacoes` e cobertura de testes/regressão.
