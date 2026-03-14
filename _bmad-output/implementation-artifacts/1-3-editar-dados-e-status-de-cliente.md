# Story 1.3: Editar dados e status de cliente

Status: review

<!-- Note: Validation is opcional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **gestor de BPO**,
I want **editar dados e alterar status de um cliente já cadastrado**,
so that **as informações e o ciclo de vida do cliente estejam corretos**.

## Acceptance Criteria

1. **Given** um cliente aberto (via botão "Editar" na lista ou na visão 360),
   **When** o gestor alterar campos editáveis (razão social, nome fantasia, e-mail, telefone, responsável interno, receita estimada, tags),
   **Then** as mudanças são salvas e refletidas na lista/visão do cliente.

2. **Given** o formulário de edição,
   **When** o gestor tentar editar o CNPJ,
   **Then** o campo CNPJ é exibido como somente leitura (não editável na edição normal).

3. **Given** o formulário de edição com o campo status,
   **When** o gestor selecionar um status (Ativo, Em implantação, Pausado, Encerrado),
   **Then** o status é atualizado e registrado.

4. **Given** o gestor selecionar o status "Encerrado",
   **When** tentar salvar,
   **Then** é exibida uma caixa de confirmação com texto de impacto ("Encerrar este cliente o tornará inativo. Rotinas e integrações ativas serão pausadas.") exigindo confirmação explícita antes de salvar.

5. **And** apenas usuários com papel `admin_bpo` ou `gestor_bpo` conseguem acessar a edição; `operador_bpo` e `cliente_final` recebem 403.

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,2,3,4,5)** – API Route: PATCH `/api/clientes/[clienteId]`
  - [x] Criar `src/app/api/clientes/[clienteId]/route.ts` com método `PATCH`.
  - [x] Guard: chamar `getCurrentUser()`; retornar 401 se sem sessão; retornar `{ data: null, error: { code: "FORBIDDEN", message: "Acesso negado" } }` HTTP 403 se papel for `operador_bpo` ou `cliente_final` (apenas `admin_bpo` e `gestor_bpo` podem editar).
  - [x] Verificar que o `clienteId` pertence ao `bpo_id` do usuário logado (buscar antes de atualizar); retornar 404 se não encontrado ou não pertencer ao tenant.
  - [x] Campos editáveis via PATCH: `razaoSocial`, `nomeFantasia`, `email`, `telefone`, `responsavelInternoId`, `receitaEstimada`, `tags`, `status`.
  - [x] CNPJ **não é aceito** no body do PATCH (ignorar ou retornar 400 caso enviado com tentativa de alteração).
  - [x] Validar `status`: deve ser um de `['Ativo', 'Em implantação', 'Pausado', 'Encerrado']`; retornar 400 se inválido.
  - [x] Atualizar `updated_at` automaticamente via `DEFAULT now()` ou via update explícito.
  - [x] Resposta sucesso: `{ data: { id, cnpj, razaoSocial, nomeFantasia, email, telefone, responsavelInternoId, receitaEstimada, tags, status, bpoId, criadoEm, atualizadoEm }, error: null }` HTTP 200.

- [x] **Task 2 (AC: 1,2,3,4)** – Reutilizar/estender formulário de cliente para modo edição
  - [x] Atualizar `src/app/(bpo)/clientes/_components/novo-cliente-form.tsx` para aceitar prop `clienteInicial?: Cliente` (modo edição) além do modo criação.
  - [x] Em modo edição: pré-popular todos os campos com dados do `clienteInicial`; renderizar CNPJ como campo `readOnly` (desabilitado, sem cursor, estilo visual diferenciado).
  - [x] Adicionar campo `status` (select/dropdown) no formulário — visível apenas em modo edição — com opções: `Ativo`, `Em implantação`, `Pausado`, `Encerrado`.
  - [x] Ao selecionar `Encerrado`, exibir aviso inline ("Encerrar este cliente o tornará inativo.") antes do submit; ao submeter, disparar o fluxo de confirmação (Task 3).
  - [x] Chamar `PATCH /api/clientes/[clienteId]` em vez de POST no submit do modo edição.
  - [x] Feedback: toast de sucesso/erro usando padrão de `components/feedback/` (mesmo padrão da 1.2).

- [x] **Task 3 (AC: 4)** – Dialog de confirmação para status "Encerrado"
  - [x] Criar `src/app/(bpo)/clientes/_components/confirmar-encerramento-dialog.tsx` (Client Component, reutiliza `<dialog>` ou componente de modal existente).
  - [x] Dialog exibe: título ("Encerrar cliente?"), texto de impacto ("Encerrar este cliente o tornará inativo. Rotinas e integrações ativas serão pausadas."), botões "Cancelar" e "Confirmar encerramento" (destrutivo, vermelho/danger).
  - [x] Fluxo: usuário seleciona "Encerrado" → dialog abre → "Cancelar" volta para edição sem alterações → "Confirmar" dispara o PATCH com `status: "Encerrado"`.
  - [x] Acessibilidade: `role="alertdialog"`, `aria-labelledby`, `aria-describedby`, foco preso no dialog; "Cancelar" como ação padrão de teclado.

- [x] **Task 4 (AC: 1,5)** – Integrar edição na página de clientes
  - [x] Atualizar `src/app/(bpo)/clientes/_components/clientes-list.tsx`: adicionar botão/ícone "Editar" por linha (visível apenas para `admin_bpo` e `gestor_bpo`; usar `useUser()` do `user-context.tsx`).
  - [x] Atualizar `src/app/(bpo)/clientes/_components/clientes-page-client.tsx`: gerenciar estado `clienteEditando: Cliente | null` e abrir `novo-cliente-form.tsx` em modo edição quando definido; ao salvar com sucesso, atualizar a lista (refresh ou atualização otimista do item).

- [x] **Task 5** – Testes
  - [x] `PATCH /api/clientes/[clienteId]` — sucesso (HTTP 200, dados atualizados).
  - [x] `PATCH /api/clientes/[clienteId]` — 403 quando papel é `operador_bpo`.
  - [x] `PATCH /api/clientes/[clienteId]` — 404 quando `clienteId` de outro `bpo_id`.
  - [x] `PATCH /api/clientes/[clienteId]` — 400 quando `status` inválido enviado.
  - [x] `PATCH /api/clientes/[clienteId]` — CNPJ não é alterado (campo ignorado/rejeitado).
  - [x] Componente `novo-cliente-form.tsx` em modo edição: campo CNPJ readOnly; status exibido.

### Review Follow-ups (AI)

- [x] [AI-Review][High] Corrigir serialização de `receitaEstimada` no modo edição para preservar valor `0` em vez de convertê-lo para `null`. [bpo360-app/src/app/(bpo)/clientes/_components/novo-cliente-form.tsx:109]
- [x] [AI-Review][Medium] Substituir mensagens técnicas de banco por mensagem amigável no PATCH, mantendo detalhes apenas em log interno. [bpo360-app/src/app/api/clientes/[clienteId]/route.ts:87]
- [x] [AI-Review][Medium] Validar novamente a afirmação de "suite completa: 59 testes passando" com execução explícita da suíte completa antes de marcar a story como `done`. [_bmad-output/implementation-artifacts/1-3-editar-dados-e-status-de-cliente.md:257]

## Dev Notes

### Contexto da Story 1.2 (fundação — LEIA ANTES DE CODAR)

A tabela `clientes` **já existe** via migração `bpo360-app/supabase/migrations/20260313200000_create_clientes_table.sql`:

- **Colunas:** `id UUID PK`, `bpo_id UUID NOT NULL FK(bpos.id)`, `cnpj TEXT NOT NULL`, `razao_social TEXT NOT NULL`, `nome_fantasia TEXT NOT NULL`, `email TEXT NOT NULL`, `telefone TEXT NULL`, `responsavel_interno_id UUID NULL FK(usuarios.id)`, `receita_estimada NUMERIC NULL`, `status TEXT NOT NULL DEFAULT 'Ativo'`, `tags JSONB NULL`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
- **Constraint:** `UNIQUE (bpo_id, cnpj)` — impede CNPJ duplicado por tenant.
- **RLS ativo:** políticas SELECT/INSERT/UPDATE via `get_my_bpo_id()` (funções da story 8.1). **Não alterar as políticas existentes** — a edição (UPDATE) já está coberta.
- **`StatusCliente`** — tipo já definido em `src/lib/domain/clientes/types.ts` como tipo ou enum com valores `'Ativo' | 'Em implantação' | 'Pausado' | 'Encerrado'`. Verificar o arquivo antes de criar novo tipo.

**Arquivos existentes da Story 1.2 (reutilizar, não recriar):**

```
bpo360-app/src/lib/domain/clientes/types.ts          # Cliente, StatusCliente, NovoClienteInput
bpo360-app/src/lib/domain/clientes/cnpj.ts            # normalizarCnpj, validarFormatoCnpj
bpo360-app/src/app/api/clientes/route.ts              # GET (lista) + POST (criar)
bpo360-app/src/app/(bpo)/clientes/page.tsx            # Server Component de lista
bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.tsx
bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx
bpo360-app/src/app/(bpo)/clientes/_components/novo-cliente-form.tsx
```

### Migração: não é necessária nesta story

Todos os campos editáveis (`status`, `updated_at`, etc.) já existem na tabela da 1.2. **Não criar nova migração** — somente reutilizar o schema existente.

### Rota de API: novo arquivo `[clienteId]/route.ts`

A arquitetura já prevê `app/api/clientes/[clienteId]/route.ts`. Esta story o cria com método `PATCH` (e opcionalmente `GET` para busca individual — se útil, mas fora do escopo mínimo de 1.3).

```typescript
// src/app/api/clientes/[clienteId]/route.ts — estrutura mínima
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado" } }, { status: 401 });
  if (!["admin_bpo", "gestor_bpo"].includes(user.role)) {
    return NextResponse.json({ data: null, error: { code: "FORBIDDEN", message: "Acesso negado" } }, { status: 403 });
  }
  // verificar que clienteId pertence a user.bpoId antes de atualizar
  // campos editáveis: razaoSocial, nomeFantasia, email, telefone, responsavelInternoId, receitaEstimada, tags, status
  // retornar { data: clienteAtualizado, error: null } 200
}
```

### Status de cliente: valores válidos

```typescript
const STATUS_VALIDOS = ["Ativo", "Em implantação", "Pausado", "Encerrado"] as const;
```

Verificar se `StatusCliente` em `types.ts` já usa esses valores; se sim, reutilizar o tipo. Se não, alinhar.

### Confirmação para "Encerrado": responsabilidade da UI, não da API

A API recebe e persiste `status: "Encerrado"` como qualquer outro status — sem lógica especial. A confirmação antes do PATCH é responsabilidade exclusiva da camada de UI (dialog modal). Isso mantém a API sem estado de UI e testável de forma isolada.

### CNPJ em modo edição: campo readOnly

```tsx
// Em novo-cliente-form.tsx, modo edição:
<input
  id="cnpj"
  value={formatarCnpj(clienteInicial.cnpj)} // exibir formatado
  readOnly
  disabled
  className="... opacity-60 cursor-not-allowed"
  aria-label="CNPJ (não editável)"
/>
```

Não enviar CNPJ no body do PATCH. A API deve ignorar ou rejeitar qualquer tentativa de alteração do CNPJ.

### Padrões de autenticação e RBAC (da story 8.1 e 8.2)

- `getCurrentUser()` em `src/lib/auth/get-current-user.ts` retorna `CurrentUser | null` com `{ id, email, bpoId, role, clienteId, nome }`.
- Verificar papel com `user.role`; não criar nova função RBAC para isso — usar a lógica simples de array em route handlers, ou verificar se `canManageUsers` em `rbac.ts` já serve (provavelmente não, pois é para usuários; criar lógica inline ou `canEditCliente(user)` em `rbac.ts`).
- `useUser()` do `src/lib/auth/user-context.tsx` disponível em Client Components para controle de visibilidade do botão "Editar" na lista.

### Padrões obrigatórios da Arquitetura

- **Resposta de API:** sempre `{ "data": <payload> | null, "error": null | { "code": "SOME_CODE", "message": "..." } }` com HTTP status adequado.
- **JSON boundary:** campos em camelCase no JSON da API; colunas snake_case no banco.
- **Nomes de arquivo:** componentes em `kebab-case.tsx`; funções camelCase.
- **Feedback:** toasts/banners de `src/components/feedback/` — mesmo padrão da 1.2.
- **Testes co-localizados:** `*.test.ts` ao lado do módulo.
- **Loading:** convenção `isSubmittingXxx` para loading de formulário.

### Estrutura de arquivos desta story

```
src/
  app/
    api/
      clientes/
        [clienteId]/
          route.ts                    # NOVO: PATCH (editar cliente)
          route.test.ts               # NOVO: testes de API
    (bpo)/
      clientes/
        _components/
          novo-cliente-form.tsx       # ALTERADO: modo edição + campo status + CNPJ readOnly
          clientes-list.tsx           # ALTERADO: botão "Editar" por linha
          clientes-page-client.tsx    # ALTERADO: gerenciar clienteEditando
          confirmar-encerramento-dialog.tsx  # NOVO: dialog de confirmação
```

### Project Structure Notes

- **Não criar** nova pasta ou rota separada para edição — reutilizar os componentes da 1.2, adicionando modo edição.
- Confirmar que `src/app/api/clientes/[clienteId]/` ainda não existe antes de criar (histórico: a 1.2 criou apenas `app/api/clientes/route.ts`).
- A rota `app/api/clientes/[clienteId]/route.ts` já está prevista na árvore da Arquitetura.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.3, critérios de aceite; RF-01.]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Response Format, Naming Patterns, Authentication & Security, Project Structure.]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Status e prioridades codificados, dialog de confirmação, WCAG 2.1 AA.]
- [Source: _bmad-output/implementation-artifacts/1-2-cadastrar-cliente-de-bpo.md — Schema real da tabela `clientes`, File List (arquivos existentes), Dev Notes (convenções e padrões estabelecidos).]
- [Source: bpo360-app/supabase/migrations/20260313200000_create_clientes_table.sql — DDL real: colunas, constraints, RLS.]
- [Source: bpo360-app/src/lib/domain/clientes/types.ts — tipos `Cliente`, `StatusCliente`, `NovoClienteInput`.]

---

## Developer Context (Guardrails)

### Technical Requirements

- **Tabela `clientes`:** já existe; nenhuma migração necessária. A coluna `status` suporta todos os valores esperados; `updated_at` já existe e deve ser atualizado no PATCH.
- **CNPJ:** imutável na edição normal — o campo não deve ser aceito como parâmetro de alteração no PATCH. Renderizar como `readOnly`/`disabled` no formulário.
- **Autorização no PATCH:** apenas `admin_bpo` e `gestor_bpo` podem chamar `PATCH /api/clientes/[clienteId]`; além do papel, verificar que o `clienteId` pertence ao `bpo_id` do usuário logado (isolamento multi-tenant).
- **Confirmação de "Encerrado":** somente UI — a API aceita `status: "Encerrado"` sem lógica de confirmação no backend.

### Architecture Compliance

- **DB:** snake_case; UPDATE em `clientes` onde `id = clienteId AND bpo_id = user.bpoId` (dupla verificação de isolamento).
- **API:** Route handler PATCH em `app/api/clientes/[clienteId]/route.ts`; resposta `{ data, error }` HTTP 200/400/401/403/404.
- **Frontend:** Client Component para formulário; Server Component para página principal (já existente).

### Library / Framework Requirements

- **Supabase:** cliente server-side (já configurado em `lib/supabase/`); não adicionar nova lib.
- **Next.js App Router:** reutilizar padrões já estabelecidos nas stories anteriores.
- **Sem nova dependência:** a dialog de confirmação pode usar `<dialog>` nativo do HTML5 ou o componente de modal já existente no projeto — verificar se existe um em `components/ui/` antes de criar do zero.

### File Structure Requirements

- Nova rota: `src/app/api/clientes/[clienteId]/route.ts`.
- Alterações nos componentes existentes da story 1.2 em `app/(bpo)/clientes/_components/`.
- Novo componente: `confirmar-encerramento-dialog.tsx` em `app/(bpo)/clientes/_components/`.
- Testes: `route.test.ts` ao lado da rota PATCH; testes de componente co-localizados ou em arquivo próximo.

### Testing Requirements

- **API:** cobrir os casos de 200 (sucesso), 401 (sem sessão), 403 (papel proibido), 404 (clienteId não pertence ao BPO), 400 (status inválido).
- **CNPJ imutável:** testar que enviar `cnpj` no body do PATCH não altera o valor no banco.
- **Componente:** formulário em modo edição com campo CNPJ readOnly e dropdown de status visível.
- **Manter regressões:** a suite de 35 testes da story 1.2 deve continuar passando sem alterações.

### Project Context Reference

- Nenhum `project-context.md` encontrado no repositório. Seguir estritamente PRD, Architecture, Epics e os story files anteriores (8.1, 8.2, 1.1, 1.2) como fonte de verdade do estado atual do codebase.

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Task 1: Rota PATCH `/api/clientes/[clienteId]` criada com guard RBAC (401/403), verificação tenant (404), validação de status e CNPJ não editável (400). Helper `rowToCliente` e tipo `AtualizarClienteInput`; repositório `buscarClientePorIdEBpo`.
- Task 2: `novo-cliente-form.tsx` aceita `clienteInicial`; modo edição com CNPJ readOnly, campo status (select), aviso inline para Encerrado e integração com dialog de confirmação; submit chama PATCH em edição e POST em criação; feedback de sucesso/erro via toast reutilizável em `src/components/feedback/feedback-toast.tsx`.
- Task 3: `confirmar-encerramento-dialog.tsx` com `<dialog>`, role="alertdialog", botões Cancelar e Confirmar encerramento (destrutivo), foco preso entre as ações e restauração de foco ao fechar.
- Task 4: `clientes-list.tsx` com botão Editar por linha (visível para admin_bpo/gestor_bpo via useUser()); `clientes-page-client.tsx` com estado `clienteEditando` e atualização otimista da lista ao salvar.
- Task 5: Testes de API PATCH (401, 403, 200, 404, 500 em erro de leitura, 400 status inválido, 400 CNPJ enviado); testes de componente (CNPJ readOnly, status exibido em modo edição e trap de foco no dialog). Suite completa: 66 testes passando (validado em 2026-03-14).
- Review follow-ups (2026-03-14): ✅ Resolved [High] serialização de `receitaEstimada` — payload usa checagem explícita `!== undefined && !== null && !== ""` para preservar 0. ✅ Resolved [Medium] mensagens DB_ERROR — PATCH retorna "Erro ao processar a solicitação. Tente novamente." com detalhes em `console.error`. ✅ Resolved [Medium] suite executada: 66 testes passando.

### File List

- bpo360-app/src/lib/domain/clientes/types.ts (alterado: AtualizarClienteInput)
- bpo360-app/src/lib/domain/clientes/repository.ts (alterado: buscarClientePorIdEBpo)
- bpo360-app/src/app/api/clientes/[clienteId]/route.ts (alterado: mensagem amigável DB_ERROR + console.error)
- bpo360-app/src/app/api/clientes/[clienteId]/route.test.ts (novo)
- bpo360-app/src/app/(bpo)/clientes/_components/novo-cliente-form.tsx (alterado: serialização receitaEstimada preserva 0)
- bpo360-app/src/app/(bpo)/clientes/_components/novo-cliente-form.test.tsx (novo)
- bpo360-app/src/app/(bpo)/clientes/_components/confirmar-encerramento-dialog.tsx (novo)
- bpo360-app/src/app/(bpo)/clientes/_components/confirmar-encerramento-dialog.test.tsx (novo)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-list.tsx (alterado)
- bpo360-app/src/app/(bpo)/clientes/_components/clientes-page-client.tsx (alterado)
- bpo360-app/src/components/feedback/feedback-toast.tsx (novo)

### Change Log

- 2026-03-13: Story 1.3 implementada — PATCH /api/clientes/[clienteId], formulário modo edição, dialog encerramento, botão Editar na lista, testes API e componente.
- 2026-03-14: Ajustes de review aplicados — trap de foco no dialog, diferenciação de `DB_ERROR` no PATCH e feedback padronizado com toast reutilizável.
- 2026-03-14: Review follow-ups (AI) — 3 itens resolvidos: receitaEstimada 0 preservado no payload; mensagens DB_ERROR amigáveis + log interno; suite 66 testes validada.
