# Story 9.5: Refatorar o painel Hoje para fila operacional priorizada

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **operador de BPO**,
I want **que o painel Hoje me mostre uma fila clara e priorizada por cliente e tarefa**,
so that **eu saiba imediatamente onde agir primeiro**.

## Acceptance Criteria

1. **Given** a tela Hoje com tarefas agrupadas por cliente,
   **When** a nova versão for aplicada,
   **Then** o painel destaca prioridade, urgência, contexto do cliente e ação clara de entrar em foco.
   **And** a leitura do dia acontece em poucos segundos, com baixa carga cognitiva.

2. **Given** a fundação 9.1, AppShell 9.2 e componentes 9.3 (HealthSignal, KPI Insight Card),
   **When** o painel Hoje for refatorado,
   **Then** ele reutiliza tokens, shell e sinais operacionais.
   **And** a fila usa a mesma gramática visual de prioridade, SLA e “próxima ação” que o restante do EP9.

3. **Given** o componente “Today Queue Panel” (UX spec),
   **When** implementado na tela Hoje,
   **Then** há cabeçalho com filtros rápidos, grupos por cliente, contador, indicação de urgência e CTA de entrar em foco.
   **And** sempre fica claro por que um item está naquela posição (prioridade/urgência).

4. **Given** a jornada “Operador executa o dia em modo foco” (UX spec),
   **When** o operador estiver no painel Hoje,
   **Then** ele vê fila de clientes e tarefas do dia com priorização sugerida.
   **And** selecionar cliente e “entrar na Área de trabalho / Modo foco” é um passo óbvio (um clique).

5. **Given** acessibilidade como requisito transversal,
   **When** a fila for usada por teclado e leitores de tela,
   **Then** atualização da fila é anunciável (aria-live quando fizer sentido); foco consistente ao navegar na fila.
   **And** CTA de entrar em foco é acessível e identificável.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 3)** – Definir hierarquia da fila Hoje
  - [ ] Mapear dados disponíveis: tarefas do dia, agrupamento por cliente, prioridade, SLA, responsável.
  - [ ] Documentar (ou alinhar com produto) a regra de ordenação padrão da fila (ex.: SLA mais curto primeiro, depois prioridade); registrar em Dev Notes.
  - [ ] Implementar ou ajustar ordenação/filtros para “fila priorizada” (prioridade, urgência, contexto do cliente).
  - [ ] Garantir cabeçalho com filtros rápidos, contador e CTA “Entrar em foco” por cliente/grupo.

- [ ] **Task 2 (AC: 2)** – Integrar HealthSignal e linguagem visual EP9
  - [ ] Usar HealthSignal para prioridade, SLA e estado de tarefa/cliente quando os componentes existirem (9.3).
  - [ ] Alinhar estados visuais (normal, sem tarefas, sobrecarregado, filtrado, loading) ao UX spec “Today Queue Panel”.

- [ ] **Task 3 (AC: 3, 4)** – Refatorar layout e entrada em foco
  - [ ] Grupos por cliente com indicação de urgência e ação clara de entrar na área de trabalho.
  - [ ] Link/navegação para `/[clienteId]/area-de-trabalho` (ou modo foco) preservando contexto “Hoje”.
  - [ ] Leitura do dia em poucos segundos: hierarquia tipográfica e densidade controlada.

- [ ] **Task 4 (AC: 5)** – Acessibilidade
  - [ ] Landmarks e aria-labels na região da fila; foco e ordem de tab lógicos.
  - [ ] Estados de prioridade/urgência não dependem só de cor (texto/ícone).
  - [ ] Testar navegação por teclado e anúncio de mudanças quando aplicável.

## Dev Notes

### Contexto funcional e de UX

- O **painel Hoje** hoje agrupa tarefas por cliente; o objetivo é torná-lo **fila operacional priorizada**: o operador deve saber “onde agir primeiro” e entrar em foco com um clique (UX spec: “Hoje deixa de ser apenas agrupamento e vira fila operacional guiada”).
- UX spec “Today Queue Panel”: cabeçalho com filtros rápidos, grupos por cliente, contador, urgência, CTA de entrar em foco. States: normal, sem tarefas, sobrecarregado, filtrado, loading.
- Jornada operador: Painel Hoje → ver fila de clientes e tarefas do dia → selecionar cliente recomendado → Entrar na Área de trabalho / Modo foco.

### Dependências

- **9.1, 9.2, 9.3**: tokens, AppShell, HealthSignal/KPI. **9.4**: triagem de clientes (contexto de carteira); esta story foca na tela Hoje apenas — se 9.4 e 9.5 forem feitas em paralelo, definir se o Hoje depende de algo específico da triagem (ex.: mesmo HealthSignal) ou apenas de 9.1–9.3.

### Estado atual do código

- **Página:** `bpo360-app/src/app/(bpo)/tarefas/hoje/page.tsx`
- **Cliente:** `tarefas/hoje/_components/tarefas-hoje-client.tsx` — estado, fetch de tarefas do dia, agrupamento, lista.
- API/rotas de tarefas do dia conforme existentes no projeto.

### Arquivos prováveis a tocar

```text
bpo360-app/src/app/(bpo)/tarefas/hoje/page.tsx
bpo360-app/src/app/(bpo)/tarefas/hoje/_components/tarefas-hoje-client.tsx
bpo360-app/src/components/health-signal.tsx
bpo360-app/src/components/kpi-insight-card.tsx
```

### Fora de escopo

- Não implementar o Focus Workspace completo (9.6); apenas garantir que o CTA do Hoje leve à área de trabalho existente.
- Não redesenhar a área de trabalho nesta story.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Today Queue Panel]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Operador executa o dia em modo foco]
- [Source: _bmad-output/implementation-artifacts/9-4-refatorar-a-tela-de-clientes-para-triagem-de-carteira.md]

## Dev Agent Record

### Agent Model Used

(Preencher pelo agente de desenvolvimento.)

### Completion Notes List

(A preencher após implementação.)

### File List

(A preencher após implementação.)
