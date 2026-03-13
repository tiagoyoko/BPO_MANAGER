# Story 1.1 – Setup do projeto (Next.js + Supabase) – Detalhamento técnico

**Épico:** EP1 – Gestão de Clientes e Configurações de ERP  
**Story ID:** 1.1  
**Referências:** `epics.md`, `architecture.md`, `implementation-plan-sprint-1.md`

---

## 1. Objetivo

Inicializar o repositório do BPO360 usando o Starter oficial Next.js + Supabase (Vercel), configurar variáveis de ambiente e ajustar a estrutura de pastas para a organização definida na Arquitetura, deixando a base pronta para multi-tenant e integrações (Stories 8.1 e 8.2 em seguida).

---

## 2. Pré-requisitos

- **Node.js** 18.x ou superior (recomendado LTS).
- **npm** ou **pnpm** (o comando abaixo usa `npx`).
- **Conta Supabase** (https://supabase.com) para criar o projeto e obter a URL e a anon key.
- **Git** instalado (repositório será inicializado no passo 1).

---

## 3. Comandos e passos

### 3.1. Criar o app a partir do template

Na pasta onde você mantém os projetos (por exemplo, um nível acima de `BPO_MANAGER` ou dentro dele, conforme preferir):

```bash
# Exemplo: criar na mesma raiz que BPO_MANAGER
cd /caminho/para/parent
npx create-next-app@latest --example with-supabase with-supabase-app
```

Quando o CLI pedir o **nome do projeto**, usar por exemplo: **`bpo360-app`** (ou `with-supabase-app` se quiser manter o nome padrão do exemplo).

Isso cria uma pasta com:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Integração Supabase (auth, client, helpers)
- Estrutura típica do exemplo (pode vir com `app/` na raiz ou `src/app/`, conforme versão do template)

### 3.2. Entrar na pasta e instalar dependências (se necessário)

```bash
cd bpo360-app   # ou o nome que você escolheu
npm install     # ou pnpm install
```

### 3.3. Configurar variáveis de ambiente

1. Criar na raiz do projeto o arquivo **`.env.local`** (não versionado).
2. Copiar as variáveis do Supabase:
   - No painel do Supabase: **Project Settings → API**.
   - Copiar **Project URL** e **anon public** key.

Conteúdo mínimo de **`.env.local`**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
```

3. Criar **`.env.example`** na raiz (versionado) com placeholders, sem valores reais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Garantir que **`.env.local`** está no **`.gitignore`** (geralmente já vem no template).

### 3.4. Ajustar estrutura de pastas para a Arquitetura BPO360

A Arquitetura define o projeto sob **`src/`** com `app/`, `lib/`, `components/`, etc. O template pode ter **`app/`** na raiz. É necessário **alinhar à estrutura alvo** abaixo.

**Estrutura alvo (resumida, conforme `architecture.md`):**

```
bpo360-app/
├── .env.example
├── .env.local
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── supabase/
│   ├── config.toml
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── (public)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts
│   │   ├── (bpo)/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/
│   │   └── (proxy de sessão: proxy.ts na raiz)
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts
│   │   ├── auth/
│   │   ├── domain/
│   │   ├── integrations/
│   │   ├── utils/
│   │   └── logging/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   └── types/
└── public/
```

**Ações:**

- Se o template tiver **`app/` na raiz** (sem `src/`):
  1. Criar pasta **`src/`** na raiz.
  2. Mover **`app/`** para **`src/app/`**.
  3. Criar/mover **`lib/`** para **`src/lib/`** (preservar o que o template já tiver em `lib/` ou `utils/`).
  4. Criar **`src/components/`** (e subpastas `ui/`, `layout/`, `feedback/` vazias ou com um placeholder).
  5. Criar **`src/types/`** (vazio ou com um `domain.ts` placeholder).
  6. Atualizar **`tsconfig.json`**: garantir que paths e `include` apontem para `src/**` (geralmente `"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]` já cobre `src/`).
  7. Em **`next.config.ts`** (ou `.mjs`) não costuma ser necessário mudar nada só por usar `src/`; o Next.js detecta `src/app` automaticamente.

- Se o template já vier com **`src/app/`**:
  - Garantir que existe **`src/lib/supabase/`** com o client do Supabase.
  - Criar os route groups **`(public)`** e **`(bpo)`** e as pastas vazias que faltarem em `lib/`, `components/`.

**Route groups:**

- **`(public)`**: rotas acessíveis sem estar logado (login, callback de auth).
- **`(bpo)`**: área autenticada do BPO (dashboard, clientes, tarefas, etc.). O layout de `(bpo)` deve exigir autenticação (isso será implementado na Story 8.1; aqui só a estrutura).

### 3.5. Conteúdo mínimo dos arquivos críticos

#### `src/lib/supabase/client.ts` (ou equivalente)

Manter/ajustar o helper que cria o cliente Supabase para o ambiente (browser vs server), usando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. O template with-supabase costuma trazer isso; basta garantir que está em **`src/lib/supabase/`**.

Exemplo de referência (formato pode variar conforme template):

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

E um **server client** para uso em Server Components / Route Handlers (se o template tiver, manter em `src/lib/supabase/` com nome tipo `server.ts` ou `server-client.ts`).

#### `src/app/(public)/login/page.tsx`

Página de login. O template pode já trazer uma; manter ou mover para **`src/app/(public)/login/page.tsx`**. Garantir que usa o client Supabase para auth (sign in com e-mail/senha ou magic link).

#### `src/app/(public)/auth/callback/route.ts`

Route Handler para o **Auth callback** do Supabase (troca de code por sessão). Mover/criar em **`src/app/(public)/auth/callback/route.ts`** e usar o client Supabase de servidor para `exchangeCodeForSession` (ou equivalente do template).

#### `src/app/(bpo)/layout.tsx`

Layout da área logada. Por enquanto pode ser um layout simples que rendera `children` e um placeholder de “Área BPO” (a proteção por auth virá na 8.1). Exemplo:

```tsx
// src/app/(bpo)/layout.tsx
export default function BpoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <p>Área BPO (layout placeholder – auth na Story 8.1)</p>
      {children}
    </div>
  )
}
```

#### `src/app/(bpo)/page.tsx`

Home da área BPO. Conteúdo placeholder, por exemplo: “Dashboard gestor (em construção)”.

#### `src/app/layout.tsx`

Layout raiz: manter o do template (providers, fontes, `globals.css`). Se o template tiver layout em `app/layout.tsx`, ele estará em **`src/app/layout.tsx`** após a reorganização.

### 3.6. Supabase local (opcional para Story 1.1)

Para desenvolvimento local com Supabase (migrações, auth local), pode-se instalar Supabase CLI e rodar `supabase init` / `supabase start`. Para **só** atender à Story 1.1, usar o projeto remoto no painel Supabase é suficiente. Deixar a pasta **`supabase/`** na raiz com `config.toml` e `migrations/` (vazia ou com migrações futuras) é desejável para alinhar à Arquitetura.

---

## 4. Checklist de aceite (Story 1.1)

- [x] Comando `npx create-next-app --example with-supabase with-supabase-app` executado e projeto criado.
- [x] `.env.local` configurado com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `.env.example` criado com placeholders.
- [x] Estrutura sob **`src/`** conforme Arquitetura: `src/app/`, `src/lib/`, `src/components/`, `src/types/`.
- [x] Route groups **`(public)`** e **`(bpo)`** presentes em `src/app/`, com pelo menos:
  - `(public)/login/page.tsx`
  - `(public)/auth/callback/route.ts`
  - `(bpo)/layout.tsx` e `(bpo)/page.tsx`
- [x] Client Supabase em `src/lib/supabase/client.ts` (e server client se o template tiver).
- [x] `npm run build` (ou `pnpm build`) conclui sem erros.
- [x] `npm run dev` (ou `pnpm dev`) sobe o app; login e callback acessíveis nas rotas definidas (comportamento completo de auth será validado na 8.1).

---

## 5. File List

Arquivos criados ou alterados (relativos à raiz do repositório; app em `bpo360-app/`):

- `bpo360-app/.env.example`
- `bpo360-app/.gitignore`
- `bpo360-app/tsconfig.json`
- `bpo360-app/lib/supabase/client.ts` (removido da raiz; código em `src/lib/supabase/`)
- `bpo360-app/lib/supabase/server.ts` (removido da raiz)
- `bpo360-app/lib/utils.ts` (removido da raiz)
- `bpo360-app/src/app/globals.css`
- `bpo360-app/src/app/layout.tsx`
- `bpo360-app/src/app/(public)/login/page.tsx`
- `bpo360-app/src/app/(public)/auth/callback/route.ts`
- `bpo360-app/src/app/(public)/auth/confirm/route.ts`
- `bpo360-app/src/app/(public)/auth/error/page.tsx`
- `bpo360-app/src/app/(public)/auth/error/auth-error-content.tsx`
- `bpo360-app/src/app/(bpo)/layout.tsx`
- `bpo360-app/src/app/(bpo)/page.tsx`
- `bpo360-app/src/lib/supabase/client.ts`
- `bpo360-app/src/lib/supabase/server.ts`
- `bpo360-app/src/lib/supabase/proxy.ts`
- `bpo360-app/src/lib/utils.ts`
- `bpo360-app/src/types/domain.ts`
- `bpo360-app/src/components/**` (login-form, ui/*, etc. copiados para src/components)
- `bpo360-app/supabase/config.toml`
- `bpo360-app/supabase/migrations/` (pasta vazia)
- `bpo360-app/proxy.ts` (usa `@/lib/supabase/proxy`)
- `bpo360-app/next.config.ts`

---

## 6. Change Log

- **2026-03-13:** Code review (AI): correções aplicadas – File List e estrutura alvo com `next.config.ts` e proxy na raiz; `login-form.tsx` em pt-BR; `architecture.md` atualizado para proxy.ts (Next.js 16). Status → done.
- **2026-03-13:** Story 1.1 implementada. Projeto Next.js criado com template with-supabase em `bpo360-app/`. Estrutura alinhada à Arquitetura: `src/` com route groups `(public)` e `(bpo)`, client/server Supabase em `src/lib/supabase/`, `.env.example` com placeholders, `npm run build` e `npm run dev` validados.

---

## 7. Dev Agent Record

**Implementation notes:** App criado com `npx create-next-app@latest --example with-supabase bpo360-app`. Variáveis padronizadas para `NEXT_PUBLIC_SUPABASE_ANON_KEY` (em vez de PUBLISHABLE_KEY). Estrutura movida para `src/` com (public)/(bpo), callback em `(public)/auth/callback/route.ts` para `exchangeCodeForSession`, confirm em `(public)/auth/confirm/route.ts` para `verifyOtp`. Página de erro de auth com Suspense para uso de `useSearchParams`. Proxy de refresh de sessão em `src/lib/supabase/proxy.ts` e `proxy.ts` na raiz. Supabase local: `supabase/config.toml` e `migrations/` vazia.

**Completion notes:** Todos os itens do checklist de aceite atendidos. Build e dev validados.

**Code review (2026-03-13):** Correções aplicadas (opção 1): (1) Story: estrutura alvo e referências com `next.config.ts`; File List com `next.config.ts`; estrutura sem `middleware.ts`, com proxy na raiz. (2) `bpo360-app/src/components/login-form.tsx`: textos em pt-BR (Login, Senha, Entrar, Cadastre-se, etc.). (3) `architecture.md`: `middleware.ts` substituído por referência a `proxy.ts` na raiz (Next.js 16+).

---

## 8. Status

**done**

---

## 9. Referências

- **Arquitetura (estrutura completa):** `_bmad-output/planning-artifacts/architecture.md` – seção “Complete Project Directory Structure”.
- **Starter:** [Next.js with Supabase (Vercel)](https://github.com/vercel/next.js/tree/canary/examples/with-supabase).
- **Supabase + Next.js:** documentação oficial Supabase (Auth, SSR).
- **Épicos:** `_bmad-output/planning-artifacts/epics.md` – Epic 1, Story 1.1.
- **Plano Sprint 1:** `_bmad-output/planning-artifacts/implementation-plan-sprint-1.md`.
