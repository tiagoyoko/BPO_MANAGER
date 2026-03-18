# Recomendações TypeScript — BPO360 (Mastering TypeScript)

Análise do projeto **bpo360-app** com base nas práticas do skill *Mastering Modern TypeScript* (TS 5.9+, strict, Zod, React, Vitest). Foco em tipo seguro, validação em bordas e toolchain moderna.

---

## 1. Resumo executivo

| Área              | Estado atual                         | Prioridade |
|-------------------|--------------------------------------|------------|
| tsconfig strict   | ✅ `strict: true`                    | —          |
| Tipos de domínio  | ✅ Bem definidos (unions, Row/DTO)   | —          |
| Validação API     | ⚠️ Manual, sem Zod                  | Alta       |
| Respostas API     | ⚠️ Padrão repetido, sem tipo genérico | Média    |
| Dados Supabase    | ⚠️ Muitos `as unknown as`           | Média      |
| ESLint            | ⚠️ Só Next, sem strict type-checked | Média      |
| tsconfig extra    | ❌ Faltam opções strict adicionais   | Baixa      |
| Uso de `any`      | ⚠️ 1 ocorrência (tutorial)           | Baixa      |
| Package manager   | ❌ npm implícito                    | Opcional   |

---

## 2. Pontos positivos

- **Strict mode ativo** em `tsconfig.json`, reduzindo null/undefined incorretos.
- **Tipos de domínio claros**: `CurrentUser`, `PapelBpo`, `Cliente`, `ClienteRow`, `NovoClienteInput`, `StatusCliente`, etc., com union types e separação snake_case (DB) vs camelCase (app).
- **Literais com `as const`** nas rotas (ex.: `TIPOS_VALIDOS`, `PRIORIDADES_VALIDAS`, `STATUS_VALIDOS`) para type-safety e autocomplete.
- **Componentes React tipados**: `ButtonProps`, `NovoClienteForm` com `Props` e tipos de domínio importados.
- **Vitest** configurado com alias `@/` e ambiente node.
- **Pouco `any`**: apenas um uso em `fetch-data-steps.tsx` (`useState<any[] | null>`).

---

## 3. Recomendações

### 3.1 Validação nas bordas da API (Zod)

**Problema:** Em várias rotas o body é lido com `await request.json()` e tipado apenas por anotação (ex.: `body: NovoClienteInput`). Dados malformados ou adulterados não são validados em runtime.

**Exemplo atual (POST /api/solicitacoes):**

```ts
let body: PostSolicitacaoBody;
try {
  body = await request.json();
} catch { ... }
// validação manual com if (!TIPOS_VALIDOS.includes(tipo)) ...
```

**Recomendação:** Introduzir **Zod** e validar todo body de POST/PATCH na entrada.

- Adicionar dependência: `pnpm add zod` (ou `npm i zod`).
- Criar schemas por recurso e inferir tipos com `z.infer<typeof Schema>` para evitar duplicação.

**Exemplo:**

```ts
// src/lib/api/schemas/solicitacoes.ts
import { z } from "zod";

const TIPOS_VALIDOS = ["documento_faltando", "duvida", "ajuste", "outro"] as const;
const PRIORIDADES_VALIDAS = ["baixa", "media", "alta", "urgente"] as const;

export const PostSolicitacaoSchema = z.object({
  clienteId: z.string().uuid(),
  titulo: z.string().min(1).max(500),
  descricao: z.string().optional(),
  tipo: z.enum(TIPOS_VALIDOS),
  prioridade: z.enum(PRIORIDADES_VALIDAS),
  tarefaId: z.string().uuid().nullable().optional(),
});

export type PostSolicitacaoBody = z.infer<typeof PostSolicitacaoSchema>;
```

Na route:

```ts
const parsed = PostSolicitacaoSchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json(
    { data: null, error: { code: "VALIDATION_ERROR", message: parsed.error.message, issues: parsed.error.issues } },
    { status: 400 }
  );
}
const body = parsed.data;
```

Aplicar o mesmo padrão para: `POST/PATCH /api/clientes`, `POST /api/solicitacoes`, `PATCH /api/solicitacoes/[id]`, `POST/PATCH /api/tarefas/[id]`, `POST /api/rotinas-cliente/em-massa`, etc.

---

### 3.2 Resposta da API tipada com genérico

**Problema:** O padrão `{ data, error }` se repete em muitas rotas sem um tipo único, o que dificulta tipagem no cliente e consistência.

**Recomendação:** Definir tipos genéricos e, se quiser, helpers de resposta.

**Exemplo:**

```ts
// src/types/api.ts

export type ApiError = { code: string; message: string; issues?: unknown };

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null } satisfies ApiResponse<T>, { status });
}

export function jsonError(error: ApiError, status: number) {
  return NextResponse.json({ data: null, error } satisfies ApiResponse<never>, { status });
}
```

Assim o front pode usar `ApiResponse<Cliente>` ou `ApiResponse<{ clientes: Cliente[]; total: number }>` e manter consistência.

---

### 3.3 Reduzir `as unknown as` em respostas do Supabase

**Problema:** Vários trechos fazem cast direto de `rows`/`data` para tipos de linha (ex.: `(rows ?? []) as unknown as SolicitacaoRowComCliente[]`). Isso contorna o tipo e pode esconder mudanças no schema.

**Recomendações:**

1. **Tipar o retorno do Supabase** quando possível com generics do cliente (ex.: `.select('...').returns<ClienteRow[]>()` ou tipos gerados se existirem).
2. **Centralizar mapeamento** em funções que recebem `unknown` e retornam o tipo desejado, usando type guards ou Zod para validar estrutura em pontos críticos.
3. **Criar tipos** para os resultados das queries com join (ex.: `SolicitacaoRowComCliente`) e usá-los no `.select()`/retorno em vez de cast em massa.

Isso não elimina todos os casts de uma vez, mas reduz e deixa o contrato explícito.

---

### 3.4 ESLint com type-aware rules (TypeScript strict)

**Problema:** O ESLint usa apenas `next/core-web-vitals` e `next/typescript`. Para alinhar ao “mastering-typescript”, vale incluir regras **type-checked** do `typescript-eslint`.

**Recomendação:** Adicionar `typescript-eslint` com config type-checked (e project service) e manter compatível com Next.

**Exemplo (eslint.config.mjs):**

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "*.config.js", "*.config.mjs", "*.config.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
];

export default eslintConfig;
```

Ajustar conforme versão do `typescript-eslint` (flat config e projectService). Isso ajuda a pegar erros que dependem de tipos.

---

### 3.5 tsconfig: opções strict adicionais

**Problema:** Só `strict: true` está ativo. O template do skill recomenda mais opções para maior segurança.

**Recomendações (gradual):**

- **`noUncheckedIndexedAccess`**: `true` — acesso a índice (ex.: `arr[i]`) vira `T | undefined`; exige checagens ou `.at(i)`. Pode ser ligado em um primeiro momento em pastas novas ou críticas.
- **`exactOptionalPropertyTypes`**: `true` — distingue `undefined` de “propriedade ausente”. Pode quebrar código que trata opcionais de forma relaxada; habilitar por etapas.
- **`target`**: hoje `ES2017`; para alinhar ao skill, considerar `ES2022` ou `ES2024` (respeitando suporte do Next e do deploy).

Sugestão: habilitar primeiro `noUncheckedIndexedAccess` em um branch e corrigir erros; depois avaliar `exactOptionalPropertyTypes` e o `target`.

---

### 3.6 Remover o uso de `any` no tutorial

**Problema:** Em `src/components/tutorial/fetch-data-steps.tsx` há `useState<any[] | null>(null)`.

**Recomendação:** Definir um tipo mínimo para os itens (ex.: `{ id: string; title?: string; [key: string]: unknown }`) ou usar um tipo de “note” do domínio e tipar o state com ele (ex.: `useState<Note[] | null>(null)`). Assim você elimina o único `any` do projeto e mantém o exemplo didático tipado.

---

### 3.7 Package manager (opcional)

**Skill recomenda:** pnpm (velocidade, disco, workspace).

**Atual:** Não há campo `packageManager` em `package.json`; provavelmente npm.

**Recomendação:** Se a equipe quiser adotar pnpm, adicionar em `package.json`:

```json
"packageManager": "pnpm@9.x"
```

e rodar apenas com pnpm a partir daí. Não é obrigatório para as outras recomendações.

---

### 3.8 Prettier (opcional)

Para formatação consistente com o skill, garantir Prettier configurado e, se desejado, integrado ao ESLint (`eslint-config-prettier`). Não foi validado se já existe config do Prettier no monorepo.

---

## 4. Checklist de adoção

- [x] Adicionar Zod e criar schemas para bodies de API (POST/PATCH) usados em produção. **Implementado:** `src/lib/api/schemas/` (clientes, solicitacoes, tarefas, modelos, admin-usuarios, preferencias, comentarios, erp, f360, rotinas).
- [x] Validar todos os bodies com `.safeParse()` e responder 400 com `issues` em caso de erro. **Implementado:** helper `parseBody(request, schema)` em `src/types/api.ts`; rotas listadas no plano usam Zod e retornam `VALIDATION_ERROR` com `issues`.
- [x] Introduzir `ApiResponse<T>` e helpers `jsonSuccess`/`jsonError`. **Implementado:** `src/types/api.ts` com tipos e funções; rotas padronizadas com esses helpers.
- [x] Reduzir casts `as unknown as` em dados do Supabase. **Implementado:** funções de mapeamento em timeline (`toSolicitacaoRows`, `toComentarioRows`), solicitacoes (`toSolicitacaoRowComClienteList`, `toSolicitacaoRowComCliente`), tarefas detalhe (`toChecklistLogRows`); casts em testes de mock mantidos.
- [x] Incluir `typescript-eslint` type-checked no ESLint. **Implementado:** `recommendedTypeChecked` em `eslint.config.mjs` com `projectService: true`; regras ruidosas em "warn"; 0 erros de lint.
- [x] Avaliar `noUncheckedIndexedAccess` (e depois `exactOptionalPropertyTypes`) no tsconfig. **Implementado:** `noUncheckedIndexedAccess: true` em `tsconfig.json`; acessos a índice e a `Object.keys()` tratados com checagem de `undefined` onde necessário.
- [x] Substituir `useState<any[] | null>` em `fetch-data-steps.tsx` por tipo explícito. **Implementado:** tipo `NoteRow` no snippet do tutorial; sem ocorrências de `any` no arquivo.
- [x] (Opcional) Padronizar em pnpm e documentar no README. **Implementado:** `packageManager: "pnpm@9.15.0"` em `package.json`; README com seção "Toolchain (pnpm e Prettier)".
- [x] (Opcional) Configurar Prettier e integrar ao lint. **Implementado:** Prettier + `eslint-config-prettier`; scripts `format` e `format:check`; `.prettierrc.json` e `.prettierignore`; ESLint estendido com `prettier`.

---

## 5. Referências

- Skill: *Mastering Modern TypeScript* (`.claude/skills/mastering-typescript/SKILL.md`).
- Referências do skill: `type-system.md`, `enterprise-patterns.md`, `react-integration.md`, `toolchain.md`.
- Template tsconfig do skill: `.gemini/skills/mastering-typescript/assets/tsconfig-template.json`.

Documento gerado com base na análise estática do repositório e nas práticas do skill *Mastering TypeScript*.
