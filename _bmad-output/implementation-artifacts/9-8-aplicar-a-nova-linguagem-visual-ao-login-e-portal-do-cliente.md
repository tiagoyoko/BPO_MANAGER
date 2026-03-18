# Story 9.8: Aplicar a nova linguagem visual ao login e portal do cliente

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **cliente final ou usuário autenticando no sistema**,
I want **uma experiência visual mais clara, confiável e acolhedora no login e portal**,
so that **eu perceba consistência com o produto sem herdar a densidade operacional do backoffice**.

## Acceptance Criteria

1. **Given** as telas de login e portal,
   **When** a nova linguagem visual for aplicada,
   **Then** elas passam a usar a mesma fundação de tokens, componentes e hierarquia do produto, com menor densidade e maior apoio contextual.
   **And** a experiência do portal continua distinta do backoffice, porém coerente com a identidade geral do BPO360.

2. **Given** a direção “Direction 03 — Workspace de Foco” e “portal do cliente seguindo a mesma identidade, mas com outra cadência” (UX spec),
   **When** o login e o portal forem estilizados,
   **Then** menor densidade, mais apoio textual e leitura menos agressiva que o backoffice.
   **And** AppShell em variante `portal` se já existir, ou layout próprio coerente com tokens 9.1.

3. **Given** a tela de login atual (`/(public)/login`),
   **When** refatorada,
   **Then** usa tokens de cor, tipografia e espaçamento; estados de erro e loading alinhados a 9.7.
   **And** formulário e feedback de autenticação seguem padrões de acessibilidade (labels, erro associado, foco).

4. **Given** as páginas do portal (solicitações, preferências, detalhe de solicitação, etc.),
   **When** a linguagem visual for aplicada,
   **Then** mesmos tokens e primitives (Button, Card, Input, etc.) com densidade e hierarquia adequadas ao portal.
   **And** navegação e contexto do portal permanecem claros (onde estou, o que posso fazer).

5. **Given** acessibilidade,
   **When** login e portal forem usados por teclado e leitores de tela,
   **Then** landmarks, ordem de tab e mensagens de erro de autenticação acessíveis.
   **And** contraste e foco visível atendem ao que for definido para o produto.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 3)** – Aplicar tokens e componentes ao login
  - [ ] Refatorar `(public)/login/page.tsx` (e componentes associados) para usar design tokens 9.1.
  - [ ] Estados de erro e loading consistentes com 9.7; linguagem de negócio em mensagens de auth.
  - [ ] Manter ou melhorar acessibilidade do formulário (labels, aria, foco).

- [ ] **Task 2 (AC: 1, 2, 4)** – Aplicar linguagem visual ao portal do cliente
  - [ ] Layout do portal: variante `portal` do AppShell ou layout próprio com mesma identidade e menor densidade.
  - [ ] Páginas: portal (home), solicitacoes (lista, nova, detalhe), preferencias — usar tokens, Button, Card, Input, padrões de feedback.
  - [ ] Garantir que a experiência seja distinta do backoffice (menos densa) mas coerente (mesma fundação visual).

- [ ] **Task 3 (AC: 4, 5)** – Consistência e acessibilidade
  - [ ] Revisar navegação e contexto (breadcrumb ou equivalente) no portal.
  - [ ] Revisar landmarks, ordem de tab e contraste nas telas de login e portal.
  - [ ] Documentar decisões de “menor densidade” (espaçamento, hierarquia) para o portal.

## Dev Notes

- **Contexto:** Login em `app/(public)/login/page.tsx`; portal em `app/(portal)/portal/` (page, solicitacoes, preferencias). Objetivo: aplicar **nova linguagem visual** (tokens 9.1, componentes EP9, padrões 9.7) com **menor densidade** e **maior apoio contextual** no login e portal, sem virar cópia do backoffice.
- **Critério quando 9.2 não entregar variante portal:** Se a story 9.2 não implementar a variante `portal` do AppShell, esta story implementa o layout do portal com tokens 9.1 e mesma identidade visual, sem exigir componente AppShell compartilhado — layout próprio coerente com a fundação.
- **UX spec:** “Aplicar a linguagem ao portal — login, home do portal, solicitações, preferências — com menor densidade e mais acolhimento visual”; “Direction mais leve e acolhedora para login e portal do cliente final”.
- **Dependências:** 9.1 (tokens), 9.2 (AppShell se variante portal), 9.7 (feedback/erro/loading).
- **Arquivos prováveis:** `bpo360-app/src/app/(public)/login/page.tsx`, `bpo360-app/src/app/(portal)/portal/page.tsx`, `portal/solicitacoes/**`, `portal/preferencias/**`, componentes compartilhados de formulário e feedback.
- **Fora de escopo:** Não alterar fluxos de autenticação ou permissões; não redesenhar conteúdo das páginas do portal, apenas a apresentação visual.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Implementation Approach]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/implementation-artifacts/9-7-padronizar-feedback-estados-vazios-erro-e-loading.md]

## Dev Agent Record

### Agent Model Used

(Preencher pelo agente de desenvolvimento.)

### File List

(A preencher após implementação.)
