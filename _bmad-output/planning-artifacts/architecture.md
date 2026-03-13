stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/deep-research-report_playbpo.md
  - _bmad-output/planning-artifacts/bpo360-information-architecture.md
  - https://documenter.getpostman.com/view/68066/Tz5m8Kcb#intro
workflowType: 'architecture'
project_name: 'BPO_MANAGER'
user_name: 'Tiago'
date: '2026-03-13'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- Plataforma SaaS B2B multi-tenant para operação de BPO financeiro, com módulos de clientes/carteira, tarefas/rotinas, central de comunicação e documentos, integrações com F360 e dashboards para gestores, operadores e clientes.
- Gestão de tarefas recorrentes e checklists por cliente, com calendário, SLA, prioridade, histórico e modo foco “uma empresa por vez”, incluindo atribuição em massa e biblioteca de modelos.
- Central de solicitações e documentos com timeline unificada por cliente, permitindo rastrear tudo que acontece (tarefas, tickets, uploads, comentários).
- Integração nativa com F360 Finanças via API pública (`/PublicLoginAPI/DoLogin` e endpoints de relatórios) para obter saldos, contas a pagar/receber e conciliações, com camada de mapeamento BPO360↔F360, normalização de dados, snapshots financeiros e mecanismos de sync agendado/manual.
- Módulo de timesheet, custo operacional e rentabilidade por cliente, consolidando horas, custos e receitas para expor margem e destacar clientes em risco.
- Gestão de usuários, papéis e permissões (admin, gestor, operador, cliente), incluindo cofre de senhas com segredos criptografados, visualização mascarada e trilha de auditoria.
- Painéis de monitoramento de integrações e observabilidade básica (logs, status de sync, alertas de dados desatualizados).

**Non-Functional Requirements:**
- Segurança forte para dados financeiros e segredos:
  - HTTPS obrigatório, criptografia em repouso para tokens F360 e cofre de senhas, auditoria de operações sensíveis.
  - Alinhamento com LGPD em termos de tratamento, retenção e rastreabilidade de dados.
- Confiabilidade e resiliência:
  - Capacidade de lidar com indisponibilidade/erros da API F360 sem quebrar o uso do sistema (fallback em snapshots, mensagens claras de desatualização).
  - Jobs de integração idempotentes, com logging e isolamento por cliente.
- Performance e UX:
  - Dashboards de carteira e cliente com tempos de resposta baixos em cenários típicos.
  - Interfaces de uso intensivo (modo foco, listas de tarefas) responsivas e consistentes.
- Observabilidade:
  - Logs estruturados de integrações, métricas de falhas, latência e volume por cliente, para diagnóstico e evolução futura do serviço.

**Scale & Complexity:**
- Primary domain: plataforma web SaaS full-stack com backend de integrações e dashboards operacionais.
- Complexity level: alta (multi-tenant, integrações financeiras críticas, múltiplos perfis de usuário e requisitos de segurança/compliance).
- Estimated architectural components:
  - Núcleo de domínio BPO (clientes, tarefas/rotinas, timesheet, rentabilidade).
  - Camada de integrações (F360 hoje, outros ERPs no futuro).
  - Módulo de comunicação/documentos.
  - Módulo de segurança/cofre de segredos e identidade/autorização.
  - Módulo de observabilidade e monitoramento interno.

### Technical Constraints & Dependencies

- Forte dependência da API do F360 Finanças para entregar os principais indicadores financeiros; arquitetura precisa isolar essa dependência em uma camada de integração bem definida, preparada para mudanças de contrato, limites e erros.
- Necessidade de multi-tenancy desde o início, com isolamento de dados por cliente BPO e, futuramente, por BPO (multi-tenant “em dois níveis”).
- Requisitos de segurança e LGPD pressionando por boas práticas em gestão de segredos, logging e auditoria.
- UX já parcialmente definida em sitemap e PRD, pressionando por rotas/telas coerentes com o modelo de domínio (evitar divergências entre front e backend).

### Cross-Cutting Concerns Identified

- Autenticação e autorização unificadas para todos os papéis, com escopo por tenant/cliente.
- Gestão de integrações externas (F360 inicialmente) com contratos, retries, rate limiting, logging e monitoramento centralizado.
- Auditoria e trilhas de acesso para cofre de senhas, integrações, alterações de configuração e operações sensíveis.
- Observabilidade transversal (logs estruturados, métricas, painéis de monitoramento) para acompanhar saúde da plataforma e das integrações.
- Agendadores e processamento assíncrono para syncs de F360, manutenção de snapshots e, potencialmente, notificações e rotinas automatizadas.

## Starter Template Evaluation

### Primary Technology Domain

Aplicação web SaaS full-stack baseada em Next.js (App Router) com backend de integrações e dashboards operacionais, implantada em Vercel e usando Supabase (PostgreSQL) como backend de dados e autenticação.

### Starter Options Considered

- **Supabase & Next.js App Router Starter Template (oficial Vercel)**  
  - Next.js + TypeScript com App Router e Server Components.  
  - Supabase já configurado (auth, Postgres, helpers de acesso).  
  - Tailwind CSS pronto para layout inicial.  
  - Integração nativa com Vercel (deploy 1‑click, env vars automáticas).  
  - Mantido pela Vercel/Supabase, alinhado às melhores práticas atuais. [1]

- **Starters de comunidade (Next.js + Supabase)**  
  - NextBase e outros boilerplates que adicionam:
    - React Query/TanStack Query, testes (Jest/Playwright), SEO avançado, etc.  
  - Vantagem: mais coisas prontas.  
  - Risco: mais opinião e complexidade logo no início, o que pode bater com decisões futuras da arquitetura BPO360 (domínio rico, integrações, multi-tenant).

### Selected Starter: Supabase & Next.js App Router Starter Template (Vercel)

**Rationale for Selection:**
- Alinha perfeitamente com o objetivo: SaaS B2B multi-tenant moderno em **Next.js + TypeScript** com **PostgreSQL via Supabase** e deploy em **Vercel**.  
- Mantido oficialmente, reduz risco de desatualização de stack base.  
- Fornece estrutura mínima mas suficiente (auth, layout, Tailwind) sem engessar demais as camadas de domínio, integrações e multi-tenancy que vamos desenhar para o BPO360.  
- Facilita onboarding de outros devs (documentação abundante de Next.js, Supabase e Vercel).

**Initialization Command:**

```bash
npx create-next-app --example with-supabase with-supabase-app
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript como linguagem padrão, rodando em Node.js, com suporte nativo a Server Components e Edge/Serverless Functions via Next.js.

**Styling Solution:**
- Tailwind CSS configurado de fábrica, facilitando criação rápida de telas do dashboard, modo foco, listas e formulários.

**Build Tooling:**
- Tooling padrão do Next.js (compilação, bundling, otimizações de imagem e roteamento), com integração direta ao pipeline de build/deploy da Vercel.

**Testing Framework:**
- Não impõe testes de forma pesada no template base; permite escolher e adicionar Jest/Testing Library/Playwright conforme as decisões de QA do projeto.

**Code Organization:**
- Estrutura em torno do `app/` router, com separação clara de rotas, layouts e componentes, pronta para organizar módulos como `clientes`, `tarefas`, `financeiro`, `integacoes` e `admin`.

**Development Experience:**
- Hot reload, dev server integrado, suporte a variáveis de ambiente (.env) e integração com painel da Vercel e Supabase, simplificando o fluxo de desenvolvimento local e em preview.


## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Multi-tenant lógico em **um único projeto Supabase**, com coluna de tenant (`bpo_id`) em todas as tabelas de domínio e políticas de **RLS** garantindo isolamento forte por BPO.
- Perfis de acesso principais: `admin_bpo`, `gestor_bpo`, `operador_bpo`, `cliente_final`, sempre associados a um `bpo_id`, com `cliente_final` restrito ao seu `cliente_id` (empresa atendida).
- Camada de integração **F360** isolada (tabelas `f360_*`, serviços de auth/client/sync) rodando dentro do mesmo projeto Supabase, com jobs assíncronos via funções serverless/cron.

**Important Decisions (Shape Architecture):**
- Modelo de dados centrado em **BPO → Clientes → Tarefas/Rotinas → Timesheet/Rentabilidade**, com snapshots financeiros por cliente vinculados tanto ao BPO quanto ao ERP.
- Autorização baseada em combinação de **papel + tenant + escopo de cliente**, reutilizada em RLS, backend e frontend.
- Interfaces de integração desenhadas de forma **ERP-agnóstica** (ex.: `ErpAuthService`, `ErpApiClient`, `ErpSyncJob`), com implementação concreta inicial para F360.

**Deferred Decisions (Post-MVP):**
- Suporte profundo a outros ERPs além de F360 (Omie, Conta Azul, etc.), reutilizando a mesma camada de integração.
- Mecanismos avançados de billing multi‑tenant (multi‑BPO SaaS externo) e planos por volume/transações.

### Data Architecture

- **Projeto Supabase único** para todo o BPO360, com:
  - Tabelas de domínio sempre contendo `bpo_id` e, quando aplicável, `cliente_id`.
  - RLS aplicada em todas as tabelas sensíveis, garantindo que cada usuário só veja registros do seu `bpo_id` (e, no caso de `cliente_final`, apenas do seu `cliente_id`).
- Entidades centrais:
  - `bpo` (tenant), `usuario`, `cliente` (empresa atendida), `tarefa`, `rotina_modelo`, `rotina_cliente`, `solicitacao`, `documento`, `snapshot_financeiro`, `timesheet`, `integracao_erp`, `empresa_erp_mapeada`, `conta_erp_mapeada`, `segredo`.
- **Snapshots financeiros**:
  - `snapshot_financeiro` armazena payload normalizado por `bpo_id`, `cliente_id`, data de referência, tipo de indicador e origem (`"F360"`), permitindo histórico e fallback em caso de falha da API.
- Migrações:
  - Uso do pipeline de **migrações do Supabase/PostgreSQL** (migrations SQL) para versionar o schema, com convenções de nome para tabelas multi‑tenant (sempre incluindo `bpo_id`).

### Authentication & Security

- **Autenticação**: usar o mecanismo de auth do Supabase (e-mail/senha, magic links ou SSO no futuro), mapeando cada usuário a um `bpo_id` e, opcionalmente, a um `cliente_id`.
- **Autorização**:
  - Papéis (`admin_bpo`, `gestor_bpo`, `operador_bpo`, `cliente_final`) armazenados em claims/JWT e em tabelas de suporte, reutilizados em:
    - Políticas de RLS no Postgres.
    - Guards no backend (route handlers do Next.js).
    - Lógica de exibição no frontend (menus, rotas).
- **Segurança e LGPD**:
  - Tokens F360 e segredos diversos armazenados em tabelas dedicadas com criptografia em repouso (camada de criptografia na aplicação + storage seguro no Postgres).
  - Trilhas de auditoria para operações sensíveis (acesso ao cofre, alterações de integração, permissões).

### API & Communication Patterns

- **Backend principal** implementado via **route handlers** do Next.js (API routes) e, quando necessário, funções serverless separadas para jobs de sync.
- Integração F360 encapsulada em serviços:
  - `F360AuthService` (login via `/PublicLoginAPI/DoLogin`, gestão de JWT por cliente/BPO).
  - `F360ApiClient` (wrapper de chamadas aos endpoints de relatórios/movimentações).
  - `F360SyncJob` (jobs agendados ou disparados manualmente, gerando `snapshot_financeiro`).
- Comunicação entre frontend e backend sempre passando pelo backend do BPO360 (nunca do navegador direto para o F360).
- Estratégia de **rate limiting** e retries para chamadas F360 concentrada na camada de integração.

### Frontend Architecture

- Frontend em **Next.js App Router**, organizado por segmentos alinhados à arquitetura de informação (`/clientes`, `/tarefas/hoje`, `/foco/:clienteId`, `/integacoes`, `/admin`, etc.).
- State management leve inicialmente:
  - Uso de Server Components + fetch no servidor para grande parte dos dashboards/listas.
  - Estado local/leve para formulários e interações de tela; evoluir depois para client state mais robusto (ex.: TanStack Query) conforme necessário.
- Componentização guiada pelas vistas chave:
  - `ClienteVisao360`, `PainelHojeOperador`, `ModoFocoCliente`, `DashboardFinanceiroCliente`, etc., com componentes de layout reutilizáveis.

### Infrastructure & Deployment

- **Hospedagem frontend/backend**: Vercel, aproveitando o suporte nativo a Next.js (builds, previews, edge/serverless).
- **Banco de dados e backend de dados**: Supabase (PostgreSQL + Auth + Storage) como fundação única.
- **Jobs assíncronos**:
  - Agendados via cron/edge functions ou automações integradas (Vercel + chamadas à API backend), isolando lógica de sync F360.
- **Observabilidade**:
  - Logs estruturados para:
    - Chamadas à API F360 (endpoint, status, latência, `bpo_id`, `cliente_id`).
    - Execuções de `F360SyncJob` (sucesso/falha, duração, volume).
  - Métricas básicas para dashboards internos de monitoramento na própria aplicação (`/monitoracao`).

### Decision Impact Analysis

**Implementation Sequence:**
- Iniciar pelo **modelo multi‑tenant** no Supabase (tabelas com `bpo_id`, `cliente_id` e RLS).
- Implementar **auth + papéis** e garantir isolamento de dados na API.
- Criar camada de **integração F360** (auth/client/sync) e schema de `snapshot_financeiro`.
- Construir gradualmente os módulos de domínio (clientes, tarefas/rotinas, timesheet, cofre, dashboards) sobre essa base.

**Cross-Component Dependencies:**
- Todas as telas e APIs dependem do modelo multi‑tenant e das regras de RLS estarem corretas.
- Dashboards e modo foco dependem da combinação de dados internos (tarefas/timesheet) com snapshots vindos da camada F360.
- A expansão futura para múltiplos ERPs reutilizará a mesma arquitetura de integração (interfaces ERP‑agnósticas com implementações específicas).

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
- Nome de tabelas/colunas no Postgres (snake_case vs camelCase; plural vs singular).
- Convenções de rotas e nomes de arquivos em Next.js (App Router).
- Formato de resposta de API (wrap em `{ data, error }` vs payload direto).
- Formato de datas e nomes de campos no JSON (snake_case vs camelCase).

### Naming Patterns

**Database Naming Conventions:**
- Tabelas em `snake_case`, **plural**: `bpos`, `usuarios`, `clientes`, `tarefas`, `rotinas_modelo`, `snapshots_financeiros`, etc.
- Colunas em `snake_case`: `id`, `bpo_id`, `cliente_id`, `created_at`, `updated_at`.
- PK padrão: `id` (UUID).
- FKs: `<entidade>_id` (ex.: `bpo_id`, `usuario_id`, `snapshot_id`).
- Índices: `idx_<tabela>_<coluna>` (ex.: `idx_usuarios_email`).

**API Naming Conventions:**
- Endpoints REST sempre **plural** e minúsculos: `/api/clientes`, `/api/tarefas`, `/api/f360/snapshots`.
- Parâmetros de rota em camelCase no código: `/api/clientes/[clienteId]`, `/api/tarefas/[tarefaId]`.
- Query params em camelCase: `?clienteId=...&status=...`.

**Code Naming Conventions:**
- Componentes React: `PascalCase` (ex.: `ClienteVisao360`, `PainelHojeOperador`).
- Arquivos de componente: `kebab-case.tsx` (ex.: `cliente-visao-360.tsx`).
- Funções e variáveis: `camelCase` (ex.: `loadClientTasks`, `bpoId`, `clienteId`).
- Tipos/Interfaces: `PascalCase` (ex.: `Cliente`, `BpoUser`, `F360Snapshot`).

### Structure Patterns

**Project Organization:**
- Organização por **feature**, alinhada à arquitetura de informação:
  - `app/(bpo)/clientes/...`
  - `app/(bpo)/tarefas/...`
  - `app/(bpo)/foco/...`
  - `app/(bpo)/integacoes/...`
  - `app/(bpo)/admin/...`
- Componentes específicos de cada feature em `_components/` dentro da própria rota.
- Componentes compartilhados em pastas `shared` ou `lib/ui` bem definidas.

**File Structure Patterns:**
- Testes co-localizados: arquivos `*.test.ts` / `*.test.tsx` ao lado da unidade testada.
- Lógica de domínio em `lib/domain/...` (ex.: cálculo de rentabilidade, regras de foco).
- Integrações externas em `lib/integrations/f360/...` (`f360-auth-service`, `f360-api-client`, `f360-sync-job`).
- Auth/RBAC em `lib/auth/` e `lib/rbac/`.

### Format Patterns

**API Response Formats:**
- Sucesso:

```json
{ "data": <payload>, "error": null }
```

- Erro:

```json
{ "data": null, "error": { "code": "SOME_CODE", "message": "Mensagem amigável" } }
```

- Sempre usar HTTP status adequado (200/201, 400, 401, 403, 404, 409, 500), mas o frontend **sempre** lê `data`/`error`.

**Data Exchange Formats:**
- JSON em **camelCase** para campos expostos em APIs e consumidos pelo frontend, mesmo que o banco use `snake_case`.
- Datas sempre em string ISO 8601 no JSON (ex.: `"2026-03-13T12:34:56.000Z"`).

### Communication Patterns

**Event System Patterns (quando eventos forem usados):**
- Nome de eventos internos no formato `dominio.acao` em minúsculo (ex.: `f360.snapshotCriado`, `tarefa.concluida`).
- Payloads de evento sempre incluem `bpoId` e, quando aplicável, `clienteId` e `id` principal do recurso.

**State Management Patterns:**
- Preferência por Server Components + fetch no servidor; client state mínimo.
- Quando introduzir lib de estado remoto (ex.: TanStack Query), padronizar em toda a base (não misturar várias libs diferentes).

### Process Patterns

**Error Handling Patterns:**
- Backend:
  - Log técnico completo (stack, contexto, `bpo_id`, `cliente_id` quando houver).
  - Resposta para o cliente sempre no formato `{ data: null, error: { code, message } }`.
- Frontend:
  - Mensagens de UX derivadas de `error.code`, sem exibir detalhes técnicos.
  - Uso consistente de componentes de erro (ex.: banners/toasts padronizados).

**Loading State Patterns:**
- Convenções de nomes: `isLoadingXxx`, `isSubmittingXxx` (evitar misturar `loading`, `busy`, `pending` arbitrariamente).
- Loading local por tela/componente; loading global apenas quando realmente necessário (ex.: troca de modo foco).

### Enforcement Guidelines

**All AI Agents MUST:**
- Respeitar as convenções de nomes de tabelas/colunas e de resposta de API descritas aqui.
- Organizar novos módulos seguindo o padrão por feature (e não por tipo de arquivo).
- Usar sempre o wrapper `{ data, error }` em rotas de API e JSON camelCase na borda do sistema.

## Project Structure & Boundaries

### Complete Project Directory Structure

```markdown
bpo360-app/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .gitignore
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── (public)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts
│   │   ├── (bpo)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Home / dashboard gestor
│   │   │   ├── clientes/
│   │   │   │   ├── page.tsx            # Lista / carteira de clientes
│   │   │   │   ├── [clienteId]/
│   │   │   │   │   ├── page.tsx        # Visão 360 do cliente
│   │   │   │   │   ├── tarefas/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── financeiro/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── timeline/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── rentabilidade/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── config/
│   │   │   │   │       └── page.tsx
│   │   │   ├── tarefas/
│   │   │   │   └── hoje/
│   │   │   │       └── page.tsx        # Painel “Hoje” operador
│   │   │   ├── foco/
│   │   │   │   └── [clienteId]/
│   │   │   │       └── page.tsx        # Modo foco
│   │   │   ├── solicitacoes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [solicitacaoId]/
│   │   │   │       └── page.tsx
│   │   │   ├── documentos/
│   │   │   │   └── page.tsx
│   │   │   ├── integacoes/
│   │   │   │   ├── page.tsx            # Visão geral de integrações
│   │   │   │   ├── f360/
│   │   │   │   │   ├── [clienteId]/
│   │   │   │   │   │   └── page.tsx    # Wizard de configuração F360
│   │   │   │   │   └── logs/
│   │   │   │   │       └── page.tsx    # Logs/snapshots F360
│   │   │   ├── timesheet/
│   │   │   │   ├── minhas-entradas/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── relatorios/
│   │   │   │       └── page.tsx
│   │   │   ├── cofre/
│   │   │   │   └── page.tsx
│   │   │   ├── monitoracao/
│   │   │   │   └── page.tsx            # Observabilidade/integrações
│   │   │   └── admin/
│   │   │       ├── usuarios/
│   │   │       │   └── page.tsx
│   │   │       └── custos/
│   │   │           └── page.tsx
│   │   ├── api/
│   │   │   ├── clientes/
│   │   │   │   ├── route.ts
│   │   │   │   └── [clienteId]/
│   │   │   │       └── route.ts
│   │   │   ├── tarefas/
│   │   │   │   ├── route.ts
│   │   │   │   └── [tarefaId]/
│   │   │   │       └── route.ts
│   │   │   ├── f360/
│   │   │   │   ├── snapshots/
│   │   │   │   │   └── route.ts
│   │   │   │   └── sync/
│   │   │   │       └── route.ts        # disparo manual de sync
│   │   │   ├── timesheet/
│   │   │   │   └── route.ts
│   │   │   └── cofre/
│   │   │       └── route.ts
│   │   └── (proxy de sessão: proxy.ts na raiz no Next.js 16+)
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts
│   │   ├── auth/
│   │   │   ├── get-current-user.ts
│   │   │   └── rbac.ts
│   │   ├── domain/
│   │   │   ├── clientes/
│   │   │   ├── tarefas/
│   │   │   ├── foco/
│   │   │   ├── timesheet/
│   │   │   └── rentabilidade/
│   │   ├── integrations/
│   │   │   └── f360/
│   │   │       ├── f360-auth-service.ts
│   │   │       ├── f360-api-client.ts
│   │   │       └── f360-sync-job.ts
│   │   ├── utils/
│   │   │   └── date.ts
│   │   └── logging/
│   │       └── logger.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/        # toasts, banners de erro etc.
│   ├── types/
│   │   └── domain.ts
│   └── tests/
│       └── (testes co-localizados; helpers globais opcionais)
└── public/
    ├── favicon.ico
    └── assets/
```

### Architectural Boundaries

**API Boundaries:**
- Todas as integrações externas (F360) passam por `src/lib/integrations/f360/*` e são expostas apenas via rotas em `app/api/f360/*`.
- Camada de domínio (`src/lib/domain/*`) não chama diretamente F360; sempre passa pela camada de integração.
- Autenticação e RBAC ficam centralizados em `src/lib/auth/*` e no proxy de sessão (`proxy.ts` na raiz; Next.js 16+).

**Component Boundaries:**
- Páginas em `app/(bpo)/*` orquestram dados chamando funções de domínio e APIs; componentes “burros” em `components/ui` não acessam Supabase diretamente.

**Data Boundaries:**
- Acesso ao banco sempre através de utilitários em `src/lib/supabase/client.ts` e funções de domínio; regras de RLS garantem isolamento por `bpo_id`/`cliente_id`.

### Requirements to Structure Mapping

- **Carteira de clientes / Visão 360** → `app/(bpo)/clientes/*` + `lib/domain/clientes/*`.
- **Painel Hoje / Modo foco operador** → `app/(bpo)/tarefas/hoje` e `app/(bpo)/foco/[clienteId]` + `lib/domain/foco/*`.
- **Integração F360 (dash + sync)** → `app/(bpo)/clientes/[clienteId]/financeiro`, `app/(bpo)/integacoes/f360/*`, `app/(bpo)/monitoracao` + `lib/integrations/f360/*`.
- **Timesheet e rentabilidade** → `app/(bpo)/timesheet/*`, `app/(bpo)/clientes/[clienteId]/rentabilidade` + `lib/domain/timesheet/*` e `lib/domain/rentabilidade/*`.
- **Cofre de senhas** → `app/(bpo)/cofre` + `lib/domain/segredos/*`.



