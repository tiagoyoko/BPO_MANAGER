---
title: BPO360 – Design System Foundation
relatedDoc: ux-design-specification.md
---

## 1. Design Tokens

### 1.1 Cores

**Primárias**

- `color.primary.500`: `#2563EB`
- `color.primary.600`: `#1D4ED8`
- `color.primary.50`: `#EFF6FF`

**Neutros**

- `color.neutral.900`: `#0F172A`
- `color.neutral.700`: `#374151`
- `color.neutral.500`: `#6B7280`
- `color.neutral.200`: `#E5E7EB`
- `color.neutral.50`: `#F9FAFB`

**Feedback**

- `color.success.500`: `#16A34A`
- `color.warning.500`: `#F59E0B`
- `color.error.500`: `#DC2626`
- `color.info.500`: `#0EA5E9`

### 1.2 Tipografia

- Família base: **Inter** (ou sans-serif similar)
- `type.display.lg`: 32 / 40 / semibold
- `type.heading.md`: 20 / 28 / semibold
- `type.heading.sm`: 16 / 24 / semibold
- `type.body.md`: 14 / 20 / regular
- `type.body.sm`: 12 / 16 / regular
- `type.label`: 11 / 14 / medium (uppercase opcional)

### 1.3 Espaçamento e raios

- `space.1`: 4 px
- `space.2`: 8 px
- `space.3`: 12 px
- `space.4`: 16 px
- `space.6`: 24 px

- `radius.sm`: 4 px
- `radius.md`: 8 px
- `radius.lg`: 12 px

---

## 2. Componentes Base (para Figma)

### 2.1 Shell de Aplicação

- `AppShell/Header`
  - Logo + nome `BPO360`
  - Título de página + subtítulo
  - Avatar de usuário + ações globais
- `AppShell/SideNav`
  - Itens principais: Home, Hoje, Clientes, Integrações, Timesheet, Admin
- `AppShell/SideNavItem`
  - Estados: default, hover, active

### 2.2 Layout e Conteúdo

- `Card/Base`
  - Variantes: `Card/Section`, `Card/Metric`
- `Table/Header`
- `Table/Row.Compact`
  - Usada para: clientes, tarefas, timesheet, logs

### 2.3 Status, Filtros e Chips

- `Chip/Status`
  - `default`, `success`, `warning`, `error`
- `Chip/Priority`
  - `low`, `medium`, `high`, `urgent`
- `Chip/Risk`
  - `ok`, `attention`, `critical`
- `Filter/Chip`
  - Para filtros rápidos (cliente, tipo de tarefa, prioridade)

### 2.4 Inputs e Botões

- `Button/Primary`
- `Button/Secondary`
- `Button/Ghost`
- `Input/Text`
- `Input/Search`
- `Select/Dropdown`

### 2.5 Feedback

- `Banner/Inline`
  - Tipos: info, success, warning, error
- `Toast/Base`

---

## 3. Telas Prioritárias para Figma

- **Painel Hoje (`/app/tarefas/hoje`)**
  - Usa: AppShell, Cards, Table/Row.Compact, Chip/Risk, Filter/Chip, Button/Primary
- **Modo Foco (`/app/foco/:clienteId`)**
  - Usa: AppShell, lista de tarefas compacta, Card/Checklist, Card/Metric (dados F360), Card/Timesheet, Banner/Inline

Este documento serve como ponto de partida para criar o arquivo de **Design System BPO360** no Figma, usando estes tokens e componentes como base da biblioteca.

