---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/bpo360-information-architecture.md
---

# BPO_MANAGER - Epic Breakdown

Este documento consolida o inventário de requisitos extraídos do PRD, da Arquitetura e da Especificação de UX, para suportar a definição e a verificação de épicos e histórias (incluindo a checagem de lacunas em relação aos épicos existentes EP1–EP7).

## Requirements Inventory

### Functional Requirements

**6.1 Gestão de clientes**
- **RF-01**: Cadastrar clientes com CNPJ, razão social, contatos, receita mensal estimada e tags.
- **RF-02**: Associar cada cliente a um ou mais ERPs, com F360 como ERP principal no MVP.
- **RF-03**: Ativar/desativar integrações por cliente (F360 ativo, outros futuros).

**6.2 Rotinas, tarefas e checklists**
- **RF-04**: Criar modelos de rotinas recorrentes (periodicidade, tipo de serviço, checklists).
- **RF-05**: Instanciar rotinas por cliente, gerando tarefas no calendário automaticamente.
- **RF-06**: Configurar por tarefa: responsável (usuário ou time), datas (início, vencimento, recorrência), prioridade (baixa/média/alta/urgente), SLA interno.
- **RF-07**: Alterar status de tarefa (a fazer, em andamento, concluída, bloqueada).
- **RF-08**: Registrar histórico de mudanças e comentários.

**6.3 Central de comunicação e documentos**
- **RF-09**: Abrir solicitações (tickets) internas ou de clientes, vinculadas a clientes e, opcionalmente, a tarefas.
- **RF-10**: Fazer upload de documentos e anexar a tarefas/solicitações.
- **RF-11**: Exibir timeline unificada por cliente (tarefas, solicitações, documentos, comentários).

**6.4 Indicadores financeiros integrados ao F360**
- **RF-12**: Exibir, para clientes com F360 ativo: saldo do dia por conta e consolidado; contas a receber (hoje, vencidas); contas a pagar (hoje, vencidas); conciliações bancárias pendentes (quantidade e valor).
- **RF-13**: Permitir drill-down dos cards para listas detalhadas dos itens.
- **RF-14**: Atualizar dados F360 de forma agendada (ex.: 15/30 min) e manual (“Atualizar agora”), respeitando limites da API.
- **RF-15**: Mostrar o horário da última sincronização bem-sucedida.

**6.5 Integração com F360**
- **RF-16**: Configurar, por cliente, token F360 e parâmetros para login na API (`/PublicLoginAPI/DoLogin` → JWT Bearer).
- **RF-17**: Implementar serviço de sessão: armazenar JWT com segurança, controlar expiração e renovação automática, re-login em erros de autenticação.
- **RF-18**: Consumir endpoints de relatórios/movimentações para saldos, títulos a receber/pagar, conciliações pendentes.
- **RF-19**: Normalizar resposta da API F360 em estruturas internas (entidades de domínio BPO360).
- **RF-40**: Implementar tela de mapeamento Cliente (BPO360) ↔ Empresa(s) F360 e seleção de contas bancárias relevantes.
- **RF-41**: Serviço de sincronização: jobs de coleta F360 por cliente, snapshots agregados e detalhados, persistência com timestamp e status.
- **RF-42**: Manter histórico de snapshots para análise temporal e fallback.
- **RF-20**: Tratar erros de API (autenticação, negócio, infra) e exibir mensagens amigáveis em telas administrativas.
- **RF-43**: Implementar rate limiting interno para evitar excesso de chamadas.
- **RF-44**: Exibir aviso na UI em até 2s (texto objetivo até 200 caracteres) quando dados estiverem desatualizados ou integração desconfigurada (CTA para configurar F360).

**6.6 Segurança e cofre de senhas**
- **RF-21**: Cadastrar usuários internos (admin, gestor, operador) com papéis e permissões.
- **RF-22**: Cadastrar usuários de clientes com acesso apenas aos dados do seu CNPJ.
- **RF-23**: Implementar cofre de senhas: segredos criptografados, exibição mascarada, registro de quem visualiza/edita.

**6.7 Timesheet e custo da operação**
- **RF-24**: Registrar tempo de trabalho por tarefa (start/stop ou input manual) e por tipo de atividade (lançamento, conciliação, cobrança, suporte).
- **RF-25**: Consolidar tempos por cliente, operador, tarefa e período.
- **RF-26**: Disponibilizar relatórios de timesheet com filtros e exportação.
- **RF-28**: Cadastrar custo/hora por operador/senioridade.
- **RF-29**: Calcular custo operacional por cliente, período, tarefa/rotina.
- **RF-30**: Gerar indicadores de rentabilidade (receita vs custo, margem em R$ e %).
- **RF-31**: Destacar clientes com margem abaixo de limite configurado.

**6.8 Atribuição em massa e modelos de tarefas**
- **RF-32**: Manter biblioteca de modelos de rotinas/tarefas reutilizáveis.
- **RF-33**: Importar modelos para múltiplos clientes em lote.
- **RF-34**: Editar em massa recorrência, datas relativas, priorização, responsável padrão.
- **RF-35**: Atribuir/reatribuir tarefas em massa para operadores.

**6.9 Modo foco (uma empresa por vez)**
- **RF-36**: Habilitar modo foco para um cliente (UI e contextos filtrados).
- **RF-37**: Controlar alternância entre clientes, alertando quando alternar demais sem concluir/pausar tarefas.
- **RF-38**: Registrar blocos de trabalho focado no timesheet (cliente e período).
- **RF-39**: Permitir parametrizar políticas de foco por gestor (ex.: limite de clientes simultâneos).

### NonFunctional Requirements

- **NFR1 (Performance)**: Dashboard de gestor deve carregar em até 3s para carteiras médias (10–50 clientes ativos no contexto do gestor); mensurável por carga de dados e tempo de resposta.
- **NFR2 (Segurança)**: HTTPS obrigatório; criptografia em repouso para tokens F360 e segredos; logs de auditoria para operações sensíveis (cofre, integrações, permissões).
- **NFR3 (Disponibilidade)**: Meta interna inicial de 99% de uptime (sem SLA público no MVP).
- **NFR4 (Observabilidade)**: Logs estruturados de integração (endpoint, status, latência); métricas de falhas, tempo médio de sincronização, volume de chamadas por cliente.
- **NFR5 (Web – navegadores)**: Suporte a Chrome, Edge e Firefox nas duas versões principais (MVP); Safari opcional.
- **NFR6 (Web – responsividade)**: Layout responsivo; uso em desktop (primário) e tablet; experiência legível em viewport ≥ 1024px.
- **NFR7 (Web – acessibilidade)**: Nível alvo WCAG 2.1 AA para telas principais (login, dashboard, listas, formulários críticos); trilha de melhorias contínuas.

### Additional Requirements

*(Requisitos técnicos que impactam épicos/histórias, extraídos da Arquitetura.)*

- **Starter template**: Usar Supabase & Next.js App Router Starter; comando de inicialização: `npx create-next-app --example with-supabase with-supabase-app`. Impacta Epic 1 / Story 1 (setup do projeto).
- **Multi-tenancy**: Um único projeto Supabase; coluna `bpo_id` em tabelas de domínio; políticas RLS para isolamento por BPO; papéis `admin_bpo`, `gestor_bpo`, `operador_bpo`, `cliente_final` associados a `bpo_id`; `cliente_final` restrito ao seu `cliente_id`.
- **Modelo de dados**: Entidades centrais – `bpo`, `usuario`, `cliente`, `tarefa`, `rotina_modelo`, `rotina_cliente`, `solicitacao`, `documento`, `snapshot_financeiro`, `timesheet`, `integracao_erp`, `empresa_erp_mapeada`, `conta_erp_mapeada`, `segredo`; tabelas em snake_case plural; colunas em snake_case; PK UUID; migrações Supabase/PostgreSQL.
- **Integração F360**: Camada isolada – `F360AuthService`, `F360ApiClient`, `F360SyncJob`; jobs assíncronos via serverless/cron; interfaces ERP-agnósticas para evolução futura.
- **API e formato**: Route handlers Next.js; resposta padronizada `{ data, error }`; JSON em camelCase na borda; HTTP status adequados; datas em ISO 8601.
- **Frontend**: App Router por segmentos (`/clientes`, `/tarefas/hoje`, `/foco/:clienteId`, `/integacoes`, `/admin`); Server Components + fetch no servidor; componentes chave: ClienteVisao360, PainelHojeOperador, ModoFocoCliente, DashboardFinanceiroCliente.
- **Infra e deploy**: Vercel para frontend/backend; Supabase para banco e auth; jobs agendados via cron/edge; logs estruturados para F360 e F360SyncJob; métricas para painel interno `/monitoracao`.
- **Convenções de código**: Naming (DB snake_case, API/JSON camelCase, componentes PascalCase, arquivos kebab-case); organização por feature; testes co-localizados; domínio em `lib/domain/`, integrações em `lib/integrations/f360/`, auth em `lib/auth/`, RBAC em `lib/rbac/`.
- **Tratamento de erros**: Backend – log técnico completo, resposta `{ data: null, error: { code, message } }`; frontend – mensagens derivadas de `error.code`, componentes de erro padronizados (banners/toasts).
- **Estado de carregamento**: Convenções `isLoadingXxx`, `isSubmittingXxx`; loading local por tela/componente.

### UX Design Requirements

*(Requisitos acionáveis extraídos da Especificação de UX para histórias com critérios de aceite testáveis.)*

- **UX-DR1**: Implementar sistema de design tokens (cores, espaçamento, tipografia) alinhado ao padrão do produto para consistência entre telas (desktop-first, hierarquia clara).
- **UX-DR2**: Implementar componentes de vista principais: ClienteVisao360, PainelHojeOperador, ModoFocoCliente, DashboardFinanceiroCliente, com layout e responsividade definidos (≥1024px).
- **UX-DR3**: Definir e implementar estados visuais claros para integração F360 (atualizado, desatualizado, erro) com rótulos e cores compreensíveis para usuário de negócio, sem jargão técnico.
- **UX-DR4**: Garantir padrões de acessibilidade WCAG 2.1 AA para telas principais (login, dashboard, listas, formulários críticos).
- **UX-DR5**: Layout responsivo desktop-first (≥1024px), experiência legível em tablet; interações de alta frequência confortáveis com mouse e atalhos de teclado onde fizer sentido.
- **UX-DR6**: Microinterações e feedback imediato em modo foco: concluir subitem, registrar tempo, avançar para próxima tarefa (animações sutis, confirmações claras, sem poluição visual).
- **UX-DR7**: Componentes de feedback de erro padronizados (banners/toasts) com mensagens em linguagem de negócio, explicando impacto e próximo passo; indicar severidade sem dramatização.
- **UX-DR8**: Manter sempre visíveis indicadores de estado e escopo: última sincronização, filtros ativos, cliente/período em foco, para reforçar confiança e evitar “decisão no escuro”.
- **UX-DR9**: Atalhos de teclado para operadores power users em listas, mudança de cliente, marcar checklist, iniciar/parar tempo.
- **UX-DR10**: Onboarding guiado para primeiras sessões (modo foco, Home gestor, integração F360) para garantir sucesso nas primeiras vezes.

### FR Coverage Map

| FR | Épico | Descrição |
|----|--------|-----------|
| RF-01 | EP1 | Cadastrar clientes (CNPJ, razão social, contatos, receita, tags) |
| RF-02 | EP1 | Associar cliente a ERPs (F360 principal no MVP) |
| RF-03 | EP1 | Ativar/desativar integrações por cliente |
| RF-04 | EP2 | Criar modelos de rotinas recorrentes |
| RF-05 | EP2 | Instanciar rotinas por cliente (tarefas no calendário) |
| RF-06 | EP2 | Configurar tarefa (responsável, datas, prioridade, SLA) |
| RF-07 | EP2 | Alterar status de tarefa |
| RF-08 | EP2 | Registrar histórico e comentários |
| RF-09 | EP3 | Abrir solicitações (tickets) vinculadas a clientes/tarefas |
| RF-10 | EP3 | Upload de documentos e anexos |
| RF-11 | EP3 | Timeline unificada por cliente |
| RF-12 | EP5 | Exibir indicadores F360 (saldo, pagar/receber, conciliações) |
| RF-13 | EP5 | Drill-down dos cards para listas detalhadas |
| RF-14 | EP5 | Atualizar dados F360 (agendado + manual) |
| RF-15 | EP5 | Mostrar horário da última sincronização |
| RF-16 | EP4 | Configurar token F360 e login na API |
| RF-17 | EP4 | Serviço de sessão (JWT, expiração, renovação) |
| RF-18 | EP4 | Consumir endpoints F360 (saldos, títulos, conciliações) |
| RF-19 | EP4 | Normalizar resposta F360 em entidades BPO360 |
| RF-20 | EP4 | Tratar erros de API e mensagens amigáveis |
| RF-21 | EP8 | Cadastrar usuários internos (admin, gestor, operador) |
| RF-22 | EP8 | Cadastrar usuários de clientes (acesso por CNPJ) |
| RF-23 | EP8 | Cofre de senhas (criptografia, mascaramento, auditoria) |
| RF-24 | EP6 | Registrar tempo por tarefa e tipo de atividade |
| RF-25 | EP6 | Consolidar tempos por cliente/operador/tarefa/período |
| RF-26 | EP6 | Relatórios de timesheet (filtros e exportação) |
| RF-28 | EP6 | Cadastrar custo/hora por operador |
| RF-29 | EP6 | Calcular custo operacional por cliente/período/tarefa |
| RF-30 | EP6 | Indicadores de rentabilidade (receita, custo, margem) |
| RF-31 | EP6 | Destacar clientes com margem abaixo do limite |
| RF-32 | EP2 | Biblioteca de modelos de rotinas/tarefas |
| RF-33 | EP2 | Importar modelos para múltiplos clientes em lote |
| RF-34 | EP2 | Editar em massa (recorrência, datas, prioridade, responsável) |
| RF-35 | EP2 | Atribuir/reatribuir tarefas em massa |
| RF-36 | EP7 | Habilitar modo foco por cliente (UI e contexto filtrados) |
| RF-37 | EP7 | Controlar alternância entre clientes (alertas) |
| RF-38 | EP7 | Registrar blocos de foco no timesheet |
| RF-39 | EP7 | Parametrizar políticas de foco por gestor |
| RF-40 | EP4 | Tela de mapeamento Cliente BPO360 ↔ Empresa(s) F360 |
| RF-41 | EP4 | Serviço de sincronização (jobs, snapshots, persistência) |
| RF-42 | EP4 | Histórico de snapshots (análise e fallback) |
| RF-43 | EP4 | Rate limiting interno para chamadas F360 |
| RF-44 | EP4 | Aviso na UI (≤2s, ≤200 chars) para dados desatualizados/desconfigurados |

## Epic List

### Epic 1: Gestão de Clientes e Configurações de ERP
Permitir que o gestor cadastre clientes BPO, associe ao ERP (F360 no MVP) e configure parâmetros de integração por cliente. Inclui setup do projeto (Starter Next.js + Supabase) na primeira story.
**FRs cobertos:** RF-01, RF-02, RF-03.

### Epic 2: Rotinas, Tarefas, Checklists e Atribuição em Massa
Permitir que o gestor e o operador definam modelos de rotinas, gerem tarefas recorrentes, executem checklists e façam atribuição/edição em massa.
**FRs cobertos:** RF-04, RF-05, RF-06, RF-07, RF-08, RF-32, RF-33, RF-34, RF-35.

### Epic 3: Central de Comunicação e Documentos
Permitir que equipe e clientes abram solicitações, anexem documentos e visualizem timeline unificada por cliente.
**FRs cobertos:** RF-09, RF-10, RF-11.

### Epic 4: Integração F360 (Auth, Relatórios, Snapshots)
Implementar camada técnica de integração com F360: autenticação, consumo de dados, mapeamento cliente↔empresa, sincronização, snapshots, tratamento de erros e avisos na UI.
**FRs cobertos:** RF-16, RF-17, RF-18, RF-19, RF-20, RF-40, RF-41, RF-42, RF-43, RF-44.

### Epic 5: Dashboard Operacional com Indicadores F360
Exibir indicadores financeiros por cliente (saldo, pagar/receber, conciliações), drill-down, atualização manual e timestamp da última sync.
**FRs cobertos:** RF-12, RF-13, RF-14, RF-15.

### Epic 6: Timesheet, Custo Operacional e Rentabilidade
Registrar horas por tarefa/cliente, consolidar tempos, relatórios, custo/hora, custo operacional e indicadores de rentabilidade (margem, alertas).
**FRs cobertos:** RF-24, RF-25, RF-26, RF-28, RF-29, RF-30, RF-31.

### Epic 7: Modo Foco por Empresa e Regras de Trabalho
Permitir que o operador trabalhe em um cliente por vez (modo foco), com controle de alternância, registro no timesheet e políticas configuráveis.
**FRs cobertos:** RF-36, RF-37, RF-38, RF-39.

### Epic 8: Segurança, Usuários e Cofre de Senhas *(novo)*
Permitir que o admin gerencie usuários internos (admin, gestor, operador) e usuários de clientes (acesso por CNPJ), e que segredos fiquem no cofre com criptografia, mascaramento e trilha de auditoria.
**FRs cobertos:** RF-21, RF-22, RF-23.
**Faseamento sugerido:** Primeiras stories = auth + papéis + RLS (não bloquear EP1). Depois = cofre de senhas (RF-23) e usuários de clientes (RF-22).

### Epic 9: Modernização Visual e Design System do BPO360 *(novo)*
Alinhar a interface atual do produto à especificação de UX e às direções visuais aprovadas, consolidando shell global, design tokens, componentes de domínio e refatoração das superfícies críticas para uma experiência mais clara, consistente e moderna.
**UX-DRs cobertos:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10.
**Base de referência:** `ux-design-specification.md`, `ux-design-directions.html`.

---

## Recomendações de implementação

### Ordem de implementação (EP8 → EP1 → EP4 → EP5 e demais)

Ordem recomendada para reduzir bloqueios e entregar valor incremental. Dependências técnicas e de produto foram consideradas.

| Fase | Épico(s) | Rationale |
|------|----------|-----------|
| **1 – Fundação** | **EP8** (ao menos 8.1 e 8.2) | Auth, papéis e RLS garantem multi-tenant desde o início. Sem isso, cadastro de clientes (EP1) não tem isolamento por BPO. Implementar primeiro: **8.1** Autenticação e papéis + RLS, **8.2** Cadastrar usuários internos. |
| **2 – Base de dados e clientes** | **EP1** | Setup do projeto (1.1) e cadastro de clientes (1.2–1.7) passam a usar o tenant (`bpo_id`) e os papéis do EP8. Clientes e configuração de ERP são pré-requisito para rotinas, integração e dashboard. |
| **3 – Integração F360** | **EP4** | Camada técnica de integração (token, mapeamento, sync, snapshots). Precisa de clientes (EP1) para mapear cliente ↔ empresa F360. Nenhum outro épico depende de EP4 para *começar*, mas o dashboard (EP5) *consome* os dados do EP4. |
| **4 – Dashboard com indicadores** | **EP5** | Exibe indicadores F360 por cliente. **Depende de EP4**: usa `SnapshotFinanceiro` e “Atualizar agora” chama `F360SyncJob.runSingle`. Ordem fixa: **EP4 antes de EP5**. |
| **5 – Rotinas e comunicação** | **EP2**, **EP3** | Podem ser feitos após EP1 (clientes existem). **EP2** (rotinas, tarefas, checklists, massa) e **EP3** (solicitações, documentos, timeline) são independentes entre si; ordem entre eles é flexível. EP2 costuma vir antes por ser núcleo operacional. |
| **6 – Timesheet e rentabilidade** | **EP6** | Registro de tempo, custo/hora, rentabilidade. Usa clientes (EP1) e tarefas (EP2). Pode ser iniciado quando EP2 tiver tarefas e checklists utilizáveis. |
| **7 – Modo foco** | **EP7** | Modo foco por cliente usa tarefas (EP2) e lista de clientes (EP1). **Pode começar sem EP6**; a story **7.3** (registrar blocos de foco no timesheet) depende de EP6 ter registro de tempo básico — implementar 7.3 após EP6.1/6.2. |

**Resumo da sequência sugerida:**

1. **EP8.1, EP8.2** (auth + usuários internos + RLS)  
2. **EP1** (setup 1.1 + clientes e config ERP 1.2–1.7)  
3. **EP4** (integração F360 completa)  
4. **EP5** (dashboard com indicadores F360)  
5. **EP2** (rotinas, tarefas, checklists, massa)  
6. **EP3** (comunicação e documentos) — pode ser em paralelo ou após EP2  
7. **EP6** (timesheet e rentabilidade)  
8. **EP7** (modo foco); story **7.3** após EP6 ter timesheet básico  
9. **EP8.3, EP8.4** (usuários de clientes + cofre de senhas) — quando o portal do cliente e o cofre forem prioridade  

**Dependências críticas (não inverter):**

- **EP8 (auth/papéis) → EP1** (cadastro de clientes com tenant)
- **EP4 → EP5** (dashboard lê snapshots da integração)
- **EP1 → EP2, EP3, EP4** (clientes existem antes de rotinas, comunicação e mapeamento F360)
- **EP2 → EP6** (timesheet por tarefa); **EP6 → EP7.3** (blocos de foco no timesheet)

---

- **NFR/UX nas histórias:** Incluir critério de aceite de performance (dashboard em até 3s) nas stories de listagem/dashboard (EP1, EP5). Incluir acessibilidade (WCAG 2.1 AA) em critérios de aceite de formulários e listas principais. Considerar uma story explícita para “Estados visuais e avisos da integração F360 na UI” (atualizado / desatualizado / erro) em EP4 ou EP5.
- **Lacunas:** Novas necessidades devem ser tratadas como novas stories dentro dos épicos existentes (ex.: onboarding guiado no EP7, primeira configuração F360 no EP4); não é necessário criar novos épicos.

---

## Detalhamento dos épicos e histórias

### Epic 1: Gestão de Clientes e Configurações de ERP

Permitir que o gestor cadastre clientes BPO, associe ao ERP (F360 no MVP) e configure parâmetros de integração por cliente. Inclui setup do projeto na primeira story.
**FRs:** RF-01, RF-02, RF-03.

#### Story 1.1: Setup do projeto (Next.js + Supabase)

As a **desenvolvedor**,
I want **inicializar o projeto com o Starter Next.js + Supabase**,
So that **a base do app esteja pronta para multi-tenant e integrações**.

**Acceptance Criteria:**
- **Given** um repositório vazio ou novo,
- **When** executar `npx create-next-app --example with-supabase with-supabase-app` e configurar variáveis de ambiente,
- **Then** o projeto sobe com App Router, TypeScript, Tailwind e Supabase (auth, Postgres, client) configurados.
- **And** a estrutura de pastas segue o definido na Arquitetura (`app/(public)`, `app/(bpo)`, `lib/`, etc.).

#### Story 1.2: Cadastrar cliente de BPO

As a **gestor de BPO**,
I want **cadastrar um novo cliente com dados básicos**,
So that **o time possa configurar rotinas e integrações para ele**.

**Acceptance Criteria:**
- **Given** acesso à área de clientes,
- **When** preencher “Novo cliente” com CNPJ, razão social, nome fantasia, e-mail (obrigatórios) e opcionais (telefone, responsável interno, receita estimada, tags),
- **Then** o sistema valida CNPJ (formato e duplicidade) e persiste o cliente com status “Ativo”.
- **And** o cliente aparece na lista de clientes.

#### Story 1.3: Editar dados e status de cliente

As a **gestor de BPO**,
I want **editar dados e alterar status de um cliente já cadastrado**,
So that **as informações e o ciclo de vida do cliente estejam corretos**.

**Acceptance Criteria:**
- **Given** um cliente aberto,
- **When** alterar campos editáveis ou o status (Ativo, Em implantação, Pausado, Encerrado),
- **Then** as mudanças são salvas; CNPJ só visualização ou edição com confirmação forte.
- **And** mudança para “Encerrado” exige confirmação e texto de impacto.

#### Story 1.4: Listar e filtrar clientes

As a **gestor de BPO**,
I want **ver lista de clientes com filtros e busca**,
So that **eu localize rapidamente empresas por nome, CNPJ, status ou tags**.

**Acceptance Criteria:**
- **Given** a lista de clientes,
- **When** usar busca (nome/CNPJ) e filtros (status, tags, responsável),
- **Then** a lista paginada mostra colunas: Cliente, CNPJ, status, responsável, receita estimada (e opcionalmente indicadores).
- **And** clique em uma linha leva ao painel do cliente.

#### Story 1.5: Configurar ERP principal (F360) por cliente

As a **gestor de BPO**,
I want **definir qual ERP financeiro é usado por um cliente (F360 no MVP)**,
So that **o sistema saiba de onde buscar dados e quais integrações ativar**.

**Acceptance Criteria:**
- **Given** a área de configurações do cliente,
- **When** preencher a seção “ERP financeiro” (tipo F360, ERP principal),
- **Then** a UI exibe a subseção “Integração F360” e as telas de indicadores passam a usar esse ERP.
- **And** no MVP apenas F360; estrutura permite mais ERPs no futuro.

#### Story 1.6: Configurar parâmetros básicos de integração F360 (sem API)

As a **gestor de BPO**,
I want **registrar o token F360 e observações por cliente**,
So that **a integração completa possa ser ativada depois (EP4)**.

**Acceptance Criteria:**
- **Given** a seção “Integração F360” do cliente,
- **When** informar token (campo mascarado, opção de revelar) e observações opcionais,
- **Then** o token é armazenado criptografado e a UI orienta que deve ser gerado no painel F360.
- **And** sem EP4 implementado, a UI mostra “Configuração básica salva – integração técnica pendente”.

#### Story 1.7: Ver status de configuração ERP por cliente

As a **gestor de BPO**,
I want **ver rapidamente se o ERP/integração de cada cliente está configurado**,
So that **eu saiba onde ainda preciso atuar**.

**Acceptance Criteria:**
- **Given** a lista de clientes,
- **When** visualizar a coluna “ERP/Integração”,
- **Then** são exibidos estados: “Não configurado”, “F360 – config básica salva”, “F360 – integração ativa” (quando EP4 ativo).
- **And** tooltip/clique mostra detalhes (tipo de ERP, última alteração).

---

### Epic 2: Rotinas, Tarefas, Checklists e Atribuição em Massa

Permitir que o gestor e o operador definam modelos de rotinas, gerem tarefas recorrentes, executem checklists e façam atribuição/edição em massa.
**FRs:** RF-04, RF-05, RF-06, RF-07, RF-08, RF-32, RF-33, RF-34, RF-35.

#### Story 2.1: Criar modelo de rotina padrão

As a **gestor de BPO**,
I want **criar modelos de rotinas recorrentes com checklists**,
So that **o time execute processos de forma padronizada (ex.: conciliação, fechamento)**.

**Acceptance Criteria:**
- **Given** a tela “Novo modelo de rotina”,
- **When** preencher nome, descrição, periodicidade (diária, semanal, mensal, custom), tipo de serviço e itens de checklist (título, opcional descrição, obrigatório),
- **Then** o modelo é salvo e aparece na biblioteca de modelos reutilizáveis.
- **And** itens do checklist podem ser ordenados.

#### Story 2.2: Aplicar modelo de rotina a um cliente

As a **gestor ou coordenador de BPO**,
I want **aplicar um modelo de rotina a um cliente**,
So that **as tarefas recorrentes daquele processo sejam geradas automaticamente**.

**Acceptance Criteria:**
- **Given** a ficha do cliente e “Adicionar rotina a partir de modelo”,
- **When** escolher modelo, data de início, frequência, responsável padrão e prioridade,
- **Then** o sistema gera instâncias de tarefas futuras conforme a recorrência.
- **And** a rotina aparece na visão de calendário/cronograma do cliente.

#### Story 2.3: Visualizar e gerenciar tarefas em calendário/lista

As a **operador ou gestor de BPO**,
I want **ver tarefas em calendário ou lista por período**,
So that **eu planeje e execute rotinas de forma organizada**.

**Acceptance Criteria:**
- **Given** a visão por cliente,
- **When** abrir calendário (mensal/semanal) ou lista agrupada por data,
- **Then** as tarefas mostram status (a fazer, em andamento, concluída, atrasada) e há filtros por tipo, responsável, status e prioridade.
- **And** clique em uma tarefa abre o detalhe com checklist, comentários e histórico.

#### Story 2.4: Executar checklist de uma tarefa

As a **operador de BPO**,
I want **marcar itens do checklist da tarefa conforme executo**,
So that **todos os passos da rotina sejam cumpridos**.

**Acceptance Criteria:**
- **Given** a tela da tarefa,
- **When** marcar itens do checklist (obrigatórios e opcionais distintos),
- **Then** a tarefa só pode ser marcada “Concluída” com todos os obrigatórios marcados; histórico registra quem marcou/desmarcou e quando.
- **And** itens obrigatórios não podem ser desmarcados após conclusão da tarefa.

#### Story 2.5: Atribuição em massa de tarefas

As a **gestor de BPO**,
I want **selecionar várias tarefas e atribuí-las a um operador ou time de uma vez**,
So that **eu redistribua carga rapidamente**.

**Acceptance Criteria:**
- **Given** a lista de tarefas com seleção múltipla (checkbox),
- **When** usar a ação em massa “Atribuir responsável” e escolher usuário ou time,
- **Then** a alteração é aplicada a todas as selecionadas e o histórico registra quem alterou e quando.
- **And** a interface mostra feedback de sucesso/falha por tarefa quando houver falha pontual.

#### Story 2.6: Editar configuração de rotinas em massa

As a **gestor de BPO**,
I want **ajustar recorrência, prioridade e responsável padrão de várias rotinas ao mesmo tempo**,
So that **eu adapte o plano operacional quando mudar processo ou equipe**.

**Acceptance Criteria:**
- **Given** lista de rotinas (não tarefas) com seleção múltipla,
- **When** usar ações em massa (prioridade, responsável, regra de recorrência, datas de vigência),
- **Then** as alterações refletem em instâncias futuras (conforme regra documentada); sistema exibe resumo antes de confirmar.
- **And** é possível ver quantas rotinas serão afetadas e o impacto previsto.

---

### Epic 3: Central de Comunicação e Documentos

Permitir que equipe e clientes abram solicitações, anexem documentos e visualizem timeline unificada por cliente.
**FRs:** RF-09, RF-10, RF-11.

#### Story 3.1: Abrir solicitação para um cliente

As a **operador de BPO**,
I want **abrir uma solicitação (ticket) vinculada a um cliente**,
So that **eu registre demandas, dúvidas ou pendências do trabalho financeiro**.

**Acceptance Criteria:**
- **Given** a tela “Nova solicitação” com cliente, título, descrição, tipo (documento faltando, dúvida, ajuste, outro), prioridade e vínculo opcional a tarefa,
- **When** salvar,
- **Then** a solicitação recebe identificador e status “Aberta” e aparece na timeline do cliente e na lista geral.
- **And** a solicitação fica disponível para o time e para o cliente (portal).

#### Story 3.2: Cliente enviar solicitação e documentos pelo portal

As a **cliente do BPO**,
I want **enviar solicitações e anexar documentos no portal**,
So that **eu atenda aos pedidos do BPO sem depender de e-mail/WhatsApp**.

**Acceptance Criteria:**
- **Given** o portal do cliente com lista de solicitações e “Nova solicitação” (assunto, descrição, anexos),
- **When** o cliente criar solicitação e anexar arquivos (PDF, PNG/JPG, planilhas),
- **Then** a solicitação fica vinculada ao CNPJ do cliente e disponível na central interna.
- **And** anexos são listados e podem ser baixados/visualizados.

#### Story 3.3: Centralizar comunicação por cliente (timeline)

As a **gestor ou operador de BPO**,
I want **ver uma timeline única por cliente com solicitações, comentários e documentos**,
So that **eu entenda o histórico de comunicação e o contexto das decisões**.

**Acceptance Criteria:**
- **Given** a visão “Comunicação” do cliente,
- **When** abrir a timeline,
- **Then** são exibidos eventos em ordem cronológica (solicitação criada, comentário, documento anexado, mudança de status) com tipo, autor e data/hora.
- **And** há filtros por tipo de evento.

#### Story 3.4: Anexar documentos a tarefas e solicitações

As a **operador de BPO**,
I want **anexar documentos diretamente a uma tarefa ou solicitação**,
So that **os arquivos fiquem organizados por contexto**.

**Acceptance Criteria:**
- **Given** a tela de tarefa ou solicitação com seção “Documentos”,
- **When** usar “Adicionar arquivo” (upload) e listar arquivos (nome, tipo, tamanho, data, autor),
- **Then** é possível baixar ou visualizar (preview) os suportados.
- **And** o documento aparece na timeline do cliente com referência à tarefa/solicitação.

#### Story 3.5: Notificação de atualização para o cliente

As a **cliente do BPO**,
I want **ser notificado quando uma solicitação minha for respondida ou concluída**,
So that **eu acompanhe o andamento sem ficar checando o portal o tempo todo**.

**Acceptance Criteria:**
- **Given** que o operador adiciona comentário ou altera status de uma solicitação de cliente,
- **When** o evento é registrado,
- **Then** o sistema pode enviar notificação por e-mail (configurável) com resumo e link para a solicitação.
- **And** preferências de notificação são configuráveis por cliente.

#### Story 3.6: Vincular comunicação às rotinas e indicadores

As a **gestor de BPO**,
I want **ver em uma rotina/tarefa quais comunicações e documentos relacionados existem**,
So that **eu entenda se atrasos vêm de pendências do cliente ou da execução interna**.

**Acceptance Criteria:**
- **Given** uma tarefa/rotina aberta,
- **When** visualizar a área de comunicação relacionada,
- **Then** são exibidas solicitações vinculadas (diretamente ou ao mesmo período/tema) e contador de abertas.
- **And** na visão geral do cliente é possível filtrar tarefas com solicitações abertas ligadas.

---

### Epic 4: Integração F360 (Auth, Relatórios, Snapshots)

Implementar camada técnica de integração com F360: autenticação, consumo de dados, mapeamento cliente↔empresa, sincronização, snapshots, tratamento de erros e avisos na UI.
**FRs:** RF-16, RF-17, RF-18, RF-19, RF-20, RF-40, RF-41, RF-42, RF-43, RF-44.

#### Story 4.1: Configurar token F360 e testar conexão

As a **gestor de BPO**,
I want **informar o token F360 e testar se a conexão funciona**,
So that **eu garanta que a integração está correta antes de usar os dados**.

**Acceptance Criteria:**
- **Given** a seção “Integração F360” do cliente com campo Token e botão “Testar conexão”,
- **When** clicar em testar e o backend chamar `/PublicLoginAPI/DoLogin`,
- **Then** em sucesso: mensagem “Conexão bem-sucedida” e estado “integração ativa”; em erro: mensagem clara (ex.: “Token inválido ou expirado”) sem marcar ativa.
- **And** o token é armazenado criptografado e nunca devolvido em texto puro pela API.

#### Story 4.2: Mapear empresas F360 para cliente BPO

As a **gestor de BPO**,
I want **mapear quais empresas do F360 correspondem a um cliente do BPO**,
So that **os relatórios e saldos certos sejam usados nos indicadores**.

**Acceptance Criteria:**
- **Given** conexão bem-sucedida e “Carregar empresas do F360”,
- **When** o sistema listar empresas (nome, CNPJ, ID F360) e o gestor selecionar uma ou mais e salvar,
- **Then** o mapeamento é persistido (ex.: F360EmpresaMapeada) e usado em todos os jobs de sincronização.
- **And** a UI mostra claramente quais empresas estão vinculadas ao cliente.

#### Story 4.3: Selecionar contas bancárias relevantes

As a **gestor de BPO**,
I want **escolher quais contas bancárias do F360 entram em saldo e conciliação**,
So that **não entrem contas fora do escopo (ex.: inativas ou pessoais)**.

**Acceptance Criteria:**
- **Given** cada empresa F360 mapeada e a tela “Contas bancárias” (lista via API: nome, banco, agência/conta, tipo),
- **When** o gestor marcar quais contas entram no saldo do dia e nas conciliações,
- **Then** a configuração é salva (ex.: F360ContaMapeada) e usada na geração de SnapshotFinanceiro.
- **And** apenas contas selecionadas são consideradas nos indicadores.

#### Story 4.4: Sincronizar dados F360 por job agendado

As a **gestor de BPO**,
I want **que os dados do F360 sejam sincronizados automaticamente em intervalos regulares**,
So that **os indicadores fiquem atualizados sem ação manual constante**.

**Acceptance Criteria:**
- **Given** o job F360SyncJob.runAll configurável (ex.: 15 ou 30 min),
- **When** o job roda para cada cliente com integração ativa,
- **Then** obtém JWT via F360AuthService, chama endpoints (saldos, pagar/receber, conciliações), normaliza e grava SnapshotFinanceiro com dataReferencia, indicadores e detalhes.
- **And** falhas são logadas e não impedem o processamento dos demais clientes; rate limiting (RF-43) é respeitado.

#### Story 4.5: Rodar sincronização F360 para um cliente via API

As a **backend / API interna**,
I want **disparar sincronização F360 apenas para um cliente**,
So that **a UI e integrações internas suportem “Atualizar agora” sem afetar toda a carteira**.

**Acceptance Criteria:**
- **Given** um endpoint autenticado (ex.: POST /integrations/f360/sync/{clienteId}) restrito a admin/gestor,
- **When** o endpoint for chamado,
- **Then** executa F360SyncJob.runSingle(clienteId) e retorna status (OK/erro) e opcionalmente resumo ou ID do novo snapshot.
- **And** erros são tratados e retornados no formato { data, error }.

#### Story 4.6: Ver status e histórico de sincronizações F360

As a **gestor ou time técnico**,
I want **ver o histórico de sincronizações F360 por cliente**,
So that **eu diagnostique problemas e valide se os dados estão atualizando**.

**Acceptance Criteria:**
- **Given** a seção de integração do cliente e a aba “Histórico de sincronizações”,
- **When** visualizar as execuções (agendada ou manual),
- **Then** são exibidos data/hora, tipo, resultado (sucesso/falha), duração e, em falha, código/descrição resumida.
- **And** é possível filtrar por período e tipo de execução.

#### Story 4.7: Desativar temporariamente a integração F360

As a **gestor de BPO**,
I want **desativar a integração F360 de um cliente sem apagar as configurações**,
So that **eu pause sincronizações (ex.: troca de token, auditoria, cliente em pausa)**.

**Acceptance Criteria:**
- **Given** a config do cliente com toggle “Integração F360 ativa”,
- **When** desativar,
- **Then** jobs não processam aquele cliente; a UI de indicadores mostra “Integração F360 desativada para este cliente”.
- **And** mapeamentos e token permanecem armazenados para reativação; aviso na UI (RF-44) em até 2s com texto objetivo (≤200 caracteres) quando dados desatualizados ou integração desconfigurada.

---

### Epic 5: Dashboard Operacional com Indicadores F360

Exibir indicadores financeiros por cliente (saldo, pagar/receber, conciliações), drill-down, atualização manual e timestamp da última sync.
**FRs:** RF-12, RF-13, RF-14, RF-15. **NFR:** Performance (dashboard em até 3s para 10–50 clientes).

#### Story 5.1: Ver indicadores financeiros por cliente

As a **gestor de BPO**,
I want **ver na página do cliente cards com saldo do dia, pagar/receber (hoje e vencidas) e conciliações pendentes**,
So that **eu tenha visão rápida da saúde financeira operacional daquele cliente**.

**Acceptance Criteria:**
- **Given** um cliente com F360 configurado e último SnapshotFinanceiro disponível,
- **When** acessar a área de indicadores,
- **Then** são exibidos 4 cards: Saldo do dia (consolidado + por conta), Contas a receber (hoje/vencidas), Contas a pagar (hoje/vencidas), Conciliações pendentes (qtd e valor).
- **And** sem snapshot: “Dados ainda não sincronizados” + CTA; integração desativada: CTA “Configurar integração com F360”; carregamento em até 3s para contexto típico (NFR1).

#### Story 5.2: Drill-down de contas a pagar/receber

As a **gestor ou operador de BPO**,
I want **clicar em um card de pagar/receber e ver a lista de títulos**,
So that **eu identifique rapidamente quais lançamentos geram risco (ex.: muitos vencidos)**.

**Acceptance Criteria:**
- **Given** os cards de Contas a receber e a pagar,
- **When** clicar em um card,
- **Then** abre lista com abas/filtros “Hoje” e “Vencidos”, colunas (descrição, sacado/cedente, vencimento, valor, status) a partir de detalhes do SnapshotFinanceiro.
- **And** é possível filtrar e ordenar; sem itens: “Nenhum título encontrado” para aquele filtro.

#### Story 5.3: Drill-down de conciliações pendentes

As a **operador de BPO**,
I want **ver a lista de movimentos bancários pendentes de conciliação**,
So that **eu execute a conciliação de forma priorizada**.

**Acceptance Criteria:**
- **Given** o card Conciliações pendentes,
- **When** clicar para drill-down,
- **Then** é exibida lista paginada com detalhes.conciliacoesPendentes (conta, data, descrição, valor) e filtros por conta e intervalo de datas.
- **And** sem pendentes: card “0 / R$ 0,00” e mensagem “Nenhuma conciliação pendente para o período”.

#### Story 5.4: Atualizar indicadores manualmente

As a **gestor ou operador**,
I want **forçar a atualização dos indicadores de um cliente**,
So that **eu veja dados mais recentes em momentos críticos**.

**Acceptance Criteria:**
- **Given** o botão “Atualizar agora” na área de indicadores,
- **When** clicar,
- **Then** a UI dispara a API que executa F360SyncJob.runSingle(clienteId), mostra loading (“Atualizando dados do F360...”).
- **And** sucesso: cards e timestamp “Última atualização” atualizam; erro: mensagem amigável, último snapshot válido continua em uso e UI indica que os dados podem estar desatualizados.

#### Story 5.5: Ver timestamp e status da última sincronização

As a **gestor de BPO**,
I want **ver quando os dados F360 foram atualizados pela última vez**,
So that **eu avalie se posso confiar na atualidade dos números**.

**Acceptance Criteria:**
- **Given** a área de indicadores do cliente,
- **When** houver snapshot válido,
- **Then** é exibido “Última atualização: DD/MM/AAAA HH:MM”; sem snapshot: “Nunca atualizado”.
- **And** se o último snapshot tiver mais de N horas (configurável), destaque de atenção; em falha na última sync: ícone de alerta com tooltip e opção de “Atualizar agora”.

#### Story 5.6: Visão resumida de carteira (múltiplos clientes)

As a **gestor de BPO**,
I want **ver em uma grade os principais indicadores F360 e operacionais por cliente**,
So that **eu priorize onde atuar primeiro na carteira**.

**Acceptance Criteria:**
- **Given** a tela de visão geral da carteira,
- **When** visualizar,
- **Then** há uma linha por cliente com nome, qtd de tarefas atrasadas, indicador de risco F360 (badge por % ou valor vencidos), sinalização de conciliações acima do limiar.
- **And** é possível ordenar por maior valor vencido (pagar/receber) ou por conciliações pendentes; cada linha tem link para o dashboard do cliente.

---

### Epic 6: Timesheet, Custo Operacional e Rentabilidade

Registrar horas por tarefa/cliente, consolidar tempos, relatórios, custo/hora, custo operacional e indicadores de rentabilidade (margem, alertas).
**FRs:** RF-24, RF-25, RF-26, RF-28, RF-29, RF-30, RF-31.

#### Story 6.1: Registrar tempo em uma tarefa

As a **operador de BPO**,
I want **registrar o tempo que gasto em cada tarefa**,
So that **o time possa medir esforço e custo da operação por cliente**.

**Acceptance Criteria:**
- **Given** a tela da tarefa com seção “Tempo” (Iniciar/Parar cronômetro ou lançamento manual),
- **When** registrar um ou mais intervalos,
- **Then** o total da tarefa é a soma dos intervalos, exibido em horas e minutos.
- **And** vários intervalos podem ser registrados na mesma tarefa.

#### Story 6.2: Ver e editar lançamentos de timesheet

As a **operador ou gestor (com permissão)**,
I want **visualizar e, quando necessário, ajustar lançamentos de tempo**,
So that **os dados reflitam a realidade e erros sejam corrigidos**.

**Acceptance Criteria:**
- **Given** a aba de timesheet do usuário (lista por dia/tarefa com duração e tipo de atividade),
- **When** o operador editar ou apagar lançamentos próprios dentro da janela permitida (ex.: até D+1),
- **Then** as alterações são salvas; gestor pode ajustar tempos da equipe com log de quem alterou e quando.
- **And** regras de permissão por papel são respeitadas.

#### Story 6.3: Classificar tempo por tipo de atividade

As a **gestor de BPO**,
I want **que o tempo seja classificado por tipo de atividade (lançamento, conciliação, cobrança, suporte)**,
So that **eu entenda onde está o esforço da operação**.

**Acceptance Criteria:**
- **Given** o registro de tempo,
- **When** o operador selecionar um tipo de atividade em lista configurável (com suporte a categorias pai/filho),
- **Then** o tipo fica associado ao lançamento.
- **And** relatórios podem agrupar tempo por tipo de atividade.

#### Story 6.4: Configurar custo/hora por operador

As a **gestor de BPO**,
I want **definir o custo/hora de cada operador (ou faixa)**,
So that **o sistema calcule o custo operacional a partir do timesheet**.

**Acceptance Criteria:**
- **Given** a tela de configuração de usuários com campo “Custo/hora” (R$/hora, moeda e decimais),
- **When** alterar o custo/hora,
- **Then** a alteração vale a partir de uma data de vigência (para não distorcer histórico já calculado).
- **And** o valor é usado nos cálculos de custo operacional.

#### Story 6.5: Calcular custo operacional por cliente e por rotina

As a **gestor de BPO**,
I want **ver o custo total da operação por cliente e por rotina/tipo de serviço**,
So that **eu avalie se o contrato é saudável e onde ajustar preços ou processos**.

**Acceptance Criteria:**
- **Given** o relatório de custo (por cliente em um período: total de horas, custo total, custo médio/hora; por rotina/tipo: mesmas métricas, filtrável por cliente),
- **When** visualizar,
- **Then** o custo é calculado com duração dos lançamentos × custo/hora vigente do operador na data.
- **And** é possível exportar em CSV/Excel.

#### Story 6.6: Ver rentabilidade por cliente

As a **gestor de BPO**,
I want **ver por cliente a comparação entre receita contratada e custo operacional**,
So that **eu identifique clientes rentáveis, no limite ou deficitários**.

**Acceptance Criteria:**
- **Given** o dashboard de rentabilidade por cliente em um período,
- **When** visualizar,
- **Then** são exibidos receita (mensal estimada ou valor real quando disponível), custo (soma a partir do timesheet), margem em R$ e %.
- **And** clientes com margem abaixo do limite configurado aparecem destacados (ex.: vermelho); lista permite ordenar por menor margem.

#### Story 6.7: Ver rentabilidade agregada por carteira e por responsável

As a **gestor de BPO**,
I want **ver rentabilidade agregada por carteira e por responsável interno**,
So that **eu entenda o desempenho de diferentes carteiras e gestores**.

**Acceptance Criteria:**
- **Given** o relatório por responsável interno (total receita e custo dos clientes sob sua gestão, margem consolidada),
- **When** visualizar e expandir,
- **Then** é possível ver a lista de clientes de cada responsável.
- **And** há filtros por período, tags/setor e tamanho do cliente (ex.: receita).

---

### Epic 7: Modo Foco por Empresa e Regras de Trabalho

Permitir que o operador trabalhe em um cliente por vez (modo foco), com controle de alternância, registro no timesheet e políticas configuráveis.
**FRs:** RF-36, RF-37, RF-38, RF-39.

#### Story 7.1: Entrar em modo foco em um cliente

As a **operador de BPO**,
I want **entrar em um modo de trabalho focado em um único cliente**,
So that **eu reduza distrações e alternância entre empresas ao executar as tarefas do dia**.

**Acceptance Criteria:**
- **Given** a tela “Hoje” ou a lista de clientes com ação “Entrar em modo foco” para um cliente,
- **When** entrar em foco,
- **Then** a interface exibe apenas tarefas, solicitações e indicadores daquele cliente e um banner fixo “Modo foco: [Nome do cliente]”.
- **And** o modo persiste até o operador sair explicitamente ou trocar de cliente.

#### Story 7.2: Ver somente tarefas do cliente em foco

As a **operador em modo foco**,
I want **ver apenas as tarefas do cliente em foco**,
So that **eu não misture prioridades de outras empresas**.

**Acceptance Criteria:**
- **Given** modo foco ativo na lista “Hoje” e nas visões de tarefas,
- **When** visualizar,
- **Then** só aparecem tarefas do cliente em foco; filtros de responsável, status e tipo continuam válidos dentro desse cliente.
- **And** a hierarquia de informação mantém o foco no cliente atual (UX-DR2, fluxo do operador).

#### Story 7.3: Registrar blocos de tempo focado por cliente

As a **gestor de BPO**,
I want **saber quanto tempo meus operadores passam focados em cada cliente**,
So that **eu avalie disciplina de foco e impacto na produtividade**.

**Acceptance Criteria:**
- **Given** a ativação do modo foco (início do bloco) e a saída ou troca de cliente (fim do bloco),
- **When** o bloco é encerrado,
- **Then** os blocos ficam registrados em entidade própria ou associados ao timesheet, sem alterar o tempo por tarefa.
- **And** relatórios permitem ver tempo total em modo foco por cliente e por operador.

#### Story 7.4: Limitar número de clientes ativos por dia/turno

As a **gestor de BPO**,
I want **configurar quantos clientes um operador pode atender em um dia/turno**,
So that **eu reduza alternância excessiva e aumente a profundidade de foco**.

**Acceptance Criteria:**
- **Given** configuração global ou por time (ex.: máximo 3 clientes ativos por operador por dia),
- **When** o operador tentar entrar em foco em um novo cliente acima do limite,
- **Then** o sistema exibe aviso com a política e oferece cancelar ou substituir um dos clientes já ativos (encerrando o foco anterior).
- **And** a política é parametrizável (RF-39).

#### Story 7.5: Alertar sobre alternância excessiva entre clientes

As a **gestor de BPO**,
I want **que o sistema alerte quando o operador alternar demais entre clientes em pouco tempo**,
So that **eu incentive blocos de trabalho mais concentrados**.

**Acceptance Criteria:**
- **Given** política configurável (ex.: mais de X trocas em Y minutos),
- **When** o operador exceder essa política,
- **Then** o sistema mostra aviso: “Você alternou entre muitos clientes em pouco tempo – considere concluir o que estava fazendo antes de trocar.”.
- **And** os alertas são registrados para análises posteriores (logs/relatórios).

#### Story 7.6: Sair explicitamente do modo foco

As a **operador de BPO**,
I want **ter uma ação clara para sair do modo foco**,
So that **eu volte à visão geral de tarefas quando fizer sentido**.

**Acceptance Criteria:**
- **Given** o banner de modo foco com botão “Sair do modo foco”,
- **When** clicar em sair,
- **Then** a UI volta a mostrar todas as tarefas e clientes (respeitando filtros padrão) e o bloco em andamento é encerrado e registrado.
- **And** se o operador fechar o app/navegador sem sair, o sistema encerra o bloco após tempo de inatividade configurável.

---

### Epic 8: Segurança, Usuários e Cofre de Senhas

Permitir que o admin gerencie usuários internos (admin, gestor, operador) e usuários de clientes (acesso por CNPJ), e que segredos fiquem no cofre com criptografia, mascaramento e trilha de auditoria.
**FRs:** RF-21, RF-22, RF-23. **Faseamento:** primeiras stories = auth + papéis + RLS; depois = cofre e usuários de clientes.

#### Story 8.1: Autenticação e papéis (Supabase Auth + RLS)

As a **administrador do BPO**,
I want **que o sistema tenha login seguro e isolamento de dados por BPO (tenant)**,
So that **cada usuário acesse apenas os dados do seu tenant e conforme seu papel**.

**Acceptance Criteria:**
- **Given** Supabase Auth configurado (e-mail/senha ou magic link),
- **When** o usuário fizer login,
- **Then** o sistema associa o usuário a um `bpo_id` e a um papel (admin_bpo, gestor_bpo, operador_bpo, cliente_final); tabelas de domínio têm `bpo_id` e RLS garante isolamento.
- **And** cliente_final é restrito ao seu `cliente_id`; middleware/guards aplicam papel em rotas e no frontend; JWT/claims incluem bpo_id e papel.

#### Story 8.2: Cadastrar usuários internos (admin, gestor, operador)

As a **admin do BPO**,
I want **cadastrar usuários internos com papéis e permissões**,
So that **o time tenha acesso adequado às funções do sistema (RF-21)**.

**Acceptance Criteria:**
- **Given** a área de administração de usuários (ex.: /admin/usuarios),
- **When** o admin criar ou editar um usuário interno (nome, e-mail, papel: admin_bpo, gestor_bpo, operador_bpo, associação a bpo_id e opcionalmente cliente_id para operador),
- **Then** o usuário é criado/atualizado no Supabase Auth e no perfil (tabela de suporte) com papel e escopo; alterações são auditadas.
- **And** apenas admin_bpo pode gerenciar usuários; permissões por papel seguem o definido na Arquitetura.

#### Story 8.3: Cadastrar usuários de clientes (acesso por CNPJ)

As a **admin ou gestor de BPO**,
I want **cadastrar usuários de clientes com acesso apenas aos dados do seu CNPJ**,
So that **o cliente acesse o portal e veja somente suas solicitações e documentos (RF-22)**.

**Acceptance Criteria:**
- **Given** a área de usuários de clientes (vinculada ao cliente/CNPJ),
- **When** o admin/gestor criar ou editar um usuário de cliente (e-mail, cliente_id/CNPJ, papel cliente_final),
- **Then** o usuário é criado no Auth e no perfil com cliente_id; RLS e guards garantem que ele só acesse dados daquele cliente.
- **And** o cliente consegue acessar o portal (solicitações, documentos, notificações) somente do seu CNPJ.

#### Story 8.4: Cofre de senhas (segredos criptografados e auditoria)

As a **gestor ou operador de BPO**,
I want **guardar e consultar segredos (ex.: senhas de banco, tokens) de forma segura no cofre**,
So that **credenciais sensíveis fiquem criptografadas, mascaradas e com trilha de quem acessou (RF-23)**.

**Acceptance Criteria:**
- **Given** a área do cofre (ex.: /cofre) com permissão por papel,
- **When** o usuário criar ou editar um segredo (nome, valor, opcionalmente vínculo a cliente),
- **Then** o valor é armazenado criptografado em repouso; na listagem e visualização é exibido apenas mascarado (ex.: ****) com opção de revelar temporariamente com confirmação.
- **And** é registrado quem visualizou/editou cada segredo e quando (auditoria); apenas papéis autorizados acessam o cofre.

---

### Epic 9: Modernização Visual e Design System do BPO360

Alinhar a interface atual do produto à especificação de UX e às direções visuais aprovadas, consolidando shell global, design tokens, componentes de domínio e refatoração das superfícies críticas para uma experiência mais clara, consistente e moderna.
**UX-DRs:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10.
**Base:** `ux-design-specification.md`, `ux-design-directions.html`.

#### Story 9.1: Implementar design tokens e fundação visual global

As a **usuário do BPO360**,
I want **que a aplicação use um sistema visual consistente de cores, tipografia, espaçamento e estados**,
So that **a interface pareça coesa, moderna e previsível em todas as telas**.

**Acceptance Criteria:**
- **Given** a base atual de estilos globais e componentes UI,
- **When** a fundação visual for implementada,
- **Then** o projeto passa a expor tokens semânticos para cor, tipografia, spacing, radius, borda, sombra e estados principais, alinhados ao UX spec.
- **And** os tokens substituem a base genérica atual sem quebrar contraste mínimo AA nas superfícies principais.

#### Story 9.2: Criar AppShell para o backoffice BPO

As a **gestor ou operador de BPO**,
I want **navegar dentro de um shell persistente com sidebar, header contextual e área de ações**,
So that **eu mantenha contexto e orientação ao mover entre Home, Clientes, Hoje e demais módulos**.

**Acceptance Criteria:**
- **Given** as rotas principais da área BPO,
- **When** o AppShell for aplicado,
- **Then** as páginas passam a compartilhar sidebar, header contextual, área principal consistente e indicação visual da seção ativa.
- **And** o shell preserva acessibilidade por teclado, landmarks semânticos e comportamento responsivo para tablet.

#### Story 9.3: Criar sinais operacionais e cards de insight

As a **gestor ou operador de BPO**,
I want **ver risco, sync, prioridade, SLA e KPIs usando a mesma linguagem visual**,
So that **eu entenda estado e prioridade sem precisar reinterpretar cada tela**.

**Acceptance Criteria:**
- **Given** os estados operacionais e financeiros definidos no UX spec,
- **When** os componentes `HealthSignal` e `KPI Insight Card` forem implementados,
- **Then** status, prioridade, integração e indicadores passam a usar componentes semânticos padronizados.
- **And** cada estado combina cor, texto e estrutura, sem depender apenas de cor para ser compreendido.

#### Story 9.4: Refatorar a tela de Clientes para triagem de carteira

As a **gestor de BPO**,
I want **que a tela de clientes funcione como superfície de triagem de carteira, e não só como listagem cadastral**,
So that **eu identifique rapidamente clientes críticos e entre no detalhe certo**.

**Acceptance Criteria:**
- **Given** a tela de clientes atual,
- **When** a refatoração visual for aplicada,
- **Then** a tela passa a destacar risco, integração, responsável, sinais financeiros e próxima ação de forma hierárquica.
- **And** filtros, busca e navegação preservam contexto e levam ao detalhe mais útil do cliente.

#### Story 9.5: Refatorar o painel Hoje para fila operacional priorizada

As a **operador de BPO**,
I want **que o painel Hoje me mostre uma fila clara e priorizada por cliente e tarefa**,
So that **eu saiba imediatamente onde agir primeiro**.

**Acceptance Criteria:**
- **Given** a tela Hoje com tarefas agrupadas por cliente,
- **When** a nova versão for aplicada,
- **Then** o painel destaca prioridade, urgência, contexto do cliente e ação clara de entrar em foco.
- **And** a leitura do dia acontece em poucos segundos, com baixa carga cognitiva.

#### Story 9.6: Evoluir a Área de Trabalho para Focus Workspace

As a **operador de BPO**,
I want **executar o trabalho de um cliente em um workspace focado com tarefas, detalhe, contexto e comunicação integrados**,
So that **eu trabalhe com menos alternância e mais sensação de progresso**.

**Acceptance Criteria:**
- **Given** a área de trabalho atual em colunas,
- **When** ela for evoluída para o `Focus Workspace`,
- **Then** a tela passa a ter hierarquia clara entre lista de tarefas, detalhe ativo e contexto complementar do cliente.
- **And** seleção, avanço, feedback e conclusão de tarefa ocorrem com resposta visual imediata e consistente.

#### Story 9.7: Padronizar feedback, estados vazios, erro e loading

As a **usuário do sistema**,
I want **receber feedback e ver estados vazios/erro/loading de forma consistente em todas as telas**,
So that **eu entenda rapidamente o que aconteceu e qual o próximo passo**.

**Acceptance Criteria:**
- **Given** os padrões de UX definidos para feedback e recovery state,
- **When** forem aplicados ao produto,
- **Then** toasts, banners, empty states, no-results, loading e mensagens de erro usam a mesma gramática visual e textual.
- **And** erros relevantes permanecem legíveis e acionáveis, com linguagem de negócio e orientação de recuperação.

#### Story 9.8: Aplicar a nova linguagem visual ao login e portal do cliente

As a **cliente final ou usuário autenticando no sistema**,
I want **uma experiência visual mais clara, confiável e acolhedora no login e portal**,
So that **eu perceba consistência com o produto sem herdar a densidade operacional do backoffice**.

**Acceptance Criteria:**
- **Given** as telas de login e portal,
- **When** a nova linguagem visual for aplicada,
- **Then** elas passam a usar a mesma fundação de tokens, componentes e hierarquia do produto, com menor densidade e maior apoio contextual.
- **And** a experiência do portal continua distinta do backoffice, porém coerente com a identidade geral do BPO360.

#### Story 9.9: Garantir responsividade e acessibilidade nas superfícies modernizadas

As a **usuário do BPO360**,
I want **que as telas modernizadas funcionem bem em desktop e tablet e mantenham padrões fortes de acessibilidade**,
So that **a experiência continue legível, navegável e segura em diferentes contextos de uso**.

**Acceptance Criteria:**
- **Given** as superfícies modernizadas do backoffice e portal,
- **When** forem validadas,
- **Then** elas atendem ao alvo WCAG 2.1 AA nas áreas principais e se adaptam corretamente aos breakpoints definidos no UX spec.
- **And** foco visível, navegação por teclado, contraste, labels, estados e layouts colapsados funcionam de forma consistente em desktop e tablet.
