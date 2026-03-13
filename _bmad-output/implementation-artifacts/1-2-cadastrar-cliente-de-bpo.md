# Story 1.2: Cadastrar cliente de BPO

Status: ready-for-dev

<!-- Validação opcional: executar validate-create-story antes de dev-story. -->

## Story

As a **gestor de BPO**,
I want **cadastrar um novo cliente com dados básicos**,
so that **o time possa configurar rotinas e integrações para ele**.

## Acceptance Criteria

1. **Given** acesso à área de clientes,
   **When** preencher "Novo cliente" com CNPJ, razão social, nome fantasia, e-mail (obrigatórios) e opcionais (telefone, responsável interno, receita estimada, tags),
   **Then** o sistema valida CNPJ (formato e duplicidade) e persiste o cliente com status "Ativo".
2. **And** o cliente aparece na lista de clientes.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1)** Schema e migração – tabela `clientes`
  - [ ] Criar migração Supabase: tabela `clientes` com `id` (UUID PK), `bpo_id` (UUID FK, NOT NULL), `cnpj` (text UNIQUE por bpo_id), `razao_social`, `nome_fantasia`, `email`, `telefone` (opcional), `responsavel_interno_id` (UUID FK para usuarios, opcional), `receita_estimada` (numeric ou decimal, opcional), `status` (text default 'Ativo'), `tags` (jsonb ou text[], opcional), `created_at`, `updated_at`.
  - [ ] Índice único composto (bpo_id, cnpj) para garantir CNPJ único por tenant. Índice em bpo_id para RLS/listagens.
  - [ ] Habilitar RLS em `clientes`; política SELECT/INSERT/UPDATE para usuários do mesmo `bpo_id` (assumir que 8.1 já fornece bpo_id na sessão; se não, criar política preparada para isso).
- [ ] **Task 2 (AC: 1)** Validação de CNPJ e API
  - [ ] Em `lib/domain/clientes/` (ou equivalente): função de validação de formato CNPJ (14 dígitos, regras básicas) e checagem de duplicidade por `bpo_id` (consulta ao banco).
  - [ ] Route handler POST `app/api/clientes/route.ts`: receber body em camelCase (cnpj, razaoSocial, nomeFantasia, email, telefone?, responsavelInternoId?, receitaEstimada?, tags?); obter `bpo_id` do usuário autenticado (session/JWT); validar obrigatórios e CNPJ; em sucesso inserir em `clientes` e retornar `{ data: cliente, error: null }` (201); em erro de validação/duplicidade retornar `{ data: null, error: { code, message } }` com status 400/409.
  - [ ] Resposta e body em camelCase; persistência em snake_case no Postgres.
- [ ] **Task 3 (AC: 1 e 2)** UI – formulário "Novo cliente" e lista
  - [ ] Em `app/(bpo)/clientes/`: página com lista mínima de clientes (GET /api/clientes) e ação "Novo cliente" abrindo formulário (modal ou página).
  - [ ] Formulário: campos obrigatórios (CNPJ, razão social, nome fantasia, e-mail) e opcionais (telefone, responsável interno, receita estimada, tags). Estado de loading/submit com convenção `isSubmittingXxx`; mensagens de erro derivadas de `error.code` (banners/toasts).
  - [ ] Ao salvar com sucesso: fechar formulário, refresh da lista ou inserção otimista; cliente novo aparece na lista com status "Ativo".
- [ ] **Task 4 (AC: 1)** Testes e acessibilidade
  - [ ] Teste unitário ou integração para validação de CNPJ (formato e duplicidade). Teste de API POST com bpo_id e payload válido/inválido.
  - [ ] Formulário e lista com acessibilidade WCAG 2.1 AA (labels, foco, mensagens de erro associadas).

## Dev Notes

- **Multi-tenant:** Toda inserção e listagem de clientes é filtrada por `bpo_id`. O `bpo_id` deve vir da sessão/JWT (story 8.1). Se 8.1 ainda não existir, obter `bpo_id` de um placeholder (ex.: env ou tabela `bpos` com um único registro) para não bloquear desenvolvimento; documentar que em produção virá do auth.
- **Status do cliente:** Valores esperados: "Ativo", "Em implantação", "Pausado", "Encerrado". Nesta story só criar com "Ativo"; edição de status vem na story 1.3.
- **Tags:** Armazenar como JSONB (array de strings) ou text[] conforme convenção do projeto; na API enviar como array de strings em camelCase.

### Previous Story (1.1) Intelligence

- **Estrutura já existente:** Route groups `(public)` e `(bpo)`; `app/(bpo)/clientes/` com `page.tsx` (lista) e `[clienteId]/` para detalhe; `lib/domain/`, `lib/auth/`, `lib/supabase/` no lugar. Reutilizar essa estrutura; não recriar pastas ou convenções.
- **APIs:** Rotas sob `app/api/` em plural e minúsculas; resposta sempre `{ data, error }`; JSON camelCase na borda; HTTP status adequados (201 criação, 400 validação, 409 conflito).
- **Naming:** Arquivos kebab-case; componentes PascalCase; DB snake_case; API/JSON camelCase. Tabelas plural (`clientes`), colunas snake_case.
- **Sem duplicar:** Não recriar helpers de Supabase ou de auth já presentes no projeto da 1.1; usar os existentes para criar cliente e obter usuário/session.

### Project Structure Notes

- **Onde tocar:** `supabase/migrations/` (nova migração), `lib/domain/clientes/` (validação, tipos, possível service), `app/api/clientes/route.ts` (GET lista + POST criar), `app/(bpo)/clientes/page.tsx` e componentes de formulário/lista em `_components/` ou `components/`.
- **Arquitetura de informação:** Lista de clientes em `/app/clientes` (ou `/(bpo)/clientes`); "Novo cliente" como CTA na própria página de lista. [Source: bpo360-information-architecture.md — Lista de clientes / Carteira.]

### References

- **Épicos e critérios:** [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.2.]
- **Arquitetura (dados, API, RLS, convenções):** [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture, API & Communication Patterns, Naming, Format Patterns, Error Handling.]
- **UX (acessibilidade, feedback):** [Source: _bmad-output/planning-artifacts/ux-design-specification.md — NFR/UX, Design System, feedback de erro.]
- **Story anterior:** [Source: _bmad-output/implementation-artifacts/1-1-setup-do-projeto-next-js-supabase.md.]

---

## Developer Context (guardrails para o agente de implementação)

### Technical requirements

- **Tabela `clientes`:** Obrigatório `bpo_id` em toda linha; RLS garantindo isolamento por `bpo_id`. CNPJ único por tenant (constraint ou índice único em (bpo_id, cnpj)).
- **Validação CNPJ:** Formato (14 dígitos, remoção de pontuação; algoritmo de dígitos verificadores opcional mas recomendado); duplicidade via consulta por `bpo_id` + cnpj normalizado.
- **API:** POST cria cliente; GET retorna lista (filtrada por bpo_id da sessão). Resposta sempre `{ data, error }`; erros de validação com `code` (ex.: CNPJ_DUPLICADO, CNPJ_INVALIDO) e mensagem amigável.

### Architecture compliance

- **DB:** snake_case, tabelas plural; PK UUID; FKs com sufixo `_id`. Migrações em `supabase/migrations/`.
- **API:** Route handlers Next.js; plural e minúsculos; parâmetros em camelCase no código; datas em ISO 8601 no JSON.
- **Código:** Lógica de domínio em `lib/domain/clientes/`; não colocar regras de negócio (validação CNPJ, duplicidade) só dentro do route handler — extrair para funções reutilizáveis.

### Library / framework requirements

- **Supabase:** Cliente server-side para inserção e leitura; usar helpers já existentes do projeto (1.1). Não adicionar ORM novo.
- **Frontend:** Server Components para lista quando fizer sentido; Client Component para formulário "Novo cliente" (estado, submit). Manter convenções de loading (`isLoadingXxx`, `isSubmittingXxx`).

### File structure requirements

- Migração: nome descritivo, ex. `YYYYMMDDHHMMSS_create_clientes_table.sql`.
- Rotas API: `app/api/clientes/route.ts` (GET e POST). Não criar `[clienteId]` nesta story (virá em 1.3).
- Componentes de formulário/lista em `app/(bpo)/clientes/_components/` ou em `components/` compartilhados, em kebab-case.

### Testing requirements

- Validação de CNPJ (formato e integração com duplicidade) testável de forma isolada.
- API: pelo menos um caso de POST sucesso (201) e um de erro (400/409). Lista (GET) retornando apenas clientes do bpo_id do usuário.

### Project context reference

- Nenhum `project-context.md` no repositório. Contexto da story 1.1 e do ADR é suficiente para esta implementação.

---

## Dev Agent Record

### Agent Model Used

_(preencher pelo agente de implementação)_

### Debug Log References

_(opcional)_

### Completion Notes List

_(preencher ao concluir)_

### File List

_(listar arquivos criados/alterados ao concluir)_
