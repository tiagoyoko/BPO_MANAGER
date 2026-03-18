# Story 9.3: Criar sinais operacionais e cards de insight

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor ou operador de BPO**,
I want **ver risco, sync, prioridade, SLA e KPIs usando a mesma linguagem visual**,
so that **eu entenda estado e prioridade sem precisar reinterpretar cada tela**.

## Acceptance Criteria

1. **Given** os estados operacionais e financeiros definidos no UX spec,
   **When** os componentes `HealthSignal` e `KPI Insight Card` forem implementados,
   **Then** status, prioridade, integração e indicadores passam a usar componentes semânticos padronizados.
   **And** cada estado combina cor, texto e estrutura, sem depender apenas de cor para ser compreendido.

2. **Given** as superfícies críticas já existentes do produto,
   **When** os componentes forem aplicados,
   **Then** eles suportam os casos de uso imediatos de `Home`, `Clientes`, `Hoje`, `Área de trabalho` e estados de integração F360.
   **And** a API dos componentes é genérica o suficiente para reuso nas próximas stories do EP9 sem duplicação de variantes.

3. **Given** a fundação visual da `9.1` e o `AppShell` da `9.2`,
   **When** os novos componentes forem introduzidos,
   **Then** eles reutilizam os design tokens e primitives existentes.
   **And** não criam novas convenções paralelas de badge, alert, KPI ou chips fora do padrão do design system.

4. **Given** acessibilidade como requisito transversal,
   **When** os componentes forem renderizados,
   **Then** todos os estados críticos permanecem distinguíveis com texto, ícone e estrutura além da cor.
   **And** foco, semântica e leitura por teclado/leitor de tela continuam viáveis.

5. **Given** o produto já tem indicadores e status em telas diferentes,
   **When** esta story for concluída,
   **Then** fica definido um padrão visual único para:
   - risco
   - prioridade
   - SLA
   - integração/sync
   - KPI numérico
   - loading/empty/error em cards de insight

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 3, 4, 5)** – Criar o componente `HealthSignal`
  - [ ] Definir API do componente para representar estados como `success`, `neutral`, `warning`, `danger`, `blocked`, `syncing`.
  - [ ] Implementar variantes compacta, inline e badge/chip conforme previsto no UX spec.
  - [ ] Garantir suporte a texto, ícone opcional e classes semânticas coerentes com os tokens da `9.1`.

- [ ] **Task 2 (AC: 1, 2, 3, 5)** – Criar o componente `KPI Insight Card`
  - [ ] Definir estrutura com label, valor principal, contexto secundário, estado e affordance opcional de drill-down.
  - [ ] Implementar estados `normal`, `destaque`, `warning`, `danger`, `loading` e `empty`.
  - [ ] Garantir que o componente funcione tanto em visão executiva (`Home`, carteira) quanto em contexto operacional/F360.

- [ ] **Task 3 (AC: 2, 3, 5)** – Mapear e substituir sinais visuais ad hoc existentes
  - [ ] Por tela (Home, Clientes, Hoje, Área de trabalho, F360), listar onde `HealthSignal` e `KPI Insight Card` serão aplicados nesta story e o que fica para 9.4, 9.5 ou 9.6; documentar em Dev Notes.
  - [ ] Identificar usos atuais de badges/status em `Clientes`, `Hoje`, `Área de trabalho`, Home e páginas relacionadas ao ERP.
  - [ ] Substituir o que fizer sentido por `HealthSignal` e `KPI Insight Card` sem refatorar toda a tela estruturalmente.
  - [ ] Documentar lacunas que permanecerão para stories futuras do EP9.

- [ ] **Task 4 (AC: 2, 4)** – Garantir acessibilidade e semântica dos componentes
  - [ ] Garantir que estados críticos não dependam só de cor.
  - [ ] Validar contraste e foco quando usados em links, cards clicáveis ou agrupamentos navegáveis.
  - [ ] Manter semântica adequada para leitura de KPIs e estados por tecnologias assistivas.

- [ ] **Task 5 (AC: 2, 5)** – Preparar os componentes para evolução futura
  - [ ] Estruturar os componentes de forma composável para uso nas próximas stories `9.4`, `9.5` e `9.6`.
  - [ ] Evitar acoplamento a uma tela única ou a um payload específico de API.
  - [ ] Critério de aceite: props tipadas e exemplos de uso em pelo menos 2 contextos (ex.: lista de clientes e painel Hoje).

## Dev Notes

### Contexto funcional e de UX

- Esta story materializa dois componentes centrais previstos no UX spec:
  - `HealthSignal`
  - `KPI Insight Card`
- Eles são a gramática visual para risco, status operacional, sync F360, prioridade, SLA e leitura de KPI.
- O objetivo é eliminar a proliferação de badges e cards ad hoc antes da refatoração pesada das telas de `Clientes`, `Hoje` e `Focus Workspace`.

### Dependências explícitas

- A `9.3` depende conceitualmente da `9.1` para tokens semânticos.
- Deve encaixar naturalmente na estrutura do `AppShell` da `9.2`, mas não precisa esperar o shell estar visualmente finalizado para ser implementada.

### Estado atual relevante do código

- Existem primitives genéricos em `src/components/ui/` (`Badge`, `Card`, `Button`) mas eles ainda não representam a semântica de domínio necessária para risco, prioridade, sync e KPI.
- A tela `Clientes` já usa badges/status locais e classes manuais para estado operacional e ERP.
- `Hoje` e `Área de trabalho` usam `Badge` e `Card`, mas sem uma linguagem transversal de estados.
- `Home` já tem dashboard numérico e é um candidato imediato para reaproveitar `KPI Insight Card`.

### Arquitetura e padrões obrigatórios

- Reutilizar a base de primitives e tokens já definidos; construir uma camada de **componentes de domínio**, não um segundo design system.
- Componentes devem ser composáveis e independentes de uma API específica.
- O componente de KPI não deve assumir acoplamento obrigatório com navegação, mas pode suportar affordance de clique quando necessário.
- O componente de sinal operacional deve ser pequeno, previsível e semanticamente claro.

### Padrões TypeScript / Next.js que o dev agent deve seguir

- Implementar props tipadas explicitamente, sem `any`.
- Se surgir necessidade de schemas ou ajustes em APIs para suportar novo payload/UI, usar:
  - `bpo360-app/src/types/api.ts`
  - `bpo360-app/src/lib/api/schemas/`
  - `bpo360-app/docs/typescript-recommendations.md`
- Qualquer alteração em route body deve usar Zod com `parseBody`, `jsonSuccess` e `jsonError`.

### Arquivos prováveis a tocar

```text
bpo360-app/src/components/ui/badge.tsx
bpo360-app/src/components/ui/card.tsx
bpo360-app/src/components/
bpo360-app/src/app/(bpo)/_components/
bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx
bpo360-app/src/app/(bpo)/tarefas/hoje/_components/tarefas-hoje-client.tsx
bpo360-app/src/app/(bpo)/page.tsx
bpo360-app/src/app/(bpo)/clientes/[clienteId]/area-de-trabalho/_components/area-de-trabalho-client.tsx
```

Arquivos adicionais prováveis:

```text
bpo360-app/src/components/health-signal.tsx
bpo360-app/src/components/kpi-insight-card.tsx
bpo360-app/src/lib/ui/
```

### Superfícies imediatas de adoção sugeridas

- Home/dashboard resumo
- lista de clientes
- painel Hoje
- área de trabalho
- estados de integração/configuração ERP/F360

### Fora de escopo explícito

- Não refatorar completamente as telas `Clientes`, `Hoje` ou `Área de trabalho`; isso é foco das stories seguintes.
- Não implementar ainda o `Focus Workspace` completo.
- Não redesenhar o portal do cliente.
- Não transformar esta story em redesign estrutural de navegação.

### Estratégia de testes

- Testes de componente para variantes e estados principais de `HealthSignal`.
- Testes de componente para `KPI Insight Card`, cobrindo valor, label, estado, loading e empty.
- Smoke tests nas superfícies onde componentes forem plugados.
- Validação de contraste e legibilidade nos estados críticos.

### Project Structure Notes

- Preferir componentes compartilhados em `src/components/` quando o uso for transversal entre áreas do produto.
- Manter as integrações de tela mínimas nesta story; o foco é consolidar a camada reutilizável.
- Se o `Badge` atual continuar como primitive, evitar inflar sua responsabilidade; os novos componentes devem encapsular semântica de domínio.

### References

- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#Visual-Design-Foundation]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design--Accessibility]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-directions.html]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/implementation-artifacts/9-1-design-tokens-e-fundacao-visual-global.md]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/implementation-artifacts/9-2-criar-appshell-para-o-backoffice-bpo.md]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/bpo360-app/docs/typescript-recommendations.md]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/bpo360-app/src/types/api.ts]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada a partir da `9.3` definida no EP9
- Contexto analisado: `epics.md`, stories `9.1` e `9.2`, spec de UX e componentes atuais

### Completion Notes List

- A story foi posicionada como camada de componentes de domínio entre a fundação visual (`9.1`) e a refatoração das telas (`9.4+`).
- O foco foi manter `Badge` e `Card` como primitives, com `HealthSignal` e `KPI Insight Card` encapsulando a semântica de negócio.

### File List

- _bmad-output/implementation-artifacts/9-3-criar-sinais-operacionais-e-cards-de-insight.md

