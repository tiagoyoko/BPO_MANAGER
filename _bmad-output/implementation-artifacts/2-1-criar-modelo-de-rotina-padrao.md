# Story 2.1: Criar modelo de rotina padrão

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor de BPO**,
I want **criar modelos de rotinas recorrentes com checklists**,
so that **o time execute processos de forma padronizada (ex.: conciliação, fechamento)**.

## Acceptance Criteria

1. **Given** a tela "Novo modelo de rotina", **When** preencher nome, descrição, periodicidade (diária, semanal, mensal, custom), tipo de serviço e itens de checklist (título, opcional descrição, obrigatório), **Then** o modelo é salvo e aparece na biblioteca de modelos reutilizáveis.
2. **And** itens do checklist podem ser ordenados (ordem explícita para exibição e aplicação futura em tarefas).
3. **And** apenas usuários autenticados com papel admin_bpo, gestor_bpo ou operador_bpo (conforme regra de negócio para “criar modelo”) podem acessar a biblioteca; isolamento por bpo_id.
4. **And** listagem de modelos (biblioteca) permite ver nome, descrição, periodicidade, tipo de serviço e quantidade de itens de checklist; edição e exclusão do modelo dentro do escopo desta story são opcionais (podem ser mínimas: editar nome/descrição e ordem dos itens).

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,3)** – Modelo de dados: tabelas rotinas_modelo e checklist
  - [x] Criar migração: tabela `rotinas_modelo` com id (UUID), bpo_id (NOT NULL), nome (TEXT NOT NULL), descricao (TEXT), periodicidade (enum ou TEXT: 'diaria', 'semanal', 'mensal', 'custom'), tipo_servico (TEXT), created_at, updated_at, criado_por_id (opcional). Índice por bpo_id.
  - [x] Tabela `rotina_modelo_checklist_itens` (ou `rotinas_modelo_itens`): id (UUID), rotina_modelo_id (FK rotinas_modelo.id ON DELETE CASCADE), titulo (TEXT NOT NULL), descricao (TEXT), obrigatorio (BOOLEAN default true), ordem (INT NOT NULL, para ordenação). Índice por rotina_modelo_id.
  - [x] RLS em ambas: políticas para usuários autenticados do mesmo bpo_id (admin_bpo, gestor_bpo, operador_bpo podem SELECT/INSERT/UPDATE/DELETE em rotinas_modelo do seu BPO; itens herdam via FK ou política por rotina_modelo_id + join bpo_id).
- [x] **Task 2 (AC: 1,2)** – API: criar e listar modelos de rotina
  - [x] POST /api/modelos (ou /api/rotinas-modelo): body { nome, descricao?, periodicidade, tipoServico?, itensChecklist: [{ titulo, descricao?, obrigatorio }, ...] }. Validar periodicidade; inserir rotinas_modelo e depois itens com ordem (índice do array). Guard: getCurrentUser(), bpo_id do usuário. Resposta: { data: { id, nome, descricao, periodicidade, tipoServico, itensChecklist, criadoEm }, error: null } 201.
  - [x] GET /api/modelos: listar modelos do BPO (bpo_id = user.bpoId). Resposta: { data: { modelos: [{ id, nome, descricao, periodicidade, tipoServico, qtdItensChecklist, criadoEm }] }, error: null } 200. Ordenar por nome ou created_at.
- [x] **Task 3 (AC: 2,4)** – API: editar modelo e ordem dos itens (mínimo)
  - [x] PATCH /api/modelos/[id]: permitir atualizar nome, descricao, periodicidade, tipoServico; permitir substituir lista de itens (enviar array ordenado; apagar itens antigos e inserir novos com ordem). Guard: mesmo bpo_id. Resposta 200 com modelo atualizado.
  - [x] DELETE /api/modelos/[id]: soft delete ou hard delete; garantir que rotina_modelo_id em itens seja CASCADE ou apagar itens antes. Guard: mesmo bpo_id. Resposta 204 ou 200.
- [x] **Task 4 (AC: 1,2)** – UI: tela "Novo modelo de rotina" e biblioteca
  - [x] Página /modelos (app/(bpo)/modelos/page.tsx): listar modelos da API (biblioteca); botão "Novo modelo" que abre formulário/modal.
  - [x] Formulário: nome (obrigatório), descrição (opcional), periodicidade (select: diária, semanal, mensal, custom), tipo de serviço (text ou select, opcional), lista de itens de checklist. Cada item: título (obrigatório), descrição opcional, checkbox "Obrigatório". Botão "Adicionar item"; itens arrastáveis para reordenar (ou botões subir/descer) — ordem enviada na criação/edição.
  - [x] Ao salvar, chamar POST /api/modelos (ou PATCH se editando); feedback sucesso/erro; redirecionar ou fechar modal e atualizar lista.
- [x] **Task 5** – Testes
  - [x] POST /api/modelos com itens de checklist: modelo e itens persistidos com ordem correta.
  - [x] GET /api/modelos retorna apenas modelos do bpo_id do usuário (RLS ou guard).
  - [x] PATCH /api/modelos/[id] atualiza nome e lista de itens; ordem preservada.
  - [x] Usuário sem permissão ou de outro BPO não acessa modelos (403 ou lista vazia).

## Dev Notes

- **Arquitetura (fonte de verdade):** Entidades `rotina_modelo`, `rotina_cliente`, `tarefa` (architecture.md Data Architecture). Tabelas em snake_case plural: `rotinas_modelo`. Organização: lib/domain/tarefas/ (ou lib/domain/rotinas/); API e páginas conforme Project Structure: app/(bpo)/tarefas/, app/api/tarefas/. A informação de IA (bpo360-information-architecture.md) indica **/app/modelos** para "Biblioteca de modelos de rotinas/tarefas" e "Criar/editar modelo de rotina". Usar rota `/modelos` para a biblioteca e criação de modelos.
- **Epic 2 e dependências:** Story 2.1 é a primeira do Epic 2; não há "rotinas_modelo" ainda no banco. Clientes já existem (Epic 1); bpo_id e RLS estão estabelecidos (Epic 8). Reutilizar padrão de guards: getCurrentUser(), filtrar por user.bpoId em todas as queries.
- **Periodicidade "custom":** Pode exigir configuração extra (ex.: dias da semana, dia do mês) em stories futuras (2.2 aplica modelo a cliente). Nesta story, aceitar valor "custom" como enum e armazenar; a geração de tarefas recorrentes será na 2.2.
- **Tipo de serviço:** Campo livre ou enum (ex.: conciliação, fechamento, lançamento, cobrança). Definir no front como select com opções comuns + "Outro" ou texto livre conforme PRD/UX.
- **Ordenação de itens:** Persistir coluna `ordem` (integer); na UI permitir reordenar (drag-and-drop ou setas); ao salvar enviar array na ordem desejada e persistir ordem 0, 1, 2, ...

### Project Structure Notes

- **Migrações:** supabase/migrations/YYYYMMDD_create_rotinas_modelo_and_checklist.sql (em bpo360-app/).
- **API:** src/app/api/modelos/route.ts (GET, POST) e src/app/api/modelos/[id]/route.ts (GET, PATCH, DELETE). Nome alternativo: rotinas-modelo para manter plural e kebab-case na URL.
- **Página:** src/app/(bpo)/modelos/page.tsx com lista de modelos e formulário (modal ou página separada) para novo/editar. Componentes em _components/: modelos-list.tsx, modelo-form.tsx, modelo-checklist-editor.tsx (opcional).
- **Domínio:** lib/domain/rotinas/ ou lib/domain/tarefas/ com tipos e funções de validação (periodicidade, itens) se necessário.
- **Tipos:** types/domain.ts ou types/rotinas.ts — RotinaModelo, RotinaModeloChecklistItem, Periodicidade.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Data Architecture (rotina_modelo, rotina_cliente, tarefa), Naming (snake_case plural), Project Structure (app/(bpo)/, app/api/), RLS por bpo_id.
- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 2, Story 2.1, RF-04, RF-32; AC completos.
- [Source: _bmad-output/planning-artifacts/bpo360-information-architecture.md] — /app/modelos para biblioteca e criar/editar modelo.
- [Source: _bmad-output/implementation-artifacts/1-4-listar-e-filtrar-clientes.md] — Padrão de API (GET com filtros, { data, error }), guards getCurrentUser(), estrutura de página e componentes em (bpo)/clientes.

## Developer Context (Guardrails)

### Technical Requirements

- **Banco:** PostgreSQL via Supabase. Tabelas `rotinas_modelo` e `rotina_modelo_checklist_itens` (ou nome equivalente em plural para itens, ex.: `rotinas_modelo_itens`). Colunas em snake_case; PK UUID; FKs com ON DELETE CASCADE para itens ao apagar modelo.
- **RLS:** Ambas as tabelas com bpo_id (direto em rotinas_modelo; itens acessíveis via join ao modelo). Políticas SELECT/INSERT/UPDATE/DELETE para papéis internos (admin_bpo, gestor_bpo, operador_bpo) do mesmo bpo_id.
- **API:** Resposta sempre { data, error }; JSON em camelCase (nome, descricao, periodicidade, tipoServico, itensChecklist, obrigatorio, ordem). HTTP 200/201/204/400/401/403/404.

### Architecture Compliance

- Naming: DB snake_case; API/JSON camelCase. Rotas REST: /api/modelos ou /api/rotinas-modelo (plural). Estrutura por feature: modelos em app/(bpo)/modelos e app/api/modelos.
- Erro: { data: null, error: { code, message } }; nunca vazar detalhes internos.

### Library / Framework Requirements

- Next.js App Router; Server Components para página de lista; Client Components para formulário e reordenação. Supabase client (server) em API routes; getCurrentUser() de lib/auth.

### File Structure Requirements

- Não criar rotas em app/(bpo)/tarefas/ para "modelos" — a IA define /app/modelos. Migrações em bpo360-app/supabase/migrations/ com convenção YYYYMMDD_descricao.sql.
- Testes co-localizados: route.test.ts para API.

### Testing Requirements

- Criar modelo com vários itens e verificar ordem no GET.
- Usuário de outro bpo_id não vê/edita modelos alheios.
- Validação: periodicidade inválida retorna 400; nome vazio retorna 400.

### Project Context Reference

- PRD, Architecture e Epics são fonte de verdade. Projeto principal em bpo360-app/ (Next.js + Supabase).

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(Nenhum.)

### Completion Notes List

- **Task 1 – Evidência:** Migração `bpo360-app/supabase/migrations/20260314100000_create_rotinas_modelo_and_checklist.sql` criada com tabelas `rotinas_modelo` e `rotina_modelo_checklist_itens`, índices e RLS (políticas por `get_my_bpo_id()` e `get_my_role()` IN admin_bpo, gestor_bpo, operador_bpo). Trigger `set_updated_at` reutilizado.
- **Task 2 – Evidência:** `bpo360-app/src/app/api/modelos/route.ts` — GET lista por `user.bpoId`, resposta `{ data: { modelos } }`; POST valida nome e periodicidade, insere modelo e itens com ordem (índice). Testes em `route.test.ts`: GET 401/403 e 200 com bpo_id; POST 201 com itens e ordem (assert insertItensPayload ordem 0,1).
- **Task 3 – Evidência:** `bpo360-app/src/app/api/modelos/[id]/route.ts` — GET/PATCH/DELETE com guard mesmo bpo_id; PATCH substitui itens (delete + insert ordenado). Testes em `[id]/route.test.ts`: PATCH atualiza nome e itens com ordem; DELETE 403/404/204; GET 404 para modelo de outro BPO.
- **Task 4 – Evidência:** Página `app/(bpo)/modelos/page.tsx` (Server); `modelos-page-client.tsx` (fetch /api/modelos, modal novo/editar); `modelo-form.tsx` (nome, descrição, periodicidade, tipo de serviço, checklist); `modelo-checklist-editor.tsx` (itens com subir/descer, obrigatório); `modelos-list.tsx` (lista com Editar/Excluir). Acesso apenas para admin_bpo, gestor_bpo, operador_bpo.
- **Task 5 – Evidência:** 14 testes em `route.test.ts` e `[id]/route.test.ts`; `npm run test -- src/app/api/modelos` passa 100%. Lint `npm run lint` sem erros nos arquivos da story.

### File List

- bpo360-app/supabase/migrations/20260314100000_create_rotinas_modelo_and_checklist.sql
- bpo360-app/src/lib/domain/rotinas/types.ts
- bpo360-app/src/app/api/modelos/route.ts
- bpo360-app/src/app/api/modelos/route.test.ts
- bpo360-app/src/app/api/modelos/[id]/route.ts
- bpo360-app/src/app/api/modelos/[id]/route.test.ts
- bpo360-app/src/app/(bpo)/modelos/page.tsx
- bpo360-app/src/app/(bpo)/modelos/_components/modelos-page-client.tsx
- bpo360-app/src/app/(bpo)/modelos/_components/modelos-list.tsx
- bpo360-app/src/app/(bpo)/modelos/_components/modelo-form.tsx
- bpo360-app/src/app/(bpo)/modelos/_components/modelo-checklist-editor.tsx

### Change Log

- 2026-03-14: Story 2.1 implementada — migração rotinas_modelo + checklist itens, API GET/POST /api/modelos e GET/PATCH/DELETE /api/modelos/[id], UI /modelos com biblioteca e formulário (novo/editar), testes e evidências por tarefa.
- 2026-03-14: Code review (bmad-code-review): corrigidos HIGH (validação PATCH nome vazio), MEDIUM (restrição de acesso /modelos por role + feedback 403); adicionado teste PATCH nome vazio → 400. Status → done.

---

## Senior Developer Review (AI)

**Revisor:** Tiago (workflow code-review)  
**Data:** 2026-03-14

### Git vs Story

- Arquivos da story estão presentes (novos/untracked). Nenhum arquivo listado na story deixou de ser implementado. Nenhum arquivo alterado fora da File List para esta story.

### Resultado da revisão

- **CRÍTICO:** Nenhum. Todas as tarefas [x] possuem evidência no código.
- **HIGH:** 1 encontrado e corrigido — PATCH /api/modelos/[id] aceitava `nome` vazio e persistia string vazia; adicionada validação e 400 com código CAMPOS_OBRIGATORIOS.
- **MEDIUM:** 2 encontrados e corrigidos — (1) Página /modelos não restringia por role: usuários sem permissão (ex.: cliente_final) viam a página com lista vazia; adicionado redirect para "/" quando role não está em admin_bpo, gestor_bpo, operador_bpo. (2) GET /api/modelos retornando 403 não exibia feedback; adicionado toast de erro "Acesso negado" no client.
- **LOW:** (não corrigidos) ROLES_MODELOS duplicado em 3 arquivos; modal sem tabIndex para foco; checklist editor usando key=index em lista reordenável. Podem ser tratados em refatoração futura.

### Testes

- Adicionado teste em `[id]/route.test.ts`: PATCH com nome vazio (ou só espaços) retorna 400 e código CAMPOS_OBRIGATORIOS. Total 15 testes em modelos; todos passando.

### Decisão

**Aprovado.** HIGH e MEDIUM corrigidos; ACs e tarefas validadas; status atualizado para done.
