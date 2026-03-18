# Story 9.4: Refatorar a tela de Clientes para triagem de carteira

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor de BPO**,
I want **que a tela de clientes funcione como superfície de triagem de carteira, e não só como listagem cadastral**,
so that **eu identifique rapidamente clientes críticos e entre no detalhe certo**.

## Acceptance Criteria

1. **Given** a tela de clientes atual,
   **When** a refatoração visual for aplicada,
   **Then** a tela passa a destacar risco, integração, responsável, sinais financeiros e próxima ação de forma hierárquica.
   **And** filtros, busca e navegação preservam contexto e levam ao detalhe mais útil do cliente.

2. **Given** a fundação visual da 9.1, o AppShell da 9.2 e os componentes de domínio da 9.3 (HealthSignal, KPI Insight Card),
   **When** a tela de Clientes for refatorada,
   **Then** ela reutiliza design tokens, shell e sinais operacionais já definidos.
   **And** a listagem/carteira usa a mesma gramática visual de risco, prioridade, integração e indicadores que o restante do EP9.

3. **Given** o gestor na tela de triagem de carteira,
   **When** ele aplicar filtros (risco, margem, responsável, status ERP, tags) ou busca,
   **Then** os filtros são persistentes e legíveis (chips ou controles claros).
   **And** o clique em um cliente leva ao detalhe (Cliente 360) preservando contexto de filtros quando voltar.

4. **Given** a jornada “Gestor acompanha saúde da carteira” (UX spec),
   **When** a tela estiver refatorada,
   **Then** em poucos segundos o gestor enxerga quais clientes exigem atenção (cards/linhas com destaque de risco, margem, integração).
   **And** a hierarquia visual prioriza “o que fazer agora” sem poluir a interface.

5. **Given** acessibilidade como requisito transversal,
   **When** a tela for usada por teclado e leitores de tela,
   **Then** tabela/lista mantém semântica (thead/tbody, scope, aria-labels), sinais não dependem só de cor.
   **And** foco e navegação entre filtros e linhas permanecem viáveis.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 2)** – Definir hierarquia visual da carteira
  - [ ] Mapear dados disponíveis por cliente: status, responsável, erpStatus, receita/indicadores (se existirem na API), risco operacional/financeiro (se modelado).
  - [ ] Documentar em Dev Notes: (1) quais campos da API atual são usados para risco/prioridade; (2) o que é derivado no front; (3) lacunas para backlog (ex.: endpoint de próxima ação).
  - [ ] Decidir layout: tabela densa com colunas de sinais vs. cards vs. híbrido, alinhado ao UX spec (Clientes como triagem, não só listagem).
  - [ ] Garantir que risco, integração, responsável e “próxima ação” tenham peso visual hierárquico (HealthSignal/KPI onde couber, tokens 9.1).

- [ ] **Task 2 (AC: 2, 3)** – Integrar HealthSignal e KPI Insight Card na lista/carteira
  - [ ] Usar `HealthSignal` para status operacional, ERP/integração e risco quando os componentes existirem (story 9.3).
  - [ ] Usar `KPI Insight Card` ou variante compacta para indicadores financeiros/resumo por cliente na linha ou card, se fizer sentido para triagem.
  - [ ] Se 9.3 ainda não estiver implementada, deixar placeholders semânticos (classes/estrutura) que serão preenchidos pelos componentes de 9.3.

- [ ] **Task 3 (AC: 3, 4)** – Refatorar filtros e persistência de contexto
  - [ ] Revisar `ClientesFiltros` e estado em `ClientesPageClient`: busca, status, tags, responsável, erpStatus.
  - [ ] Garantir que filtros ativos sejam visíveis (chips ou resumo) e que limpar filtros seja óbvio.
  - [ ] Ao navegar para `/[clienteId]`, preservar query string ou estado (ex.: returnUrl ou filtros em sessionStorage) para “voltar à carteira” com mesmo contexto.
  - [ ] Critério de aceite: ao voltar de `/[clienteId]` para `/clientes`, filtros e página ativa devem ser restaurados (ou exibir mensagem clara quando não for possível).

- [ ] **Task 4 (AC: 1, 4)** – Ajustar lista/tabela para triagem
  - [ ] Refatorar `ClientesList` (ou equivalente) para destacar hierarquicamente: risco/integração, responsável, sinais financeiros, próxima ação.
  - [ ] Manter ou evoluir tabela para leitura rápida (gestor): ordenação por critérios úteis (ex.: risco, última atualização), sem quebrar acessibilidade.
  - [ ] Garantir que o link para o detalhe do cliente leve ao “recorte mais útil” (ex.: página principal do cliente ou área de trabalho) conforme UX.

- [ ] **Task 5 (AC: 5)** – Acessibilidade e semântica
  - [ ] Revisar landmarks, cabeçalhos de tabela (scope), aria-labels na região da lista e nos filtros.
  - [ ] Garantir que estados de risco/integração não dependam apenas de cor (texto/ícone sempre presentes).
  - [ ] Testar navegação por teclado e foco visível em filtros e linhas.

## Dev Notes

### Contexto funcional e de UX

- A tela de **Clientes** hoje é listagem cadastral com filtros; o objetivo desta story é torná-la **superfície de triagem de carteira**: o gestor deve identificar rapidamente clientes críticos e entrar no detalhe certo (UX spec: “Clientes deixa de ser apenas listagem e vira triagem de carteira”).
- Jornada “Gestor acompanha saúde da carteira”: Home/Carteira → ver cards de risco, margem e integração → aplicar filtro ou selecionar cliente crítico → Cliente 360 → ação → voltar à carteira com estado atualizado.
- Pontos de otimização: filtros persistentes e legíveis; clique na linha/card leva ao recorte correto do Cliente 360; retorno preserva contexto e filtros.

### Dependências explícitas

- **9.1** (design tokens) e **9.2** (AppShell): já em uso no app; a página de Clientes já está dentro do shell.
- **9.3** (HealthSignal, KPI Insight Card): componentes de domínio para risco, prioridade, integração e KPI. Se já implementados, usar nesta tela; se não, criar estrutura semântica e placeholders que serão preenchidos por 9.3.

### Estado atual relevante do código

- **Página:** `bpo360-app/src/app/(bpo)/clientes/page.tsx` — Server Component; busca responsáveis e tags; renderiza `ClientesPageClient`.
- **Cliente:** `clientes-page-client.tsx` — estado de filtros (`search`, `status`, `tags`, `responsavelInternoId`, `erpStatus`), paginação, fetch `/api/clientes`, lista e formulário novo/editar.
- **Lista:** `clientes-list.tsx` — tabela com colunas Cliente, CNPJ, Status, Responsável interno, ERP/Integração, Receita estimada, Ações; linha clicável navega para `/[clienteId]`; usa `ErpStatusCliente` e badges/estado locais.
- **Filtros:** `clientes-filtros.tsx` — controles para busca, status, tags, responsável, erpStatus.
- **API:** `GET /api/clientes` com query params de filtros e paginação; retorna `clientes` e `total`.
- Dados de cliente já incluem: `status`, `responsavel_interno_id`, `erp_status` / detalhes F360 quando existem; “risco” ou “próxima ação” podem precisar ser derivados ou vir de endpoints futuros — documentar no story o que for assumido.

### Arquitetura e padrões obrigatórios

- Manter Server Component para a página (dados iniciais de responsáveis/tags); lógica de filtros e lista no Client.
- Reutilizar design tokens (9.1) e, se existirem, `HealthSignal` e `KPI Insight Card` (9.3); não criar novos padrões de badge/card fora do design system do EP9.
- Filtros e navegação devem preservar contexto (query string ou estado persistido) para “voltar à carteira” com mesma visão.

### Padrões TypeScript / Next.js que o dev agent deve seguir

- Props tipadas explicitamente; tipos de domínio em `@/lib/domain/clientes/types` e `@/types/domain`.
- Alterações em API ou tipos: manter compatibilidade com `GET /api/clientes` e schemas em `src/lib/api/schemas/` se necessário.
- Seguir `bpo360-app/docs/typescript-recommendations.md` e padrões de componentes existentes em `(bpo)`.

### Arquivos prováveis a tocar

```text
bpo360-app/src/app/(bpo)/clientes/page.tsx
bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.tsx
bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx
bpo360-app/src/app/(bpo)/clientes/_components/clientes-filtros.tsx
bpo360-app/src/components/health-signal.tsx
bpo360-app/src/components/kpi-insight-card.tsx
```

(Os dois últimos só se já existirem pela 9.3; caso contrário, usar primitives e estrutura semântica alinhada ao que 9.3 definirá.)

### Superfícies de adoção

- Única superfície desta story: a tela **Clientes** (`/clientes`), como triagem de carteira.
- Navegação para `/[clienteId]` e `/[clienteId]/area-de-trabalho` (ou página principal do cliente) deve permanecer e, se possível, refletir “próxima ação” (ex.: link direto para área de trabalho quando fizer sentido).

### Fora de escopo explícito

- Não redesenhar a Home nem o painel Hoje (stories 9.5 e outras).
- Não implementar novos endpoints de “risco” ou “próxima ação” além do que já existir; documentar suposições e lacunas para evolução futura.
- Não alterar estrutura de dados do backend além do necessário para exibir sinais já disponíveis (ex.: erp_status, responsável, receita).

### Estratégia de testes

- Testes de componente ou página para a lista de clientes com filtros ativos e estados de loading/vazio.
- Garantir que navegação para detalhe do cliente e “voltar” preservem contexto quando implementado.
- Validar acessibilidade (tabela, filtros, foco, contraste dos sinais).

### Project Structure Notes

- Componentes de lista e filtros permanecem em `app/(bpo)/clientes/_components/`.
- Componentes de domínio reutilizáveis (HealthSignal, KPI Insight Card) em `src/components/` conforme 9.3.
- Alinhar com estrutura unificada do projeto e com padrões já usados em outras páginas BPO.

### Previous Story Intelligence (9.3)

- A 9.3 introduz `HealthSignal` e `KPI Insight Card` como camada de domínio sobre primitives (Badge, Card); devem ser usados para risco, prioridade, sync e KPI em vez de badges ad hoc.
- A 9.3 mapeia e substitui sinais visuais em Clientes, Hoje, Área de trabalho; a 9.4 é a refatoração **estrutural e hierárquica** da tela de Clientes (triagem), podendo consumir os componentes da 9.3 ou preparar a estrutura para eles.
- Padrão: componentes composáveis e independentes de API específica; evitar acoplamento a um payload único.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Implementation Approach]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Gestor acompanha saúde da carteira]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/implementation-artifacts/9-1-design-tokens-e-fundacao-visual-global.md]
- [Source: _bmad-output/implementation-artifacts/9-2-criar-appshell-para-o-backoffice-bpo.md]
- [Source: _bmad-output/implementation-artifacts/9-3-criar-sinais-operacionais-e-cards-de-insight.md]
- [Source: bpo360-app/docs/typescript-recommendations.md]

## Dev Agent Record

### Agent Model Used

(Preencher pelo agente de desenvolvimento.)

### Debug Log References

- Story criada a partir da 9.4 definida no EP9.
- Contexto analisado: epics.md, stories 9.1–9.3, ux-design-specification.md, página e componentes atuais de Clientes.

### Completion Notes List

(A preencher após implementação.)

### File List

(A preencher após implementação.)
