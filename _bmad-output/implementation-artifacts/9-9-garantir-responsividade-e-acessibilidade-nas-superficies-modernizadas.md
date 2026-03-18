# Story 9.9: Garantir responsividade e acessibilidade nas superfícies modernizadas

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **usuário do BPO360**,
I want **que as telas modernizadas funcionem bem em desktop e tablet e mantenham padrões fortes de acessibilidade**,
so that **a experiência continue legível, navegável e segura em diferentes contextos de uso**.

## Acceptance Criteria

1. **Given** as superfícies modernizadas do backoffice e portal,
   **When** forem validadas,
   **Then** elas atendem ao alvo WCAG 2.1 AA nas áreas principais e se adaptam corretamente aos breakpoints definidos no UX spec.
   **And** foco visível, navegação por teclado, contraste, labels, estados e layouts colapsados funcionam de forma consistente em desktop e tablet.

2. **Given** o UX spec “Platform Strategy” e “Responsive Design & Accessibility”,
   **When** aplicado às telas do EP9,
   **Then** principais telas otimizadas para monitores ≥ 1024px, com responsividade suficiente para tablet.
   **And** interações de alta frequência confortáveis com mouse e, onde fizer sentido, com atalhos de teclado.

3. **Given** componentes e páginas que já passaram por 9.1–9.8,
   **When** esta story for executada,
   **Then** auditoria e correções de contraste (mínimo AA), foco visível, landmarks e ordem de tab.
   **And** formulários, listas e ações críticas com labels, aria-labels e mensagens de erro associadas.

4. **Given** estados interativos (hover, focus, disabled, loading, selected),
   **When** usados nas superfícies modernizadas,
   **Then** não dependem apenas de cor; há indicação por texto, ícone ou estrutura.
   **And** estados de erro e feedback são anunciáveis (aria-live quando apropriado).

5. **Given** layouts colapsados (sidebar, filtros, painéis) em viewports menores,
   **When** o usuário estiver em tablet ou janela reduzida,
   **Then** navegação e conteúdo principal permanecem utilizáveis; padrões de collapse definidos no UX são respeitados.
   **And** não há perda crítica de funcionalidade ou contexto.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 2)** – Validar breakpoints e responsividade
  - [ ] Documentar ou implementar breakpoints alinhados ao UX spec (desktop ≥ 1024px, tablet).
  - [ ] Revisar telas críticas (Home, Clientes, Hoje, Área de trabalho, portal, login) em larguras mínimas definidas.
  - [ ] Ajustar layouts colapsados (sidebar, filtros) conforme especificação; garantir que conteúdo principal seja utilizável.

- [ ] **Task 2 (AC: 1, 3)** – Auditoria e correções WCAG 2.1 AA
  - [ ] Contraste: verificar razões de contraste em texto e elementos interativos nas áreas principais.
  - [ ] Foco visível: todos os elementos focáveis com outline/ring visível e consistente (tokens 9.1).
  - [ ] Landmarks e estrutura: main, nav, region, headings; ordem de tab lógica.

- [ ] **Task 3 (AC: 3, 4)** – Formulários, listas e ações
  - [ ] Labels associados a inputs; mensagens de erro ligadas aos campos (aria-describedby ou equivalente).
  - [ ] Listas e tabelas com scope, headers e aria-labels onde necessário; sinais e estados com texto/ícone além de cor.
  - [ ] Botões e links com texto acessível; ícones decorativos com aria-hidden ou equivalentes.

- [ ] **Task 4 (AC: 4, 5)** – Estados e anúncios
  - [ ] Revisar uso de aria-live em feedback e mudanças dinâmicas (polite/assertive conforme severidade).
  - [ ] Garantir que loading, empty e error states sejam compreensíveis por leitores de tela.
  - [ ] Documentar checklist manual de contraste e foco para as superfícies EP9 (ou executar e registrar). Entregável de aceite: Checklist de acessibilidade EP9 ou Relatório de auditoria em `_bmad-output/implementation-artifacts/` ou em docs do app.

## Dev Notes

- **Contexto:** Esta story é **transversal**: não implementa novas telas, mas **valida e corrige** responsividade e acessibilidade nas superfícies já modernizadas pelo EP9 (9.1–9.8). Objetivo: WCAG 2.1 AA nas áreas principais; breakpoints e layouts colapsados consistentes; foco, contraste, labels e estados não dependentes só de cor.
- **UX spec:** “Responsive Design & Accessibility”; “Platform Strategy” (desktop-first, ≥ 1024px, tablet); “botões com estados default, hover, focus, disabled, loading”; “foco sempre visível”; “nunca depender apenas de cor”.
- **Dependências:** Todas as stories 9.1–9.8; esta story consolida a qualidade de acessibilidade e responsividade do épico.
- **Arquivos:** Todas as páginas e componentes tocados pelo EP9; possível criação de documento de checklist ou relatório de auditoria em `_bmad-output/implementation-artifacts/` ou em docs do app.
- **Fora de escopo:** Não expandir escopo para telas fora do EP9; não implementar suporte mobile “on the go” além do que já estiver previsto no spec.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform Strategy]
- [Source: _bmad-output/implementation-artifacts/test-design-epic-9.md]

## Dev Agent Record

### Agent Model Used

(Preencher pelo agente de desenvolvimento.)

### File List

(A preencher após implementação.)
