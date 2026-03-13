---
title: BPO360 – Fluxo Operador – Painel Hoje & Modo Foco
relatedDoc: bpo360-information-architecture.md
---

## 1. Visão geral

Este documento descreve o fluxo de navegação e os estados de UI para o operador no BPO360, especificamente:

- **Painel “Hoje”** (`/app/tarefas/hoje`)
- **Modo Foco por cliente** (`/app/foco/:clienteId`)

O objetivo é servir como blueprint direto para o board de Figma (páginas, frames, componentes e variantes).

---

## 2. Página Figma

- **Page:** `02 – BPO360 – Operador – Hoje & Modo Foco`

---

## 3. Painel “Hoje” – `/app/tarefas/hoje`

### 3.1. Frames principais

- **Frame:** `02.01 – Hoje – Default`
- **Frame:** `02.02 – Hoje – Loading`
- **Frame:** `02.03 – Hoje – Empty (sem tarefas)`
- **Frame:** `02.04 – Hoje – Apenas 1 cliente`
- **Frame:** `02.05 – Hoje – Vários clientes (mix de prioridades)`

### 3.2. Componentes & variantes sugeridos

- **Component:** `TopBar/Hoje`
  - `TopBar/Hoje – Default`
  - `TopBar/Hoje – Filtros Abertos`

- **Component:** `Card/ClienteHoje`
  - `Card/ClienteHoje – Normal`
  - `Card/ClienteHoje – Prioridade Alta`
  - `Card/ClienteHoje – Atrasos`
  - `Card/ClienteHoje – Sem Tarefas Hoje`

- **Component:** `ListItem/TarefaHoje`
  - `TarefaHoje – A Fazer`
  - `TarefaHoje – Em Andamento`
  - `TarefaHoje – Atrasada`
  - `TarefaHoje – Concluída`

- **Component:** `CTA/EntrarFoco`
  - `EntrarFoco – Default`
  - `EntrarFoco – Disabled` (quando não há tarefas para aquele cliente)

---

## 4. Modo Foco – `/app/foco/:clienteId`

### 4.1. Frames principais

- **Frame:** `02.10 – Foco – Default`
- **Frame:** `02.11 – Foco – Loading`
- **Frame:** `02.12 – Foco – Sem Tarefas`
- **Frame:** `02.13 – Foco – Tarefa Em Andamento`
- **Frame:** `02.14 – Foco – Tarefa de Conciliação (com F360)`
- **Frame:** `02.15 – Foco – Aviso Troca de Cliente (Modal)`
- **Frame:** `02.16 – Foco – Sem F360 Configurado`
- **Frame:** `02.17 – Foco – Erro F360 (dados financeiros)`

### 4.2. Componentes & variantes sugeridos

- **Component:** `Header/FocoCliente`
  - `Header/Foco – Default`
  - `Header/Foco – Risco Alto`
  - `Header/Foco – Timer Ativo` (mostrando tempo corrido)
  - `Header/Foco – Sem Integração F360`

- **Component:** `Sidebar/TarefasClienteFoco`
  - `Sidebar/Tarefas – Com Lista`
  - `Sidebar/Tarefas – Empty State`
  - Itens:
    - `TarefaFoco – Prioridade Normal`
    - `TarefaFoco – Prioridade Alta`
    - `TarefaFoco – Atrasada`
    - `TarefaFoco – Concluída`

- **Component:** `Panel/TarefaDetalhe`
  - `TarefaDetalhe – Default`
  - `TarefaDetalhe – Com Checklist`
  - `TarefaDetalhe – Bloqueada`
  - `TarefaDetalhe – Somente Leitura`

- **Component:** `Checklist/Item`
  - `ChecklistItem – Pendente`
  - `ChecklistItem – Em Progresso`
  - `ChecklistItem – Concluído`
  - `ChecklistItem – Bloqueado`

- **Component:** `Panel/F360ResumoTarefa`
  - `F360Resumo – Conciliação`
  - `F360Resumo – Pagar/Receber`
  - `F360Resumo – SemDados`
  - `F360Resumo – Erro`

- **Component:** `Controls/Timesheet`
  - `Timesheet – Idle`
  - `Timesheet – Running` (tempo correndo)
  - `Timesheet – Paused`
  - `Timesheet – ManualEntry`

- **Component:** `Modal/AlertaTrocaCliente`
  - `ModalTrocaCliente – Confirmar Saída`
  - `ModalTrocaCliente – Com Opção Pausar Tarefas`

---

## 5. Fluxo de navegação entre frames

No board do Figma, conectar os frames com setas/interactions de protótipo:

- `02.01 – Hoje – Default`  
  → clique em `CTA/EntrarFoco` de um cliente  
  → `02.10 – Foco – Default`.

- `02.10 – Foco – Default`  
  → ação `Sair do modo foco`  
  → retorna para `02.01 – Hoje – Default`.

- `02.10 – Foco – Default`  
  → tentativa de trocar para outro cliente com tarefa em andamento  
  → `02.15 – Foco – Aviso Troca de Cliente (Modal)`.

- `02.14 – Foco – Tarefa de Conciliação (com F360)`  
  → erro em atualização/sincronização  
  → `02.17 – Foco – Erro F360`.

---

## 6. Uso prático no Figma

- Criar a **page** `02 – BPO360 – Operador – Hoje & Modo Foco`.
- Dentro da página:
  - Agrupar frames de `Hoje` e `Foco` em seções visuais separadas.
  - Criar uma `Components Page` (ou usar biblioteca global) para componentes listados acima.
- Referenciar este documento junto com:
  - `bpo360-information-architecture.md` (arquitetura geral).
  - PRD do BPO360 para garantir aderência aos requisitos de fluxo do operador.

