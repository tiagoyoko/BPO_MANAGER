# Story 9.2: Criar AppShell para o backoffice BPO

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor ou operador de BPO**,
I want **navegar dentro de um shell persistente com sidebar, header contextual e área principal consistente**,
so that **eu mantenha contexto e orientação ao mover entre Home, Clientes, Hoje e demais módulos**.

## Acceptance Criteria

1. **Given** as rotas principais da área BPO,
   **When** o AppShell for aplicado,
   **Then** as páginas passam a compartilhar uma estrutura persistente com sidebar de navegação, header contextual e área principal consistente.
   **And** a seção ativa fica visualmente identificável.

2. **Given** um usuário autenticado da área BPO,
   **When** navegar entre Home, Clientes, Solicitações, Modelos, Hoje e Admin/Usuários,
   **Then** o shell mantém o mesmo frame visual e reduz a sensação de salto entre páginas.
   **And** as rotas continuam respeitando permissões por papel já existentes.

3. **Given** a estratégia UX desktop-first definida no spec,
   **When** o shell for renderizado em desktop,
   **Then** a sidebar permanece visível e o header contextual expõe título da área, contexto do usuário e espaço para ações rápidas.
   **And** em tablet o shell colapsa de forma funcional sem perder navegação nem contexto.

4. **Given** acessibilidade e consistência de UX como requisitos transversais,
   **When** o AppShell for implementado,
   **Then** ele oferece landmarks semânticos, foco visível, navegação por teclado e `skip link`.
   **And** a estrutura do shell não depende apenas de cor para indicar estado ativo.

5. **Given** a base criada na story 9.1,
   **When** o AppShell for implementado,
   **Then** ele reutiliza os novos design tokens e primitives existentes.
   **And** não introduz um sistema paralelo de layout, estilos ou navegação fora do padrão já definido.

6. **Given** o portal do cliente usa outro ritmo de interface,
   **When** a story for concluída,
   **Then** o shell do backoffice BPO fica implementado e a variante de portal fica apenas preparada em termos de fundação, sem exigir redesign completo do portal nesta story.

## Tasks / Subtasks

- [ ] **Task 1 (AC: 1, 2, 3, 5)** – Criar o componente base `AppShell` para a área BPO
  - [ ] Definir a estrutura do shell com sidebar, header contextual, área de conteúdo e slots reutilizáveis.
  - [ ] Implementar o shell em componentes reutilizáveis na árvore de `src/components` ou `src/app/(bpo)/_components`, seguindo a estrutura atual do projeto.
  - [ ] Garantir compatibilidade com os design tokens e primitives já existentes (`Button`, `Card`, `Badge`, etc.).

- [ ] **Task 2 (AC: 1, 2, 4)** – Aplicar o shell em `src/app/(bpo)/layout.tsx`
  - [ ] Substituir o wrapper mínimo atual por um layout compartilhado da área BPO.
  - [ ] Integrar dados do usuário autenticado no shell (nome/e-mail/role) sem quebrar o `UserProvider`.
  - [ ] Manter os redirecionamentos já existentes para usuário não autenticado e `cliente_final`.

- [ ] **Task 3 (AC: 1, 2, 3)** – Estruturar a navegação principal do backoffice
  - [ ] Listar rotas existentes em `app/(bpo)/` e mapear cada uma para um item de menu; documentar em Dev Notes o que ficou como placeholder ou link desativado.
  - [ ] Definir entradas mínimas de navegação para `Home`, `Clientes`, `Hoje/Tarefas`, `Solicitações`, `Modelos` e `Admin/Usuários` conforme disponibilidade atual do produto.
  - [ ] Implementar destaque visual da rota ativa.
  - [ ] Garantir que links para áreas ainda em evolução apontem para rotas reais existentes no projeto.

- [ ] **Task 4 (AC: 2, 3, 6)** – Ajustar superfícies principais para operar dentro do shell
  - [ ] Revisar `src/app/(bpo)/page.tsx` para não duplicar container/header que devem pertencer ao shell.
  - [ ] Verificar páginas relevantes da área BPO que possam conflitar com o novo frame compartilhado.
  - [ ] Não refatorar o conteúdo funcional interno das telas nesta story; apenas adequar o encaixe no shell.

- [ ] **Task 5 (AC: 3, 4)** – Garantir acessibilidade, responsividade e estrutura semântica
  - [ ] Incluir `skip link`, landmarks (`header`, `nav`, `main`, `aside` quando apropriado) e foco visível.
  - [ ] Garantir comportamento funcional em tablet com colapso da navegação.
  - [ ] Validar que navegação por teclado e indicação de item ativo continuem claras.

- [ ] **Task 6 (AC: 5, 6)** – Preparar a base para variante futura do portal
  - [ ] Estruturar o AppShell de forma que suporte variantes futuras (`bpo`, `portal`, `admin`) sem implementar todo o portal nesta story.
  - [ ] Documentar as decisões que impactarão a futura story de shell/linguagem do portal.

## Dev Notes

### Contexto funcional e de UX

- Esta story é a **segunda fundação** do EP9: transforma a base visual da 9.1 em um frame de navegação persistente para o backoffice.
- O UX spec define explicitamente um shell com:
  - sidebar persistente
  - header contextual
  - contexto sempre visível
  - navegação tipo app de produtividade
- O objetivo do shell é reduzir descontinuidade entre páginas e preparar as próximas refatorações (`Clientes`, `Hoje`, `Focus Workspace`).

### Dependência explícita da story anterior

- A `9.2` deve ser implementada **sobre a fundação visual da 9.1**.
- Se a `9.1` ainda não estiver concluída no código, esta story deve considerar isso como pré-condição técnica ou trabalhar com a base de tokens já proposta, sem reinventar estilos localmente.

### Estado atual relevante do código

- `src/app/(bpo)/layout.tsx` hoje só faz autenticação/redirecionamento e renderiza `{children}` dentro de um `div`.
- `src/app/(bpo)/page.tsx` ainda assume responsabilidade por container da Home.
- `src/app/(portal)/layout.tsx` também é minimalista e pode servir como referência para futura variante, mas **não é foco** desta story.
- Não existem hoje componentes prontos de `sidebar`, `header`, `shell` ou `nav` compartilhados no projeto.

### Arquitetura e padrões obrigatórios

- O projeto usa **Next.js App Router** com layouts por segmento; esta story deve explorar esse padrão, não contorná-lo.
- A organização por feature/rota deve ser preservada.
- Reutilizar primitives existentes e design tokens globais, evitando criar um sistema isolado de classes e wrappers.
- O shell deve continuar compatível com autenticação/roles já vigentes e com `UserProvider`.

### Padrões TypeScript / Next.js que o dev agent deve seguir

- Se a story precisar introduzir utilidades compartilhadas, manter tipagem explícita e sem `any`.
- Se alguma API route for tocada incidentalmente, usar:
  - `bpo360-app/src/types/api.ts`
  - `bpo360-app/src/lib/api/schemas/`
  - `bpo360-app/docs/typescript-recommendations.md`
- Qualquer body de route modificada deve usar Zod com `parseBody`, `jsonSuccess` e `jsonError`.

### Arquivos prováveis a tocar

```text
bpo360-app/src/app/(bpo)/layout.tsx
bpo360-app/src/app/(bpo)/page.tsx
bpo360-app/src/components/
bpo360-app/src/components/ui/button.tsx
bpo360-app/src/components/ui/card.tsx
bpo360-app/src/app/globals.css
```

Arquivos adicionais prováveis, a depender da implementação:

```text
bpo360-app/src/components/app-shell.tsx
bpo360-app/src/components/bpo-sidebar.tsx
bpo360-app/src/components/bpo-header.tsx
bpo360-app/src/lib/navigation/
```

### Navegação mínima sugerida

- `Home`
- `Clientes`
- `Hoje` ou `Tarefas`
- `Solicitações`
- `Modelos`
- `Admin / Usuários` (condicional por papel)

Se alguma rota ainda não existir, usar apenas entradas para rotas reais e documentar claramente as lacunas.

### Fora de escopo explícito

- Não redesenhar por completo o portal do cliente.
- Não criar ainda `HealthSignal`, `KPI Insight Card` ou `Focus Workspace`.
- Não refatorar conteúdo funcional profundo de `Clientes`, `Hoje`, `Solicitações` ou `Modelos`.
- Não alterar regras de autorização além do necessário para exibir navegação condicional.

### Estratégia de testes

- Validar renderização do shell para usuário autenticado BPO.
- Validar navegação ativa e presença dos principais links.
- Validar redirecionamento preservado para usuário não autenticado e `cliente_final`.
- Validar responsividade mínima em tablet e navegação por teclado.
- Se forem criados componentes reutilizáveis de shell, considerar testes de componente para navegação ativa e landmarks.

### Project Structure Notes

- Preferir componentes reutilizáveis explícitos para o shell em vez de embutir toda a estrutura diretamente no `layout.tsx`.
- Manter o `layout.tsx` como integrador do shell, auth e contexto do usuário.
- Se houver dúvida entre criar componente em `src/components/` ou em `(bpo)/_components`, priorizar reutilização futura e clareza.

### References

- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/epics.md#Epic-9]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#Design-System-Foundation]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#Design-Direction-Decision]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#UX-Consistency-Patterns]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design--Accessibility]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/ux-design-directions.html]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/_bmad-output/implementation-artifacts/9-1-design-tokens-e-fundacao-visual-global.md]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/bpo360-app/docs/typescript-recommendations.md]
- [Source: /Users/tiagoyokoyama/BPO_MANAGER/bpo360-app/src/types/api.ts]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada a partir da `9.2` definida no EP9
- Contexto analisado: `epics.md`, story `9.1`, layouts BPO/Portal e páginas principais

### Completion Notes List

- O `epic-9` já estava `in-progress` por conta da story `9.1`; esta story mantém o mesmo épico em andamento.
- Não há componentes prontos de shell/navegação compartilhada no código atual.
- A variante do portal foi tratada como preparação arquitetural, não como escopo principal de implementação.

### File List

- _bmad-output/implementation-artifacts/9-2-criar-appshell-para-o-backoffice-bpo.md

