---
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan']
lastStep: 'step-04-coverage-plan'
lastSaved: '2026-03-16'
epic: 'epic-9'
---

# Test Design Progress — Epic 9: Modernização Visual e Design System

## Step 01 — Detect Mode

- **Mode:** Epic-Level
- **Reason:** `sprint-status.yaml` found in implementation_artifacts
- **Available inputs:** sprint-status.yaml, story files, architecture.md, PRD, UX spec

## Step 02 — Load Context

- **Epic:** EP9 — Modernização Visual e Design System (9 stories: 9.1–9.9)
- **Stack:** Fullstack — Next.js 15 + React + TypeScript + Tailwind CSS + Supabase
- **Test framework:** Vitest + @testing-library/react (jsdom) — 49 arquivos existentes
- **Playwright/E2E:** Não configurado
- **Cobertura existente EP9:** ZERO testes para UI primitives ou tokens CSS
- **Fragmentos carregados:** risk-governance, probability-impact, test-levels-framework, test-priorities-matrix

## Step 03 — Risk Assessment

| # | Risco | Cat | P | I | Score |
|---|-------|-----|---|---|-------|
| R1 | Regressão visual global por mudança de tokens | TECH | 3 | 3 | **9** 🔴 |
| R2 | Violação WCAG AA sem automação de contraste | BUS | 2 | 3 | **6** 🟠 |
| R3 | Build Next.js falha (cacheComponents issue) | OPS | 2 | 3 | **6** 🟠 |
| R4 | Sem cobertura automatizada de UI primitives | TECH | 3 | 2 | **6** 🟠 |
| R5 | Tokens dark/light inconsistentes | TECH | 2 | 2 | **4** 🟡 |
| R6 | AppShell 9.2 quebra landmarks semânticos | BUS | 2 | 2 | **4** 🟡 |
| R7 | Conflito Tailwind extend.colors | TECH | 1 | 2 | **2** 🟢 |
| R8 | CSS custom properties browser compat | OPS | 1 | 2 | **2** 🟢 |
