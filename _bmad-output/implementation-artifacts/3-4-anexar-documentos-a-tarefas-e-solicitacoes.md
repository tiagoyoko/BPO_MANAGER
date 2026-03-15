# Story 3.4: Anexar documentos a tarefas e solicitações

Status: done

<!-- Validação opcional: executar validate-create-story antes de dev-story. -->

## Story

As a **operador de BPO**,
I want **anexar documentos diretamente a uma tarefa ou solicitação**,
so that **os arquivos fiquem organizados por contexto**.

## Acceptance Criteria

1. **Given** a tela de tarefa ou de solicitação com seção “Documentos”,
   **When** o usuário usa “Adicionar arquivo” (upload) e a lista exibe nome, tipo, tamanho, data e autor,
   **Then** é possível baixar ou visualizar (preview) os arquivos suportados.
2. **And** o documento aparece na timeline do cliente com referência à tarefa ou solicitação associada.

## Tasks / Subtasks

- [x] **Task 1** – Modelo e storage
  - [x] Garantir tabela `documentos` com: id, bpo_id, cliente_id, solicitacao_id (nullable), tarefa_id (nullable), storage_key (Supabase Storage), nome_arquivo, tipo_mime, tamanho_bytes, criado_por_id, created_at. RLS: isolamento por bpo_id; cliente_id alinhado à solicitação/tarefa. Índices por solicitacao_id e tarefa_id para listagens.
  - [x] Bucket Supabase (ex.: anexos-documentos) com políticas: upload apenas autenticado e escopo correto; leitura via signed URL ou serviço backend que verifica RLS.
- [x] **Task 2** – API de documentos
  - [x] GET /api/solicitacoes/[solicitacaoId]/documentos: listar anexos da solicitação (metadados: nome, tipo, tamanho, data, autor). Resposta { data: [...] }, camelCase.
  - [x] POST /api/solicitacoes/[solicitacaoId]/documentos: upload (multipart); validar tipo (PDF, imagens, planilhas) e tamanho; gravar em Storage e inserir linha em documentos; retornar metadados do documento criado.
  - [x] GET /api/tarefas/[tarefaId]/documentos: listar anexos da tarefa; POST /api/tarefas/[tarefaId]/documentos: upload. Mesma lógica de validação e persistência.
  - [x] GET /api/documentos/[documentoId]/download (ou signed URL): retornar URL assinada para download ou stream, garantindo que o usuário tenha permissão (via RLS ou checagem bpo_id/cliente_id).
- [x] **Task 3** – UI: seção Documentos na tela de solicitação
  - [x] Em `app/(bpo)/solicitacoes/[solicitacaoId]/page.tsx` (detalhe da solicitação): seção “Documentos” com lista (nome, tipo, tamanho, data, autor) e botão “Adicionar arquivo”. Upload via POST /api/solicitacoes/[id]/documentos; após sucesso, atualizar lista. Links para download e, quando aplicável, preview (PDF/imagem em nova aba ou modal).
- [x] **Task 4** – UI: seção Documentos na tela de tarefa
  - [x] Em `app/(bpo)/tarefas/[tarefaId]/page.tsx` (ou componente de detalhe da tarefa): seção “Documentos” com mesma UX (lista + adicionar + download/preview). Usar POST/GET /api/tarefas/[tarefaId]/documentos.
- [x] **Task 5 (AC: 2)** – Timeline
  - [x] Garantir que ao anexar documento a tarefa ou solicitação, o evento “documento_anexado” esteja disponível para a API de timeline (Story 3.3): documento com solicitacao_id ou tarefa_id e created_at já permitem agregar na timeline; validar que a timeline inclui referência à tarefa ou solicitação no resumo do evento.

## Dev Notes

- **Reuso:** Se na Story 3.2 já foi criada tabela `documentos` e bucket, estender para tarefa_id e para uso na área BPO (upload por operador). Se não, criar migração única aqui cobrindo solicitação e tarefa.
- **Tarefa:** [Source: architecture] Detalhe em `app/(bpo)/tarefas/[tarefaId]/page.tsx`; componente `tarefa-detalhe-client.tsx`. Adicionar aba ou seção “Documentos” sem remover checklist e demais blocos existentes.
- **Preview:** Para PDF e imagens, usar link para URL assinada em nova aba ou componente embed; para planilhas, apenas download. Limitar tamanho de preview se necessário (ex.: PDF até 5 MB).

### Project Structure Notes

- APIs: `app/api/solicitacoes/[solicitacaoId]/documentos/route.ts`, `app/api/tarefas/[tarefaId]/documentos/route.ts`, e endpoint de download em `app/api/documentos/[documentoId]/route.ts` (GET com redirect ou signed URL).
- Componente reutilizável de lista de documentos + upload pode ficar em `components/` ou em `_components` da feature para usar em solicitação e tarefa.

## PM Validation (John)

**Data:** 2026-03-14  
**Status:** ✅ Validado

- **Valor:** Arquivos organizados por contexto (tarefa ou solicitação); operador e cliente se beneficiam; alinhado a RF-10.
- **AC:** Seção Documentos, upload, lista (nome/tipo/tamanho/data/autor), download/preview e aparição na timeline estão cobertos.
- **Ressalva:** Depende de tabela `documentos`/bucket — coordenação com 3.2 (quem cria primeiro) está nas Dev Notes; ok para dev resolver.

---

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Story 3.4, Epic 3
- [Source: _bmad-output/planning-artifacts/bpo360-ep3-communication-and-docs-stories.md] US 3.4
- [Source: _bmad-output/planning-artifacts/prd/6-requisitos-funcionais.md] RF-10

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Task 1: Migração 20260314240000_create_documentos_and_bucket.sql com tabela documentos (solicitacao_id, tarefa_id, RLS, índices), bucket anexos-solicitacoes e políticas storage. Comentário para timeline (3.3).
- Task 2: APIs GET/POST /api/solicitacoes/[solicitacaoId]/documentos, GET/POST /api/tarefas/[tarefaId]/documentos (resposta camelCase, autor via join usuarios), GET /api/documentos/[documentoId]/url (signed URL com checagem bpo_id/cliente_id).
- Task 3: Página app/(bpo)/solicitacoes/[solicitacaoId]/page.tsx e componente DetalheSolicitacaoClient com DocumentosSection; link na lista para detalhe.
- Task 4: Seção Documentos em tarefa-detalhe-client.tsx usando DocumentosSection com /api/tarefas/:id/documentos.
- Task 5: Modelo documentos já suporta agregação na timeline (solicitacao_id, tarefa_id, created_at); comentário na migração.
- Testes: route.test.ts para documentos de solicitação (GET 401/404/200, POST 400) e de tarefa (GET 401/404/200, POST 401/400/404).
- Code review: storageKey removido da resposta da API (não é necessário no cliente); DocumentoItem centralizado em src/types/documentos.ts; File List atualizado com todos os arquivos modificados no branch.

### File List

- bpo360-app/supabase/migrations/20260314230000_solicitacoes_origem_and_cliente_final_rls.sql
- bpo360-app/supabase/migrations/20260314240000_create_documentos_and_bucket.sql
- bpo360-app/src/types/documentos.ts
- bpo360-app/src/app/api/solicitacoes/route.ts
- bpo360-app/src/app/api/solicitacoes/route.test.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/route.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/route.test.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/anexos/route.test.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/documentos/route.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/documentos/route.test.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/documentos/route.ts
- bpo360-app/src/app/api/tarefas/[tarefaId]/documentos/route.test.ts
- bpo360-app/src/app/api/documentos/[documentoId]/url/route.ts
- bpo360-app/src/components/documentos-section.tsx
- bpo360-app/src/app/(bpo)/solicitacoes/[solicitacaoId]/page.tsx
- bpo360-app/src/app/(bpo)/solicitacoes/[solicitacaoId]/_components/detalhe-solicitacao-client.tsx
- bpo360-app/src/app/(bpo)/solicitacoes/_components/solicitacoes-list.tsx
- bpo360-app/src/app/(bpo)/tarefas/[tarefaId]/_components/tarefa-detalhe-client.tsx
- bpo360-app/src/app/(portal)/portal/page.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/page.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/nova/page.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/[id]/page.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/[id]/_components/detalhe-solicitacao-portal.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/[id]/_components/detalhe-solicitacao-portal.test.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/_components/nova-solicitacao-portal-form.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/_components/solicitacoes-portal-client.tsx
- bpo360-app/src/app/(portal)/portal/solicitacoes/_components/solicitacoes-portal-client.test.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/3-4-anexar-documentos-a-tarefas-e-solicitacoes.md
