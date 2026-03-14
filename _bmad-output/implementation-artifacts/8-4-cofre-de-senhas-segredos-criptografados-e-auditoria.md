# Story 8.4: Cofre de senhas (segredos criptografados e auditoria)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor ou operador de BPO**,
I want **guardar e consultar segredos (ex.: senhas de banco, tokens) de forma segura no cofre**,
so that **credenciais sensíveis fiquem criptografadas, mascaradas e com trilha de quem acessou (RF-23)**.

## Acceptance Criteria

1. **Given** a área do cofre (ex.: /cofre) com permissão por papel, **When** o usuário criar ou editar um segredo (nome, valor, opcionalmente vínculo a cliente), **Then** o valor é armazenado criptografado em repouso; na listagem e visualização é exibido apenas mascarado (ex.: ****) com opção de revelar temporariamente com confirmação.
2. **And** é registrado quem visualizou/editou cada segredo e quando (auditoria); apenas papéis autorizados acessam o cofre.
3. **And** segredos são isolados por bpo_id (RLS); opcionalmente vinculados a cliente_id para escopo por cliente.
4. **And** API nunca retorna o valor em texto puro exceto em endpoint dedicado de "revelar" (ex.: POST /api/cofre/[id]/reveal) com confirmação e registro de auditoria.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1,3)** – Modelo de dados: tabela segredos e auditoria
  - [ ] Criar migração: tabela `segredos` com id (UUID), bpo_id (NOT NULL), cliente_id (NULLABLE), nome (TEXT), valor_criptografado (TEXT), algoritmo/versão se necessário, created_at, updated_at, criado_por_id, atualizado_por_id. Índices por bpo_id e cliente_id.
  - [ ] Tabela `segredos_auditoria` (ou coluna JSONB de eventos): id, segredo_id, usuario_id, acao ('criacao'|'visualizacao'|'edicao'|'revelacao'), ocorrido_em (timestamptz). Permite saber quem viu/editou e quando.
  - [ ] RLS: políticas para que apenas papéis autorizados (admin_bpo, gestor_bpo, operador_bpo) do mesmo bpo_id acessem segredos; restrição por cliente_id opcional (operador só vê segredos do seu escopo se houver regra de cliente).
- [ ] **Task 2 (AC: 1)** – Criptografia em repouso
  - [ ] Definir chave de criptografia (env ENCRYPTION_KEY ou derivada de secret do Supabase/Vercel); usar algoritmo simétrico (ex.: AES-256-GCM) para criptografar o valor antes de gravar em valor_criptografado.
  - [ ] Biblioteca: Node crypto (built-in) ou lib segura (ex.: libsodium se preferir). Nunca armazenar valor em texto puro no banco.
  - [ ] Descriptografar apenas no servidor, no momento de "revelar" ou ao editar; nunca enviar valor descriptografado em listagens.
- [ ] **Task 3 (AC: 2,4)** – API do cofre
  - [ ] GET /api/cofre — listar segredos do BPO (e opcionalmente por cliente_id). Resposta: id, nome, clienteId (se houver), criadoEm, atualizadoEm, valor mascarado (ex.: "••••••••"). Guard: getCurrentUser(); papel admin_bpo, gestor_bpo ou operador_bpo.
  - [ ] POST /api/cofre — criar segredo: body { nome, valor (texto puro apenas neste request), clienteId? }. Criptografar valor, inserir em segredos, registrar auditoria 'criacao'. Retornar { data: { id, nome, clienteId, criadoEm }, error: null } 201.
  - [ ] PATCH /api/cofre/[id] — editar nome ou valor; descriptografar valor antigo (se trocar), criptografar novo, atualizar, registrar 'edicao'.
  - [ ] POST /api/cofre/[id]/reveal — retornar valor descriptografado uma vez; registrar auditoria 'revelacao' (usuario_id, ocorrido_em). Resposta de sucesso: { data: { valor }, error: null }; considerar rate limit ou confirmação (ex.: body { confirmar: true }) para evitar vazamento acidental.
  - [ ] DELETE /api/cofre/[id] — soft delete ou hard delete conforme arquitetura; registrar auditoria se necessário.
- [ ] **Task 4 (AC: 2)** – Auditoria
  - [ ] Em toda criação, edição e revelação, inserir registro em segredos_auditoria com usuario_id (quem fez), acao, ocorrido_em.
  - [ ] Endpoint GET /api/cofre/[id]/auditoria (opcional): listar histórico de acessos para admin/gestor (quem viu/editou e quando).
- [ ] **Task 5** – UI do cofre
  - [ ] Página /cofre (ou /admin/cofre) acessível a papéis autorizados. Listagem com nome, cliente (se houver), data, valor mascarado; botão "Revelar" que chama reveal e exibe valor temporariamente (ex.: 10s ou até fechar modal) com aviso de que a ação é auditada.
  - [ ] Formulário criar/editar: nome, valor (input type password), cliente opcional. Feedback de sucesso/erro via padrão do projeto.
- [ ] **Task 6** – Testes
  - [ ] Teste: valor armazenado no banco está criptografado (não é texto puro).
  - [ ] Teste: listagem não retorna valor em texto puro.
  - [ ] Teste: reveal registra auditoria e retorna valor uma vez.
  - [ ] Teste: usuário de outro bpo_id não acessa segredos (RLS ou guard).

## Dev Notes

- **Arquitetura (fonte de verdade):** "Tokens F360 e segredos diversos armazenados em tabelas dedicadas com criptografia em repouso (camada de criptografia na aplicação + storage seguro no Postgres). Trilhas de auditoria para operações sensíveis (acesso ao cofre, alterações de integração, permissões)." Entidade `segredo` listada no Data Architecture.
- **Contexto 8.1 e 8.2:** getCurrentUser(), get_my_bpo_id(), get_my_role(); RLS por bpo_id. createAdminClient() só para Auth; para cofre usar cliente Supabase normal (server) com RLS. Novo helper canAccessCofre(user): admin_bpo, gestor_bpo, operador_bpo (excluir cliente_final).
- **Criptografia:** Usar Node.js crypto (AES-256-GCM) com chave de 32 bytes em env (ex.: COFRE_ENCRYPTION_KEY). IV/nonce por registro; armazenar IV junto ao ciphertext se necessário (ex.: coluna iv ou prefixo no valor_criptografado). Não usar chave fixa no código.
- **Token F360:** Story 1.6 e Epic 4 usam token F360 por cliente; podem ser armazenados no cofre ou em tabela dedicada. Esta story implementa o cofre genérico; integração com F360 (usar segredo do cofre como token) pode ser evolução posterior.
- **Estrutura de arquivos sugerida:** lib/cofre/ ou lib/domain/cofre/ com encrypt/decrypt e funções de auditoria; app/api/cofre/ para rotas; app/(bpo)/cofre/page.tsx (ou admin/cofre) para UI.

### Project Structure Notes

- Migrações: supabase/migrations/YYYYMMDD_create_segredos_and_auditoria.sql.
- Criptografia: lib/cofre/encrypt.ts (ou lib/domain/cofre/) — encrypt(value), decrypt(ciphertext); usar env COFRE_ENCRYPTION_KEY.
- API: src/app/api/cofre/route.ts (GET, POST), src/app/api/cofre/[id]/route.ts (PATCH, DELETE), src/app/api/cofre/[id]/reveal/route.ts (POST), opcional src/app/api/cofre/[id]/auditoria/route.ts (GET).
- UI: src/app/(bpo)/cofre/page.tsx com lista e modal criar/editar/revelar.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — Data Architecture (entidade segredo), Authentication & Security (criptografia em repouso, auditoria).
- [Source: _bmad-output/planning-artifacts/epics.md] — Epic 8, Story 8.4, RF-23.
- [Source: _bmad-output/implementation-artifacts/8-1-autenticacao-e-papeis-supabase-auth-rls.md] — getCurrentUser, RLS, get_my_bpo_id.
- [Source: _bmad-output/implementation-artifacts/8-2-cadastrar-usuarios-internos-admin-gestor-operador.md] — Padrão de API admin, guards, { data, error }.
- [Source: _bmad-output/implementation-artifacts/8-3-cadastrar-usuarios-de-clientes-acesso-por-cnpj.md] — Contexto de papéis e RLS; cofre é usado por gestor/operador, não por cliente_final.

## Developer Context (Guardrails)

### Technical Requirements

- **Criptografia:** AES-256-GCM ou equivalente; chave em variável de ambiente (nunca no código). Descriptografar apenas no servidor e apenas em fluxos explícitos (reveal, edição).
- **RLS:** Tabela segredos com bpo_id; políticas SELECT/INSERT/UPDATE/DELETE para usuários autenticados do mesmo bpo_id e papel permitido (admin_bpo, gestor_bpo, operador_bpo). cliente_final não acessa cofre.
- **Auditoria:** Registrar toda visualização (reveal), criação e edição com usuario_id e timestamp. Persistir em tabela dedicada para consulta posterior.

### Architecture Compliance

- Naming: tabelas/colunas snake_case; API/JSON camelCase. Resposta de API: { data, error }. Rotas REST plural: /api/cofre.
- Erro: nunca retornar valor descriptografado em erro (ex.: 500); mensagem genérica para o cliente.

### Library / Framework Requirements

- Node crypto (built-in) para AES-256-GCM; ou lib segura (ex.: @noble/ciphers). Next.js App Router; Server-side apenas para decrypt.

### File Structure Requirements

- Código de criptografia isolado em lib/cofre/ (ou lib/domain/cofre/); nunca em Client Components. Env COFRE_ENCRYPTION_KEY documentado em .env.example.
- Testes: unitários para encrypt/decrypt (roundtrip); integração para API (listagem sem valor, reveal com auditoria).

### Testing Requirements

- Valor em banco não é legível em texto puro.
- Reveal retorna valor e insere registro de auditoria.
- Usuário sem permissão recebe 403; usuário de outro BPO não vê segredos.

### Project Context Reference

- PRD, Architecture e Epics são fonte de verdade. Nenhum project-context.md no repositório.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
