# Plano de Implementação – Sprint 1 (BPO360)

**Data:** 2026-03-13  
**Projeto:** BPO_MANAGER (BPO360)  
**Base:** ordem recomendada em `epics.md` e `implementation-readiness-report-2026-03-13.md`

---

## Objetivo do Sprint 1

Estabelecer a **fundação multi-tenant e a base do app**: autenticação, papéis, RLS e setup do projeto com Next.js + Supabase, permitindo que o cadastro de clientes (EP1) seja feito já com isolamento por BPO.

**Entregas esperadas ao fim do Sprint 1:**

- Login seguro (Supabase Auth) com isolamento por tenant (`bpo_id`).
- Cadastro de usuários internos (admin, gestor, operador) com papéis e RLS.
- Projeto inicializado com Starter Next.js + Supabase e estrutura de pastas alinhada à arquitetura.

---

## Stories do Sprint 1

| # | Story ID | Título | Épico | Prioridade |
|---|----------|--------|-------|------------|
| 1 | **8.1** | Autenticação e papéis (Supabase Auth + RLS) | EP8 | P0 |
| 2 | **8.2** | Cadastrar usuários internos (admin, gestor, operador) | EP8 | P0 |
| 3 | **1.1** | Setup do projeto (Next.js + Supabase) | EP1 | P0 |

**Nota:** A ordem de execução recomendada é **8.1 → 8.2 → 1.1**. Opcionalmente, pode-se fazer **1.1** antes de 8.1/8.2 se a equipe preferir ter o repositório e a stack prontos antes de implementar auth; nesse caso, 8.1 e 8.2 passam a configurar auth/RLS em cima do projeto já criado por 1.1. A sequência **1.1 → 8.1 → 8.2** também é válida.

---

## Detalhamento das stories

### Story 8.1: Autenticação e papéis (Supabase Auth + RLS)

**Referência:** `epics.md` – Epic 8, Story 8.1.

- **Objetivo:** Login seguro e isolamento de dados por BPO (tenant); cada usuário acessa apenas dados do seu tenant e conforme seu papel.
- **Critérios de aceite (resumo):**
  - Supabase Auth configurado (e-mail/senha ou magic link).
  - Usuário associado a `bpo_id` e papel (`admin_bpo`, `gestor_bpo`, `operador_bpo`, `cliente_final`).
  - Tabelas de domínio com `bpo_id`; RLS garante isolamento.
  - `cliente_final` restrito ao seu `cliente_id`.
  - Middleware/guards aplicam papel em rotas e frontend; JWT/claims incluem `bpo_id` e papel.

**Dependências:** Nenhuma (é a primeira story de fundação). Requer projeto Next.js + Supabase; se 1.1 for feita antes, 8.1 usa a estrutura já criada.

---

### Story 8.2: Cadastrar usuários internos (admin, gestor, operador)

**Referência:** `epics.md` – Epic 8, Story 8.2.

- **Objetivo:** Admin pode cadastrar usuários internos com papéis e permissões (RF-21).
- **Critérios de aceite (resumo):**
  - Área de administração de usuários (ex.: `/admin/usuarios`).
  - Criar/editar usuário interno: nome, e-mail, papel (`admin_bpo`, `gestor_bpo`, `operador_bpo`), associação a `bpo_id` e opcionalmente `cliente_id` para operador.
  - Usuário criado/atualizado no Supabase Auth e em tabela de perfil com papel e escopo; alterações auditadas.
  - Apenas `admin_bpo` gerencia usuários; permissões por papel conforme Arquitetura.

**Dependências:** 8.1 (auth e RLS devem estar ativos).

---

### Story 1.1: Setup do projeto (Next.js + Supabase)

**Referência:** `epics.md` – Epic 1, Story 1.1.

- **Objetivo:** Base do app pronta para multi-tenant e integrações.
- **Critérios de aceite (resumo):**
  - Executar `npx create-next-app --example with-supabase with-supabase-app` e configurar variáveis de ambiente.
  - Projeto sobe com App Router, TypeScript, Tailwind e Supabase (auth, Postgres, client) configurados.
  - Estrutura de pastas conforme Arquitetura (`app/(public)`, `app/(bpo)`, `lib/`, etc.).

**Dependências:** Nenhuma. Pode ser a primeira story executada (recomendado se ainda não existir repositório) ou feita em paralelo/antes de 8.1 para ter o código-base pronto.

---

## Ordem sugerida de execução no Sprint 1

**Opção A – Projeto já existe (só fundação de auth):**  
8.1 → 8.2. (1.1 fica fora do sprint ou já dada como concluída.)

**Opção B – Greenfield completo:**  
1.1 → 8.1 → 8.2.

**Opção C – Foco total em auth primeiro, projeto mínimo:**  
8.1 → 8.2; 1.1 no próximo sprint (se o time já tiver um repo Next.js + Supabase genérico para começar 8.1).

---

## Definição de pronto (Sprint 1)

- [ ] Story 8.1: Login funcionando com `bpo_id` e papéis; RLS ativo nas tabelas que já existirem.
- [ ] Story 8.2: Tela de usuários internos operando; apenas admin_bpo acessa; dados persistidos em Auth + perfil.
- [ ] Story 1.1: Repo inicializado com comando oficial, env configurado, pastas alinhadas à Arquitetura.
- [ ] Sem dívida técnica crítica (ex.: RLS não aplicado em tabela sensível).

---

## Próximos sprints (visão macro)

| Sprint | Foco | Stories principais |
|--------|------|--------------------|
| **2** | Clientes e config ERP | EP1.2–1.7 (cadastro, listagem, filtros, config ERP/F360 básica, status) |
| **3** | Integração F360 | EP4.1–4.7 (token, mapeamento, sync, histórico, desativar) |
| **4** | Dashboard F360 | EP5.1–5.6 (indicadores, drill-down, “Atualizar agora”, timestamp, visão carteira) |
| **5** | Rotinas e tarefas | EP2.1–2.6 (modelos, aplicar a cliente, calendário/lista, checklist, massa) |
| **6** | Comunicação e documentos | EP3.1–3.6 (solicitações, portal cliente, timeline, anexos, notificações) |
| **7** | Timesheet e rentabilidade | EP6.1–6.7 |
| **8** | Modo foco | EP7.1–7.6 (7.3 após EP6 com timesheet básico) |
| **9** | Cofre e usuários de clientes | EP8.3, EP8.4 |

---

## Referências

- **Épicos e histórias:** `_bmad-output/planning-artifacts/epics.md`
- **Readiness:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-13.md`
- **Arquitetura:** `_bmad-output/planning-artifacts/architecture.md`
- **PRD:** `_bmad-output/planning-artifacts/prd.md`
