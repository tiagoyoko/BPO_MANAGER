# Story 9.7: Padronizar feedback, estados vazios, erro e loading

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **usuário do sistema**,
I want **receber feedback e ver estados vazios/erro/loading de forma consistente em todas as telas**,
so that **eu entenda rapidamente o que aconteceu e qual o próximo passo**.

## Acceptance Criteria

1. **Given** os padrões de UX definidos para feedback e recovery state,
   **When** forem aplicados ao produto,
   **Then** toasts, banners, empty states, no-results, loading e mensagens de erro usam a mesma gramática visual e textual.
   **And** erros relevantes permanecem legíveis e acionáveis, com linguagem de negócio e orientação de recuperação.

2. **Given** o componente “Empty / Error / Recovery State” (UX spec),
   **When** implementado e aplicado nas superfícies críticas,
   **Then** anatomy: título, descrição curta, estado visual, ação recomendada.
   **And** states: empty, no-results, error, permission, integration-issue; variants: inline, full-page, card.

3. **Given** os “Feedback Patterns” (UX spec),
   **When** o sistema exibir sucesso, erro, warning ou info,
   **Then** combina cor, texto e ícone; toasts para confirmações rápidas; banners inline para estados persistentes.
   **And** erro relevante não desaparece sem permitir leitura; feedback de sync/integração informa estado atual e ação disponível.

4. **Given** acessibilidade,
   **When** feedback e estados de erro forem exibidos,
   **Then** aria-live conforme severidade; não depender só da cor; mensagens curtas e acionáveis em linguagem de negócio.
   **And** associação correta entre contexto do problema e mensagem.

5. **Given** as telas já modernizadas ou em uso (Clientes, Hoje, Área de trabalho, listas, formulários),
   **When** esta story for concluída,
   **Then** componentes de empty, no-results, error e loading estão padronizados e reutilizados onde fizer sentido.
   **And** não há padrões ad hoc por página que contradigam a gramática definida.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 3)** – Consolidar padrões de feedback (toast, banner, inline)
  - [ ] Revisar `FeedbackToast` em `bpo360-app/src/components/feedback/feedback-toast.tsx` e uso atual; alinhar a “Feedback Patterns” (success, error, warning, info).
  - [ ] Definir ou implementar banner inline para estados persistentes e bloco persistente de erro quando necessário.
  - [ ] Garantir comportamento: sucesso efêmero pode sumir; erro relevante permanece legível; warning com próximo passo.

- [ ] **Task 2 (AC: 2, 5)** – Componente Empty / Error / Recovery State
  - [ ] Criar componente reutilizável (ou conjunto) para empty, no-results, error, permission, integration-issue.
  - [ ] Variants: inline, full-page, card; anatomy: título, descrição, estado visual, ação recomendada.
  - [ ] Diretrizes de conteúdo: evitar tecnicismo e culpa do usuário; sempre oferecer saída prática.

- [ ] **Task 3 (AC: 1, 5)** – Padronizar loading
  - [ ] Estados de loading consistentes (skeleton, spinner ou texto “Carregando…”) usando tokens e primitives EP9.
  - [ ] Botões com estado loading quando aplicável (substituir rótulo ou indicador sem quebrar layout).
  - [ ] Aplicar em listas críticas (Clientes, Hoje, Área de trabalho, solicitações) onde ainda houver padrão ad hoc.

- [ ] **Task 4 (AC: 4)** – Acessibilidade e aria-live
  - [ ] Uso de aria-live para feedback crítico conforme severidade.
  - [ ] Mensagens de erro associadas ao contexto (campo, bloco, página); foco e ordem de tab coerentes.
  - [ ] Não depender apenas de cor; texto e ícone sempre que fizer sentido.

## Dev Notes

- **Contexto:** O produto já usa `FeedbackToast` em vários lugares; existem estados locais de “Carregando…”, “Nenhum resultado”, mensagens de erro inline. **Fallback para 9.6/9.8:** Se 9.6 ou 9.8 forem implementadas antes desta story, usar FeedbackToast e padrão atual como baseline; esta story unifica e substitui depois. Objetivo: **padronizar** toasts, banners, empty, no-results, error e loading com uma gramática única (UX spec “Empty / Error / Recovery State” e “Feedback Patterns”).
- **UX spec:** Empty/Error/Recovery — states empty, no-results, error, permission, integration-issue. Feedback — success, error, warning, info; toasts, banners inline, bloco persistente de erro, estado contextual de sync.
- **Dependências:** 9.1 (tokens); 9.2/9.3 quando componentes forem usados em mensagens ou estados visuais.
- **Arquivos prováveis:** `bpo360-app/src/components/feedback/feedback-toast.tsx`, novos componentes em `src/components/` para empty/error/loading, páginas que hoje exibem loading/empty/erro de forma ad hoc (clientes, hoje, area-de-trabalho, solicitacoes, etc.).
- **Fora de escopo:** Não redesenhar fluxos de negócio; apenas garantir que a *apresentação* de feedback e estados seja consistente.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty / Error / Recovery State]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]

## Dev Agent Record

### Agent Model Used

(Preencher pelo agente de desenvolvimento.)

### File List

(A preencher após implementação.)
