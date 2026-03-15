# Story 3.5: Notificação de atualização para o cliente

Status: done

<!-- Validação opcional: executar validate-create-story antes de dev-story. -->

## Story

As a **cliente do BPO**,
I want **ser notificado quando uma solicitação minha for respondida ou concluída**,
so that **eu acompanhe o andamento sem ficar checando o portal o tempo todo**.

## Acceptance Criteria

1. **Given** que o operador adiciona comentário ou altera status de uma solicitação do cliente,
   **When** o evento é registrado,
   **Then** o sistema pode enviar notificação por e-mail (configurável) para o **e-mail do usuário cliente** (usuário com role cliente_final vinculado ao cliente_id da solicitação) com resumo e link para a solicitação no portal.
2. **And** preferências de notificação são configuráveis por cliente (receber ou não e-mails).

## Tasks / Subtasks

- [x] **Task 1** – Registro de evento e disparo de notificação
  - [x] Ao adicionar comentário (POST em comentários) ou ao alterar status da solicitação (PATCH/PUT em solicitacao): chamar função ou job que verifica se a solicitação é de origem “cliente” e se o cliente tem notificações habilitadas; se sim, enfileirar ou enviar e-mail com resumo (ex.: “Sua solicitação #X foi atualizada”) e link para o portal (ex.: /portal/solicitacoes/[id]).
  - [x] E-mail: usar Supabase Edge Function, Resend, SendGrid ou serviço configurado no projeto; template simples (assunto, corpo com link). Não expor dados sensíveis no e-mail; link deve exigir login (portal já protege por sessão).
- [x] **Task 2** – Preferências por cliente
  - [x] Criar tabela `cliente_preferencias` (ou colunas em `clientes`): cliente_id, notificar_por_email (boolean, default true). RLS: apenas BPO e o próprio cliente (via portal) podem ler/atualizar.
  - [x] API: GET/PATCH /api/clientes/[clienteId]/preferencias (ou /api/portal/preferencias para cliente_final usar o próprio cliente_id). Campos: notificarPorEmail. Para cliente_final, PATCH só no próprio cliente.
  - [x] UI no portal: seção “Preferências” ou “Notificações” com toggle “Receber e-mail quando minha solicitação for respondida ou concluída”. Salvar via PATCH.
- [x] **Task 3** – Configuração global (opcional)
  - [x] Se houver configuração “notificações por e-mail ativas” no BPO (feature flag ou config), respeitá-la antes de enviar. Caso contrário, considerar sempre ativo quando notificar_por_email = true para o cliente.

## Dev Notes

- **Escopo:** “Pode enviar” permite implementação mínima: envio síncrono na mesma request (após salvar comentário/status) ou fila assíncrona. Preferir assíncrono (Edge Function ou job) para não aumentar latência da API.
- **E-mail do cliente:** Usar o e-mail do **usuário** vinculado ao cliente (tabela `usuarios` com `cliente_id`). Se houver múltiplos usuários por cliente, notificar todos com notificar_por_email ativo ou definir regra (ex.: primeiro usuário cadastrado). Não usar contato/razão social do cliente como destino de e-mail nesta story.
- **Link do portal:** Base URL do app (NEXT_PUBLIC_APP_URL ou similar) + path /portal/solicitacoes/[id]; garantir que a rota exista (Story 3.2 pode ter lista e detalhe no portal).

### Project Structure Notes

- Lógica de “ao comentar/alterar status → notificar” pode ficar em lib/domain/notificacoes ou dentro dos route handlers de comentários e de PATCH solicitação; ou em trigger/function no Supabase.
- Preferências: migração para tabela ou colunas; API em app/api/clientes/[clienteId]/preferencias ou app/api/portal/preferencias.

## SM – Critérios de aceite adicionais (escolha de escopo)

**Data:** 2026-03-14

Para remover ambiguidade entre "só preferências" vs "envio real de e-mail", use uma das opções abaixo no planejamento e na DoD.

### Opção A – MVP: preferências + ponto de extensão (sem envio real)

- **AC adicional 1:** **Given** a tabela/API de preferências e a UI no portal, **When** o cliente altera o toggle "Receber e-mail quando minha solicitação for respondida ou concluída", **Then** o valor é persistido e exibido corretamente na próxima abertura da seção.
- **AC adicional 2:** **Given** um comentário ou mudança de status em uma solicitação de origem "cliente", **When** o evento é salvo, **Then** o sistema chama um ponto de extensão (função/job) que *poderia* enviar e-mail; no MVP esse envio não é implementado (no-op ou log). A assinatura e o contrato (ex.: payload com `clienteId`, `solicitacaoId`, `tipoEvento`, `destinatarioEmail`) ficam definidos para implementação futura.
- **Decisão:** Destinatário do e-mail = e-mail do usuário `cliente_final` vinculado ao `cliente_id` da solicitação (primeiro usuário ou lista; documentar na Dev Notes).

### Opção B – MVP: envio real de e-mail

- **AC adicional 1:** **Given** preferências com "receber e-mail" ativo e provedor de e-mail configurado (ex.: Resend/SendGrid), **When** o operador adiciona comentário ou altera status de uma solicitação de origem "cliente", **Then** o cliente recebe um e-mail com assunto e corpo contendo resumo (ex.: "Sua solicitação #X foi atualizada") e link para `/portal/solicitacoes/[id]`; o link exige login.
- **AC adicional 2:** **Given** preferências com "receber e-mail" desativado, **When** ocorre comentário ou mudança de status, **Then** nenhum e-mail é enviado.
- **AC adicional 3:** Destinatário do e-mail: definir e documentar (ex.: e-mail do usuário `cliente_final` do cliente; ou campo "e-mail para notificações" na ficha do cliente). Deve estar explícito no artefato antes da implementação.

*Escolher A ou B no refinement/sprint planning e referenciar este bloco na Task 1 da story.*

---

## PM Validation (John)

**Data:** 2026-03-14  
**Status:** ✅ Validado com ressalvas

- **Valor:** Cliente acompanha andamento sem ficar checando o portal; reduz atrito e dúvidas “e aí, e aí?”.
- **AC:** “Pode enviar” e-mail com resumo + link e preferências configuráveis estão definidos.
- **Ressalva:** ~~Definir de onde vem o e-mail do destinatário~~ — Incorporado: destino = e-mail do(s) usuário(s) com cliente_id da solicitação (tabela usuarios); regra para múltiplos usuários nas Dev Notes.

---

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Story 3.5, Epic 3
- [Source: _bmad-output/planning-artifacts/bpo360-ep3-communication-and-docs-stories.md] US 3.5
- [Source: _bmad-output/planning-artifacts/prd/6-requisitos-funcionais.md] RF-09 (contexto de solicitações)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **Opção A (MVP):** Ponto de extensão sem envio real de e-mail. `notificarClienteSolicitacaoAtualizada` verifica origem=cliente, preferências e flag `NOTIFICACOES_EMAIL_ATIVO`; obtém e-mails dos usuários cliente_final; chama `enviarNotificacaoSolicitacaoAtualizada` (log em dev). O payload agora documenta resumo e caminho do portal para a implementação futura do envio real.
- **Task 1:** POST /api/solicitacoes/[solicitacaoId]/comentarios criado; PATCH em /api/solicitacoes/[solicitacaoId] para status. Ambos disparam o hook após persistência quando origem=cliente.
- **Task 2:** Migration `cliente_preferencias`; GET/PATCH /api/clientes/[clienteId]/preferencias (BPO + cliente_final próprio); GET/PATCH /api/portal/preferencias (cliente_final); UI /portal/preferencias com toggle.
- **Task 3:** Flag `NOTIFICACOES_EMAIL_ATIVO` (env); quando "false" ou "0" o envio é suprimido.
- **Review 2026-03-14:** corrigidos gaps de lint na branch e adicionados testes para garantir o disparo da notificação apenas nos eventos elegíveis.
- 30 testes direcionados da story passando após o review.

### File List

- bpo360-app/supabase/migrations/20260314235000_create_cliente_preferencias.sql
- bpo360-app/src/lib/domain/notificacoes/notificar-cliente-solicitacao.ts
- bpo360-app/src/lib/domain/notificacoes/notificar-cliente-solicitacao.test.ts
- bpo360-app/src/app/api/clientes/[clienteId]/preferencias/route.ts
- bpo360-app/src/app/api/clientes/[clienteId]/preferencias/route.test.ts
- bpo360-app/src/app/api/portal/preferencias/route.ts
- bpo360-app/src/app/api/portal/preferencias/route.test.ts
- bpo360-app/src/app/api/solicitacoes/route.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/route.ts (PATCH + notificação)
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/route.test.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/comentarios/route.ts
- bpo360-app/src/app/api/solicitacoes/[solicitacaoId]/comentarios/route.test.ts
- bpo360-app/src/app/(portal)/portal/page.tsx (link Preferências)
- bpo360-app/src/app/(portal)/portal/preferencias/page.tsx
- bpo360-app/src/app/(portal)/portal/preferencias/_components/preferencias-portal-client.tsx
