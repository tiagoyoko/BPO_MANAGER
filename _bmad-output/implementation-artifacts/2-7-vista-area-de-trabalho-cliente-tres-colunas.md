# Story 2.7: Vista Área de trabalho do cliente (3 colunas)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Origem: Sprint Change Proposal 2026-03-14 (paginas-requisitos). -->

## Story

As a **operador ou gestor de BPO**,
I want **ver na tela do cliente uma vista "Área de trabalho" em três colunas (Recorrentes | Checklist/Pontuais | Comunicação)**,
so that **eu tenha as tarefas recorrentes, as demandas pontuais e a comunicação com o cliente no mesmo lugar**.

## Acceptance Criteria

1. **Given** o detalhe do cliente em `/clientes/[clienteId]`,
   **When** o usuário acessar a aba ou vista "Área de trabalho",
   **Then** é exibido um layout em três colunas:
   - **Coluna 1 – Tarefas recorrentes:** rotinas diárias, semanais, quinzenais, mensais e anuais; exibição dinâmica por data (ex.: tarefa de sexta só aparece na sexta).
   - **Coluna 2 – Checklist / Tarefas não recorrentes:** demandas pontuais, onboarding (coleta de informações, contratos, certificados, senhas).
   - **Coluna 3 – Comunicação com o cliente:** integração com app (fotos, solicitações, mensagens); até EP3 estar implementado, exibir placeholder claro ("Em construção" ou lista vazia com CTA).

2. **Given** a coluna de tarefas recorrentes,
   **When** a data do dia mudar,
   **Then** apenas as tarefas cuja recorrência cai na data atual são listadas (reutilizar lógica de geração/consulta de tarefas por data).

3. **Given** a coluna de checklist / não recorrentes,
   **When** houver tarefas sem recorrência ou com tipo "pontual"/onboarding,
   **Then** elas são listadas com link para o detalhe da tarefa; filtro ou distinção visual entre "recorrente" e "não recorrente" deve estar disponível na origem dos dados (modelo/rotina).

4. **And** a vista é acessível (estrutura semântica, labels) e utilizável em desktop (≥1024px); colunas podem empilhar em viewport menor.

## Tasks / Subtasks

- [x] **Task 1 (AC: 1, 4)** – Aba ou rota "Área de trabalho"
  - [x] Adicionar aba "Área de trabalho" em `ClienteTabs` (ou rota `/clientes/[clienteId]/area-de-trabalho`) e layout em 3 colunas (grid ou flex).
  - [x] Coluna 3 (Comunicação) com componente placeholder até EP3.
- [x] **Task 2 (AC: 2)** – Coluna 1: tarefas recorrentes por data
  - [x] Consultar tarefas do cliente para a data atual (e opcionalmente período) com filtro "recorrente" (rotina_cliente vinculada a rotina_modelo com periodicidade).
  - [x] Exibir lista com link para `/tarefas/[tarefaId]`.
- [x] **Task 3 (AC: 3)** – Coluna 2: checklist / não recorrentes
  - [x] Consultar tarefas do cliente sem recorrência ou tipo pontual/onboarding; ou usar flag/campo em rotina_modelo ou tarefa para distinguir.
  - [x] Listar com link para detalhe da tarefa.
- [x] **Task 4 (AC: 1, 4)** – Responsividade e acessibilidade
  - [x] Grid responsivo (3 colunas em desktop; empilhar em mobile/tablet); aria-labels nas seções.

## Dependencies

- EP2 (tarefas, rotinas, modelos) para dados.
- EP3 para preencher coluna Comunicação (solicitações, timeline).

---

## Dev Notes

### API existente e critério recorrente vs não recorrente

- **GET** `/api/clientes/[clienteId]/tarefas` já retorna tarefas com `rotinaClienteId: string | null` (ver `TarefaListItem` em `lib/domain/rotinas/types.ts`).
- **Recorrentes:** tarefas com `rotinaClienteId != null` (geradas a partir de uma rotina_cliente).
- **Não recorrentes:** tarefas com `rotinaClienteId == null` (criadas manualmente ou de outro fluxo).
- Para a **data do dia:** usar query params `dataInicio` e `dataFim` iguais à data atual (ex.: "hoje" ou YYYY-MM-DD). A API já suporta isso; filtrar no client ou na API as tarefas por `rotinaClienteId` não nulo para a coluna 1, e nulo para a coluna 2.

### Estrutura de rotas e componentes

- **Opção A (rota dedicada):** Criar `bpo360-app/src/app/(bpo)/clientes/[clienteId]/area-de-trabalho/page.tsx` — Server Component que renderiza um Client Component com as 3 colunas (fetch de tarefas no client ou passar data no server).
- **Opção B (mesma rota com tab):** Manter apenas `/clientes/[clienteId]` e fazer a primeira aba ser "Área de trabalho" em vez de "Resumo"; exige mudança maior de fluxo. Recomendação: **Opção A** (rota `/area-de-trabalho`) e adicionar link em `ClienteTabs`.
- **ClienteTabs:** Adicionar `<Link href={base}/area-de-trabalho">Área de trabalho</Link>` (e opcionalmente colocá-lo como primeira aba). Arquivo: `bpo360-app/src/app/(bpo)/clientes/[clienteId]/_components/cliente-tabs.tsx`.

### Componentes a criar

- **Página:** `app/(bpo)/clientes/[clienteId]/area-de-trabalho/page.tsx` — pode ser um Server Component que busca cliente e passa `clienteId` para o client component.
- **Client da área de trabalho:** `app/(bpo)/clientes/[clienteId]/area-de-trabalho/_components/area-de-trabalho-client.tsx` (ou nome similar) com:
  - Estado: `dataHoje` (YYYY-MM-DD), listas `tarefasRecorrentes`, `tarefasNaoRecorrentes`.
  - Fetch: uma ou duas chamadas a `GET /api/clientes/[clienteId]/tarefas?dataInicio=hoje&dataFim=hoje` (ou data atual); no client, separar por `t.rotinaClienteId != null` vs `== null`.
  - Layout: grid de 3 colunas (ex.: `grid grid-cols-1 lg:grid-cols-3 gap-6`).
- **Coluna 1:** Título "Tarefas recorrentes", lista de tarefas com link para `/tarefas/[tarefaId]`, exibir título, data, status/prioridade se disponível.
- **Coluna 2:** Título "Checklist / Não recorrentes", mesma API, filtrar `rotinaClienteId === null`.
- **Coluna 3:** Placeholder: texto "Comunicação com o cliente (em construção)" e/ou CTA "Solicitações e mensagens em breve (EP3)".

### Padrões do projeto

- Reutilizar tipos `TarefaListItem` de `@/lib/domain/rotinas/types`; não duplicar tipos.
- Seguir padrão de loading/erro das outras páginas de cliente (ex.: `tarefas-cliente-client.tsx` usa `loading`, `tarefas`, feedback toast).
- Tailwind e design tokens existentes; seção com `aria-label` para cada coluna.

### Testes

- Opcional: renderizar a página área-de-trabalho com mock de tarefas e verificar que as colunas 1 e 2 recebem as listas corretas (recorrentes vs não recorrentes).
- Acessibilidade: verificar `aria-label` nas regiões das colunas.

### Referências

- [Source: bpo360-app/src/app/api/clientes/[clienteId]/tarefas/route.ts] — API de tarefas; retorna `rotina_cliente_id`.
- [Source: bpo360-app/src/lib/domain/rotinas/types.ts] — `TarefaListItem` com `rotinaClienteId`.
- [Source: bpo360-app/src/app/(bpo)/clientes/[clienteId]/tarefas/_components/tarefas-cliente-client.tsx] — padrão de fetch e exibição de tarefas.
- [Source: docs/technical/verificacao-features-area-de-trabalho-cliente.md] — checklist de features da área de trabalho.

---

## Dev Agent Record

### Implementation Plan
- **Opção A:** Rota `/clientes/[clienteId]/area-de-trabalho` com Server Component page e Client Component para as 3 colunas.
- Uma única chamada `GET /api/clientes/[clienteId]/tarefas?dataInicio=hoje&dataFim=hoje`; separação no client por `rotinaClienteId != null` (col 1) vs `== null` (col 2).
- Coluna 3: placeholder "Comunicação com o cliente (em construção)" e CTA EP3.
- Grid: `grid-cols-1 lg:grid-cols-3 gap-6`; `aria-label` em cada `<section>`.

### Completion Notes
- Implementado em branch `story/2-7-vista-area-de-trabalho-cliente-tres-colunas` (worktree `.worktrees/story-2-7`) e replicado no repo principal para testes.
- Testes: `area-de-trabalho-client.test.tsx` — separação recorrentes/não recorrentes, aria-labels nas três colunas, placeholder EP3.
- Code review (2026-03-14): Corrigido tratamento de erro no fetch (estado `erro`, mensagem ao usuário, `role="alert"`); adicionado teste para falha de fetch. Branch do worktree usa nav inline em `layout.tsx` (sem `cliente-tabs.tsx`); repo principal pode ter `ClienteTabs` com link Área de trabalho.

### File List
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/_components/cliente-tabs.tsx` (modificado no repo principal: link Área de trabalho)
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/area-de-trabalho/page.tsx` (novo)
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/area-de-trabalho/_components/area-de-trabalho-client.tsx` (novo; code review: estado de erro no fetch)
- `bpo360-app/src/app/(bpo)/clientes/[clienteId]/area-de-trabalho/_components/area-de-trabalho-client.test.tsx` (novo; code review: teste de erro de fetch)
- No worktree: `layout.tsx` do cliente (nav inline) com link Área de trabalho; no principal pode existir `ClienteTabs`.

### Change Log
- 2026-03-15: Story 2.7 implementada — aba Área de trabalho, rota `/area-de-trabalho`, layout 3 colunas (recorrentes | não recorrentes | placeholder Comunicação), grid responsivo e aria-labels.
- 2026-03-14: Code review — tratamento de erro no fetch (estado erro + role alert); teste de falha de fetch; status → done.

---

## References

- `docs/technical/paginas-requisitos-painel-empresas.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-03-14-paginas-requisitos.md`
- `docs/technical/verificacao-fluxo-tela-empresa.md`
