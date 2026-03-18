---
stepsCompleted: []
lastStep: ''
lastSaved: ''
---

# Test Design: Epic 9 — Modernização Visual e Design System do BPO360

**Data:** 2026-03-16
**Autor:** Tiago
**Status:** Draft

---

## Resumo Executivo

**Escopo:** Plano de testes nível épico para o EP9 — 9 stories (9.1–9.9), cobrindo design tokens, AppShell, componentes de domínio, refatoração de telas críticas, feedback/estados, portal e acessibilidade.

**Resumo de Riscos:**

- Total de riscos identificados: 8
- Riscos de alta prioridade (≥6): 4
- Categorias críticas: TECH (regressão visual global), OPS (build CI), BUS (WCAG AA)

**Resumo de Cobertura:**

- Cenários P0: 10 (~15–25h)
- Cenários P1: 16 (~20–30h)
- Cenários P2: 8 (~8–15h)
- **Esforço total estimado:** ~43–70h (~1,5–2,5 semanas)

> P0/P1/P2/P3 = prioridade e risco, NÃO momento de execução.

---

## Fora de Escopo

| Item | Justificativa | Mitigação |
|------|--------------|-----------|
| Testes mobile (< 768px) | BPO360 é desktop-first; mobile não é alvo nesta fase | Acesso mobile revisado em story futura |
| Testes de API/backend | EP9 é puramente frontend — nenhuma rota de API é alterada | Cobertura de API já existe nas 49 suítes de outros épicos |
| Testes de performance (LCP, CLS) | Sem Playwright ou k6 configurado; fora do escopo de tokens CSS | Avaliar em story 9.9 ou épico posterior |
| Stories 9.2–9.9 (implementação futura) | Apenas 9.1 está implementada; plano antecipa cobertura das demais | Stories criam seus próprios testes; plano orienta o padrão |

---

## Avaliação de Riscos

### Riscos de Alta Prioridade (Score ≥ 6)

| Risk ID | Categoria | Descrição | P | I | Score | Mitigação | Responsável | Prazo |
|---------|-----------|-----------|---|---|-------|-----------|-------------|-------|
| R-001 | TECH | Mudança de CSS tokens (`globals.css`) causa regressão visual silenciosa em todas as telas existentes — sem testes de snapshot para componentes UI | 3 | 3 | **9** | Criar testes de componente (snapshot + render) para os 5 primitives de 9.1; executar suíte completa após cada mudança de tokens | Dev EP9 | Antes de iniciar 9.2 |
| R-002 | BUS | Violação de contraste WCAG AA após troca de tokens — validação foi manual, sem automação de acessibilidade | 2 | 3 | **6** | Integrar `@axe-core/react` ou `jest-axe` nos testes de componente dos primitives e telas principais | Dev 9.1 / 9.9 | Review de 9.1 |
| R-003 | OPS | Build Next.js falha por conflito de config pré-existente (`cacheComponents vs dynamic`) — documentado em Completion Notes de 9.1 e não resolvido | 2 | 3 | **6** | Resolver o erro de configuração do Next.js antes de qualquer deploy em staging ou produção | Dev infra | Imediato |
| R-004 | TECH | Nenhum teste automatizado cobre os primitives UI (`Button`, `Card`, `Badge`, `Input`, `Checkbox`) — stories 9.2–9.9 constroem sobre base sem rede de segurança | 3 | 2 | **6** | Criar suite de testes de componente para os 5 primitives durante ou imediatamente após code review de 9.1 | Dev EP9 | Code review 9.1 |

### Riscos de Prioridade Média (Score 3–4)

| Risk ID | Categoria | Descrição | P | I | Score | Mitigação | Responsável |
|---------|-----------|-----------|---|---|-------|-----------|-------------|
| R-005 | TECH | Tokens `dark:` inconsistentes com `light:` — erros semânticos em HSL são silenciosos e só aparecem em modo escuro | 2 | 2 | 4 | Teste de componente com `dark` class aplicada para verificar contraste; checar par de variáveis CSS | Dev 9.1 |
| R-006 | BUS | AppShell (9.2) pode introduzir landmarks semânticos errados (`main`, `nav`, `aside`) quebrando navegação por teclado | 2 | 2 | 4 | Testes de componente com axe-core e verificação de Tab-order no AppShell | Dev 9.2 |

### Riscos de Baixa Prioridade (Score 1–2)

| Risk ID | Categoria | Descrição | P | I | Score | Ação |
|---------|-----------|-----------|---|---|-------|------|
| R-007 | TECH | `extend.colors` no Tailwind config (success, warning, info) pode conflitar com utilities existentes | 1 | 2 | 2 | Monitorar — verificar durante build |
| R-008 | OPS | CSS custom properties em browsers alvo — suporte moderno é robusto | 1 | 2 | 2 | Monitorar — documentar versões mínimas suportadas |

---

## Critérios de Entrada

- [ ] Story 9.1 passou por code review e está com status `done`
- [ ] Build Next.js executando sem erros (R-003 resolvido)
- [ ] Ambiente de desenvolvimento local funcional (`npm run dev`)
- [ ] Vitest configurado e 49 testes existentes passando

## Critérios de Saída

- [ ] Todos os testes P0 passando (100%)
- [ ] Todos os testes P1 passando (≥95%)
- [ ] Zero violações axe-core nos primitives e telas principais
- [ ] Build CI verde
- [ ] Checklist manual de contraste e foco assinado para cada story do EP9

---

## Plano de Cobertura de Testes

> P0/P1/P2/P3 indicam prioridade e risco, não momento de execução.

### P0 (Crítico)

**Critério:** Bloqueia jornada central + risco ≥ 6 + sem alternativa

| ID | Requisito | Nível | Risk | Responsável | Notas |
|----|-----------|-------|------|-------------|-------|
| TC-001 | Tokens semânticos presentes em `globals.css` — snapshot das variáveis CSS essenciais | Component | R-001 | Dev | Verificar --primary, --background, --foreground, --ring, --destructive, --card, --border |
| TC-002 | `Button` — todas variantes (default, destructive, outline, secondary, ghost, link) e todos sizes renderizam com classes corretas | Component | R-001, R-004 | Dev | Usar snapshot + RTL render |
| TC-003 | `Card` — renderiza com border, rounded e shadow; preserva children | Component | R-001, R-004 | Dev | — |
| TC-004 | `Badge` — variantes default/secondary/destructive/outline preservadas sem regressão | Component | R-001, R-004 | Dev | — |
| TC-005 | `Input` — renderiza com fundo background, foco visível (`focus-visible:ring`), aceita props padrão | Component | R-001, R-004 | Dev | — |
| TC-006 | `Checkbox` — estados checked/unchecked/disabled renderizam; cor de borda muda entre estados | Component | R-001, R-004 | Dev | — |
| TC-007 | Build Next.js passa sem erros de configuração | CI/Build | R-003 | Dev infra | Gate absoluto — bloqueia todo o EP9 |
| TC-008 | AppShell (9.2) renderiza `<nav>`, `<main>` e header com landmarks semânticos corretos | Component | R-006 | Dev 9.2 | axe-core incluso |
| TC-009 | `HealthSignal` (9.3) renderiza todos os estados (ok, warning, error, info) com cor + texto + ícone | Component | R-001 | Dev 9.3 | Nenhum estado transmite info apenas por cor |
| TC-010 | `FeedbackToast` / banners de erro exibem mensagem com `role="status"` ou `aria-live` | Component | R-002 | Dev 9.7 | Pattern já existente em outros épicos |

**Total P0:** 10 cenários | **~15–25h**

### P1 (Alto)

**Critério:** Fluxo importante + risco 3–4 + fluxo comum

| ID | Requisito | Nível | Risk | Responsável | Notas |
|----|-----------|-------|------|-------------|-------|
| TC-011 | `Button` desabilitado não focável; `focus-visible:ring` aparece apenas via teclado | Component | R-002 | Dev | — |
| TC-012 | axe-core zero violações nos 5 primitives (contraste, role, aria) | Component | R-002 | Dev | jest-axe ou @axe-core/react |
| TC-013 | Link ativo na sidebar (9.2) destaca rota atual via `aria-current` + classe visual | Component | R-006 | Dev 9.2 | — |
| TC-014 | Tab-order percorre sidebar → main em sequência lógica; Escape fecha drawer mobile | Component | R-006 | Dev 9.2 | — |
| TC-015 | axe-core zero violações no AppShell completo | Component | R-002, R-006 | Dev 9.2 | — |
| TC-016 | `KPI Insight Card` (9.3) renderiza valor, label e indicador de variação (positivo/negativo) | Component | R-001 | Dev 9.3 | — |
| TC-017 | Tela Clientes renderiza com tokens EP9 sem regressão nos filtros e ações existentes | Component | R-001 | Dev 9.4 | Aproveitar teste existente de `clientes-page-client` |
| TC-018 | Tela Hoje renderiza tarefas com hierarquia visual sem perda de ações interativas | Component | R-001 | Dev 9.5 | — |
| TC-019 | Focus Workspace (9.6) renderiza colunas com tokens EP9 sem regressão de checklist | Component | R-001 | Dev 9.6 | — |
| TC-020 | Empty state exibe label e call-to-action com semântica acessível | Component | R-002 | Dev 9.7 | — |
| TC-021 | Skeleton loading exibe `aria-busy` / `role="status"` durante fetch | Component | R-002 | Dev 9.7 | — |
| TC-022 | Mensagem de erro não expõe código técnico ao usuário (padrão `error.code` → mensagem amigável) | Component | R-002 | Dev 9.7 | Padrão já validado em outros épicos |
| TC-023 | Tela Login renderiza com tokens EP9 e fluxo de auth permanece funcional | Component | R-001 | Dev 9.8 | — |
| TC-024 | Portal do cliente renderiza com tokens EP9 sem regressão de solicitações | Component | R-001 | Dev 9.8 | — |
| TC-025 | axe-core nas telas principais após aplicação completa dos tokens (login, BPO layout, portal) | E2E | R-002 | Dev 9.9 | Nightly — potencialmente mais lento |
| TC-026 | Contraste WCAG AA validado em desktop (≥1280px) e tablet (768–1023px) nas telas críticas | E2E | R-002 | Dev 9.9 | — |

**Total P1:** 16 cenários | **~20–30h**

### P2 (Médio)

**Critério:** Fluxo secundário + risco baixo + casos de borda

| ID | Requisito | Nível | Risk | Notas |
|----|-----------|-------|------|-------|
| TC-027 | Tokens `dark:` aplicados com classe `.dark` — contraste não colapsa | Component | R-005 | Vitest + jsdom |
| TC-028 | Snapshot dos estados visuais principais do `HealthSignal` (golden test) | Component | R-001 | — |
| TC-029 | AppShell colapsa corretamente em viewport 768px sem overflow horizontal | E2E | — | Playwright quando disponível |
| TC-030 | Navegação Clientes → Área de Trabalho preserva contexto e breadcrumb | E2E | — | — |
| TC-031 | Navegação por teclado completa (Tab, Shift+Tab, Enter, Escape) nas telas principais | Manual / E2E | R-002 | Checklist manual por story |
| TC-032 | Breakpoints corretos: ≥1024px desktop, 768–1023px tablet, sem colapso visual | E2E | — | — |
| TC-033 | Telas de login/portal permanecem visualmente distintas do backoffice (densidade menor) | Manual | — | Revisão por story 9.8 |
| TC-034 | Tailwind `extend.colors` (success/warning/info) não conflita com utilities existentes | Build | R-007 | Verificar via `npm run build` |

**Total P2:** 8 cenários | **~8–15h**

---

## Estratégia de Execução

**Filosofia:** Executar todos os testes em PR se < 15 minutos. Deferir somente para Nightly/Semanal quando caro ou manual.

| Momento | O que executa | Critério de aprovação |
|---------|--------------|----------------------|
| **PR** | Todos os testes Vitest (component + unit) — P0 + P1 + P2 Vitest | 100% P0; ≥95% P1 |
| **Nightly** | E2E axe-core (TC-025, TC-026), snapshots visuais (TC-028, TC-029) | 0 violações axe em P0/P1 |
| **Manual (por story)** | Checklist contraste, teclado e tablet físico (TC-031, TC-033) | Checklist assinado antes do merge |

---

## Estimativas de Esforço

| Prioridade | Cenários | Esforço |
|------------|----------|---------|
| P0 | 10 | ~15–25h |
| P1 | 16 | ~20–30h |
| P2 | 8 | ~8–15h |
| **Total** | **34** | **~43–70h (~1,5–2,5 semanas)** |

**Pré-requisitos de tooling:**

- `@testing-library/react` + `vitest` — já configurados
- `jest-axe` ou `@axe-core/react` — adicionar para TC-012, TC-015, TC-025
- `@testing-library/user-event` — para testes de Tab-order e interação de teclado
- Playwright — configurar quando stories de E2E (9.2+) chegarem (TC-025, TC-026, TC-029–TC-032)

---

## Critérios de Quality Gate

- **P0:** 100% de aprovação — pré-requisito para iniciar 9.2
- **P1:** ≥95% de aprovação — pré-requisito para merge de qualquer story EP9
- **axe-core violations = 0** em P0/P1 antes de release
- **Build CI verde** (R-003 resolvido) — gate absoluto e não-negociável
- **Cobertura de branches ≥ 80%** nos novos componentes de domínio (9.3)

---

## Planos de Mitigação

### R-001: Regressão Visual Global (Score: 9)

**Estratégia:**
1. Criar `src/components/ui/button.test.tsx`, `card.test.tsx`, `badge.test.tsx`, `input.test.tsx`, `checkbox.test.tsx` com testes de snapshot e render (TC-002 a TC-006)
2. Executar `npm test` completo após qualquer alteração em `globals.css` ou `tailwind.config.ts`
3. Usar snapshot tests com `@testing-library/react` — qualquer mudança de classe inesperada quebra o snapshot

**Responsável:** Dev EP9
**Prazo:** Code review de 9.1
**Status:** Planejado
**Verificação:** 100% P0 passando; zero snapshots desatualizados sem aprovação consciente

---

### R-002: Violação WCAG AA (Score: 6)

**Estratégia:**
1. Adicionar `jest-axe` como devDependency
2. Incluir `expect(await axe(container)).toHaveNoViolations()` nos testes dos 5 primitives (TC-012)
3. Validar manualmente contraste dos tokens HSL em `globals.css` usando ferramenta de contraste (ex.: WebAIM) antes de cada merge
4. Story 9.9 executará axe-core E2E nas telas principais

**Responsável:** Dev 9.1 (primitives) / Dev 9.9 (telas)
**Prazo:** Code review de 9.1 (primitives); story 9.9 (telas)
**Status:** Planejado
**Verificação:** Zero violações axe em TC-012 e TC-015; checklist de contraste assinado

---

### R-003: Build Next.js com Erro de Configuração (Score: 6)

**Estratégia:**
1. Identificar o conflito `cacheComponents vs dynamic` nas notas de 9.1 (Completion Notes)
2. Corrigir a configuração do Next.js (`next.config.ts`) antes de qualquer deploy
3. Adicionar `npm run build` como gate obrigatório no CI para PRs em `main`

**Responsável:** Dev infra
**Prazo:** Imediato — bloqueia qualquer entrega ao ambiente de staging
**Status:** Planejado
**Verificação:** `npm run build` completa sem erros em CI (TC-007)

---

### R-004: Sem Cobertura de UI Primitives (Score: 6)

**Estratégia:**
1. Durante ou imediatamente após code review de 9.1, criar as 5 suítes de testes para Button, Card, Badge, Input e Checkbox
2. Cobrir: render básico, variantes, estados interativos (hover, focus-visible, disabled), snapshot

**Responsável:** Dev EP9
**Prazo:** Code review de 9.1 (esta mesma sprint)
**Status:** Planejado
**Verificação:** TC-002 a TC-006 passando; PR de 9.1 não mergea sem eles

---

## Interoperabilidade e Regressão

| Componente / Tela | Impacto | Escopo de Regressão |
|-------------------|---------|---------------------|
| `bpo-home-dashboard-client` | Usa Card, Button — mudança de tokens afeta render | Suíte existente já cobre; re-executar após 9.1 |
| `clientes-page-client` | Usa Card, Badge, Button — potencial regressão visual | Suíte existente; adicionar smoke visual se necessário |
| `nova-solicitacao-form` | Usa Input, Button, Label | Suíte existente |
| `FeedbackToast` | Componente de feedback usado em múltiplos épicos | TC-010 / TC-020 |
| Portal (`solicitacoes-portal-client`) | Usa primitives com tokens EP9 | Suíte existente + TC-024 |

---

## Suposições e Dependências

### Suposições

1. O app não será migrado para Storybook nesta fase do EP9; testes de componente via Vitest + RTL são o padrão.
2. A instalação de `jest-axe` ou `@axe-core/react` é aprovada como devDependency sem burocracia adicional.
3. Playwright será configurado na story 9.2 ou antes de qualquer E2E (TC-025–TC-034); stories posteriores dependem disso.
4. Tokens HSL "nus" (ex.: `174 52% 32%`) são a convenção do projeto e os testes devem assumir isso.

### Dependências

1. **R-003 resolvido** — build CI verde — bloqueio absoluto para todas as stories do EP9
2. **Testes de primitives criados (P0)** — devem existir antes do merge de 9.1
3. **`jest-axe` adicionado** — necessário para TC-012 e TC-015 antes de 9.2
4. **Playwright configurado** — necessário antes de 9.3 ou 9.4 para TC-025–TC-034

---

## Apêndice: Referências

### Knowledge Base

- `risk-governance.md` — Framework de classificação e pontuação de risco
- `probability-impact.md` — Escala de probabilidade e impacto (1–3)
- `test-levels-framework.md` — Seleção de nível de teste
- `test-priorities-matrix.md` — Critérios P0–P3

### Documentos Relacionados

- Epic: `_bmad-output/planning-artifacts/epics.md#Epic-9`
- Story 9.1: `_bmad-output/implementation-artifacts/9-1-design-tokens-e-fundacao-visual-global.md`
- UX Spec: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Arquitetura: `_bmad-output/planning-artifacts/architecture.md`

---

## Próximos Workflows (Manual)

- Executar `/bmad-testarch-atdd` para gerar testes P0 falhando (TDD) — especialmente TC-002 a TC-008.
- Executar `/bmad-testarch-framework` para configurar Playwright quando E2E for necessário (story 9.2+).
- Executar `/bmad-testarch-ci` para configurar pipeline com gates de P0 e axe-core.

---

**Gerado por:** BMad TEA Agent — Test Architect Module
**Workflow:** `bmad-testarch-test-design`
**Versão:** 4.0 (BMad v6)
