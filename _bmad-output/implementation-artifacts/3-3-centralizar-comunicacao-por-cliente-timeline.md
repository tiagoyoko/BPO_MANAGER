# Story 3.3: Centralizar comunicação por cliente (timeline)

Status: review

<!-- Validação opcional: executar validate-create-story antes de dev-story. -->

## Story

As a **gestor ou operador de BPO**,
I want **ver uma timeline única por cliente com solicitações, comentários e documentos**,
so that **eu entenda o histórico de comunicação e o contexto das decisões**.

## Acceptance Criteria

1. **Given** a visão “Comunicação” do cliente,
   **When** o usuário abre a timeline,
   **Then** são exibidos eventos em ordem cronológica (solicitação criada, comentário adicionado, documento anexado, mudança de status) com tipo de evento, autor (interno ou cliente) e data/hora.
2. **And** há filtros por tipo de evento (ex.: só solicitações, só documentos, só comentários).

## Tasks / Subtasks

- [x] **Task 1** – Modelo de comentários e histórico de status
  - [x] Criar tabela `comentarios`: id, bpo_id, solicitacao_id, autor_id (FK usuarios), texto, created_at. RLS: mesmo bpo_id e visibilidade alinhada à solicitação.
  - [x] Opção A: criar tabela `solicitacao_status_historico` (solicitacao_id, status_anterior, status_novo, alterado_por_id, created_at) e disparar inserção em toda mudança de status. Opção B: considerar apenas “solicitação criada” e “comentário” + “documento anexado” como eventos e derivar “mudança de status” de log futuro ou coluna updated_at + status atual (mostrar “Status: X” no card). **Escolhido Opção B**: eventos de mudança de status omitidos; documentar apenas solicitacao_criada e comentario nesta story. Documento_anexado será adicionado na Story 3.4.
- [x] **Task 2** – API da timeline
  - [x] GET /api/clientes/[clienteId]/timeline (ou GET /api/timeline?clienteId=...): agregar eventos a partir de:
    - Solicitações do cliente: evento “solicitacao_criada” (created_at, titulo, id, autor = criado_por_id ou “cliente” se origem cliente).
    - Comentários: evento “comentario” (created_at, solicitacao_id, texto resumido, autor_id).
    - Documentos: evento “documento_anexado” (created_at, solicitacao_id ou tarefa_id, nome_arquivo, autor_id).
    - Mudança de status: se houver histórico, evento “status_alterado”; senão, omitir ou mostrar apenas status atual na solicitação.
  - [x] Ordenar por data/hora decrescente (mais recente primeiro). Resposta em formato único: { id, tipo, tituloOuResumo, autorTipo, autorNome?, dataHora, entidadeId, entidadeTipo } em array; camelCase.
  - [x] Query params: tipoEvento[] (opcional) para filtrar por solicitacao_criada, comentario, documento_anexado, status_alterado.
- [x] **Task 3** – Visão “Comunicação” na página do cliente
  - [x] Adicionar aba ou seção “Comunicação” na visão do cliente: [Source: architecture] `app/(bpo)/clientes/[clienteId]/timeline/page.tsx` — aba “Comunicação” adicionada no layout.tsx do cliente.
  - [x] Carregar timeline via GET /api/clientes/[clienteId]/timeline (ou equivalente). Exibir lista cronológica de cards/itens: tipo de evento, descrição curta, autor (interno/cliente), data/hora formatada.
  - [x] Filtros na UI: dropdown ou chips por tipo (todas, solicitações, comentários, documentos, mudanças de status). Atualizar lista ao selecionar (client-side).
- [x] **Task 4** – Consistência com lista geral
  - [x] Garantir que eventos da timeline reflitam os mesmos dados da lista de solicitações (Story 3.1) e que novos comentários/documentos (Stories 3.4 e 3.5) apareçam na timeline após implementação.

## Dev Notes

- **Arquitetura:** [Source: architecture.md] Estrutura prevê `app/(bpo)/clientes/[clienteId]/timeline/page.tsx`. Organização por feature; APIs sob `app/api/`; resposta `{ data, error }`.
- **Cliente tabs:** Verificar `clientes/[clienteId]/_components/cliente-tabs.tsx` para adicionar aba “Comunicação” ou “Timeline” sem quebrar rotas existentes (Resumo, Tarefas, Config).
- **Autor interno vs cliente:** Derivar de usuario.role === 'cliente_final' ou de origem da solicitação; exibir “Cliente” ou nome do usuário interno conforme política de privacidade.
- **Performance:** Timeline pode ter muitos itens; considerar paginação (limit/offset ou cursor) no endpoint e na UI (carregar mais ao rolar).

### Project Structure Notes

- Novos: `supabase/migrations/..._create_comentarios.sql`, `app/(bpo)/clientes/[clienteId]/timeline/page.tsx` (ou integração em page.tsx via tab), `app/api/clientes/[clienteId]/timeline/route.ts` (ou `app/api/timeline/route.ts` com clienteId query). Componentes em `clientes/[clienteId]/timeline/_components/` se necessário.

## PM Validation (John)

**Data:** 2026-03-14  
**Status:** ✅ Validado

- **Valor:** Gestor/operador entende histórico e contexto das decisões; timeline única por cliente atende RF-11.
- **AC:** Eventos em ordem cronológica, tipo/autor/data e filtros por tipo estão claros.
- **Ressalva:** “Autor (interno ou cliente)” — garantir que política de exibição de nome (privacidade) esteja decidida na implementação (Dev Notes já citam).

---

### References

- [Source: _bmad-output/planning-artifacts/epics.md] Story 3.3, Epic 3
- [Source: _bmad-output/planning-artifacts/bpo360-ep3-communication-and-docs-stories.md] US 3.3
- [Source: _bmad-output/planning-artifacts/prd/6-requisitos-funcionais.md] RF-11

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **Task 1 (Migration):** Criada `20260314230000_create_comentarios_table.sql` com tabela `comentarios` (bpo_id, solicitacao_id, autor_id, texto, created_at), índices e RLS (SELECT/INSERT para roles internas). Escolhida **Opção B** para status history: não criar tabela de histórico; timeline exibe apenas `solicitacao_criada` e `comentario`. `documento_anexado` será adicionado na Story 3.4.
- **Task 2 (API):** Criado `GET /api/clientes/[clienteId]/timeline` com agregação de solicitações + comentários, ordenação decrescente, paginação (limit/offset) e filtro por `tipoEvento`. 11 testes unitários passando. Autor interno vs cliente derivado de `origem` da solicitação.
- **Task 3 (UI):** Aba "Comunicação" adicionada no `layout.tsx` → `/clientes/[clienteId]/timeline`. Server Component `page.tsx` carrega dados diretamente do Supabase. Componentes client-side: `TimelineList` (estado de filtro), `TimelineFiltros` (chips), `TimelineItem` (card com badge de tipo, autor, data).
- **Task 4 (Consistência):** Timeline lê da mesma tabela `solicitacoes` usada na Story 3.1. Stories 3.4+ devem adicionar eventos nas tabelas correspondentes; a timeline irá refletir automaticamente se o endpoint for estendido.

### File List

- `bpo360-app/supabase/migrations/20260314230000_create_comentarios_table.sql`
- `bpo360-app/src/app/api/clientes/[clienteId]/timeline/route.ts`
- `bpo360-app/src/app/api/clientes/[clienteId]/timeline/route.test.ts`
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/layout.tsx` (adicionada aba Comunicação)
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/timeline/page.tsx`
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/timeline/_components/timeline-filtros.tsx`
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/timeline/_components/timeline-item.tsx`
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/timeline/_components/timeline-list.tsx`

## Change Log

- 2026-03-14: Implementação inicial — migration comentarios, API GET /timeline, aba "Comunicação" no layout, page.tsx Server Component, componentes TimelineList/Filtros/Item com filtros client-side. 251 testes passando (11 novos).
