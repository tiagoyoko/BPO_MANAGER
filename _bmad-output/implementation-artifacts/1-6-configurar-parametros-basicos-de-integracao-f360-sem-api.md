# Story 1.6: Configurar parâmetros básicos de integração F360 (sem API)

Status: review

## Story

As a **gestor de BPO**,
I want **registrar o token F360 e observações por cliente**,
so that **a integração completa possa ser ativada depois (EP4)**.

## Acceptance Criteria

1. **Given** a seção "Integração F360" na aba "Configurações" do cliente,
   **When** o gestor informa o token F360 (campo mascarado, tipo senha) e observações opcionais,
   **Then** o token é armazenado criptografado no banco de dados e a resposta da API nunca retorna o token em texto puro.

2. **Given** o token F360 informado e salvo,
   **When** o gestor visualiza a seção novamente,
   **Then** o campo exibe versão mascarada (`••••••••[últimos 4 caracteres]`) com botão "Alterar token" para substituir.

3. **Given** o formulário de token salvo com sucesso,
   **When** a página de configuração é renderizada,
   **Then** é exibida a mensagem "Configuração básica salva – integração técnica pendente" com nota "A ativação da integração (conexão e sync F360) será configurada em etapa posterior."

4. **Given** o campo token em branco ao tentar salvar,
   **When** o gestor clica em "Salvar",
   **Then** o formulário exibe erro de validação "Token F360 é obrigatório" sem fazer requisição à API.

5. **Given** a subseção F360 somente visível se ERP F360 já estiver configurado (story 1.5),
   **When** não houver `IntegracaoErp` do tipo F360 para o cliente,
   **Then** a subseção de token exibe CTA "Configure primeiro o ERP F360" (link para a seção de ERP).

6. **And** apenas `admin_bpo` e `gestor_bpo` podem salvar token; `operador_bpo` vê estado (mascarado) em somente leitura; `cliente_final` recebe 403.

7. **And** o token nunca é registrado em logs da aplicação (nem parcialmente); qualquer erro de criptografia deve retornar 500 genérico sem expor detalhes.

## Tasks / Subtasks

- [x] **Task 1 (AC: 1,2,3)** – Migration: adicionar colunas de configuração F360 à `integracoes_erp`
  - [x] Criar `bpo360-app/supabase/migrations/20260314010000_add_f360_config_to_integracoes_erp.sql`
  - [x] `ALTER TABLE public.integracoes_erp ADD COLUMN token_f360_encrypted TEXT NULL`
  - [x] `ALTER TABLE public.integracoes_erp ADD COLUMN observacoes TEXT NULL`
  - [x] `ALTER TABLE public.integracoes_erp ADD COLUMN token_configurado_em TIMESTAMPTZ NULL` — registra quando o token foi salvo/atualizado pela última vez (para exibição de "última alteração" na story 1.7)
  - [x] Nenhuma migração de dados necessária (novas colunas nullable)

- [x] **Task 2 (AC: 1,7)** – Utilitário de criptografia de aplicação
  - [x] Criar `bpo360-app/src/lib/security/crypto.ts` usando Node.js `node:crypto` nativo (AES-256-GCM)
  - [x] Funções exportadas: `encrypt(plaintext: string): string` e `decrypt(ciphertext: string): string`
  - [x] Formato de armazenamento: string hex `iv:authTag:encryptedData` (separado por `:`)
  - [x] Chave lida de `process.env.TOKEN_ENCRYPTION_KEY` (64 hex chars = 32 bytes). Lançar erro descritivo se não configurada.
  - [x] **NUNCA logar** o plaintext ou derivados — somente erro genérico em caso de falha
  - [x] Criar `bpo360-app/src/lib/security/crypto.test.ts` com testes: encrypt → decrypt roundtrip; ciphertext é diferente do plaintext; ciphertexts do mesmo valor são diferentes (IV aleatório); erro sem env var
  - [x] Adicionar ao `.env.example`:
    ```
    # Chave de criptografia para tokens F360 (32 bytes como 64 hex chars). Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    TOKEN_ENCRYPTION_KEY=your-32-byte-hex-key
    ```

- [x] **Task 3 (AC: 1,2,3,5,6)** – Repositório: atualizar tipos e adicionar funções F360
  - [x] Atualizar `bpo360-app/src/lib/domain/integracoes-erp/types.ts`:
    - Adicionar em `IntegracaoErpRow`: `token_f360_encrypted: string | null`, `observacoes: string | null`, `token_configurado_em: string | null`
    - Adicionar em `IntegracaoErp`: `tokenConfigurado: boolean` (derivado de `token_f360_encrypted !== null`), `tokenMascarado: string | null` (ex.: `"••••abcd"` — calculado na camada de domínio), `observacoes: string | null`, `tokenConfiguradoEm: string | null`
    - Adicionar `ConfigF360Input`: `{ token: string; observacoes?: string | null }`
    - **Nunca adicionar `tokenPlaintext` ou similar nos tipos de domínio**
  - [x] Atualizar `rowToIntegracaoErp` para mapear novas colunas e gerar `tokenMascarado` (sem descriptografar aqui — só mascarar o que já existe via presença de `token_f360_encrypted`)
  - [x] Adicionar em `repository.ts`: função `atualizarConfigF360(supabase, integracaoId, bpoId, tokenEncrypted, observacoes)` → retorna `IntegracaoErp`

- [x] **Task 4 (AC: 1,2,3,5,6,7)** – API: `GET` e `PUT /api/clientes/[clienteId]/erp/f360`
  - [x] Criar `bpo360-app/src/app/api/clientes/[clienteId]/erp/f360/route.ts`
  - [x] **GET**: retorna configuração F360 mascarada do cliente.
    - Guard: qualquer papel exceto `cliente_final` (403)
    - Busca `integracoes_erp` WHERE `cliente_id = clienteId AND tipo_erp = 'F360'`
    - Se não existe: `{ data: null, error: { code: "NOT_FOUND", message: "Integração F360 não configurada." } }` HTTP 404
    - Retorna: `{ data: { id, tipoErp, ativo, tokenConfigurado, tokenMascarado, observacoes, tokenConfiguradoEm }, error: null }` — **nunca incluir o campo encrypted no JSON de resposta**
  - [x] **PUT**: salva/atualiza token F360 (operação idempotente).
    - Guard: apenas `admin_bpo` e `gestor_bpo`
    - Ownership check via `buscarClientePorIdEBpo`
    - Verifica que existe `IntegracaoErp` do tipo F360 (pré-requisito da story 1.5)
    - Body: `{ token: string; observacoes?: string | null }`
    - Validação: `token` obrigatório e não vazio após trim
    - Criptografa: `tokenEncrypted = encrypt(body.token)`
    - Atualiza: `token_f360_encrypted`, `observacoes`, `token_configurado_em = now()`
    - Resposta sucesso: `{ data: { integracao: IntegracaoErp (mascarada) }, error: null }` HTTP 200
    - Em erro de criptografia: log erro no servidor (sem o token), retornar `{ data: null, error: { code: "CRYPTO_ERROR", message: "Erro ao salvar configuração." } }` HTTP 500
  - [x] Criar `bpo360-app/src/app/api/clientes/[clienteId]/erp/f360/route.test.ts`:
    - GET sem auth → 401; com `cliente_final` → 403; sem F360 configurado → 404; com F360 configurado → 200 (nunca expõe `token_f360_encrypted` no body)
    - PUT sem auth → 401; com `operador_bpo` → 403; body inválido (token vazio) → 400; sem ERP F360 da story 1.5 → 404; sucesso → 200 com token mascarado

- [x] **Task 5 (AC: 1,2,3,4,5,6)** – UI: formulário de configuração do token F360
  - [x] Criar `bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/_components/f360-token-form.tsx` (Client Component)
    - Props: `integracaoId: string`, `clienteId: string`, `userRole: string`, `tokenConfigurado: boolean`, `tokenMascarado: string | null`, `observacoes: string | null`
    - Estados: `isSubmittingF360` (bool), `erroF360` (string | null), `modoEdicao` (bool — alterna entre display mascarado e campo de entrada)
    - Modo display (quando `tokenConfigurado && !modoEdicao`):
      - Exibir token mascarado, `tokenMascarado`
      - Botão "Alterar token" → `setModoEdicao(true)`
      - Exibir observações se existirem
    - Modo edição (quando `!tokenConfigurado || modoEdicao`):
      - `<input type="password">` para token com botão olho para revelar (toggle `type="text"`)
      - `<textarea>` para observações (opcional)
      - Validação client-side: token não pode ser vazio
      - Botão "Salvar configuração" → `PUT /api/clientes/[clienteId]/erp/f360`
      - Após sucesso: `setModoEdicao(false)` + atualizar estado local com resposta mascarada
      - Se `operador_bpo`: renderizar somente modo display (sem botão Alterar)
    - Status banner após salvar: "Configuração básica salva – integração técnica pendente"
    - Feedback de erro: usar componentes de `src/components/feedback/`
  - [x] Atualizar `bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/page.tsx` (criado na story 1.5):
    - Carregar configuração F360 via `GET /api/clientes/[clienteId]/erp/f360` (ou direto via repositório no servidor)
    - Renderizar `<F360TokenForm ... />` abaixo do `<ErpConfigClient ... />` somente se houver `IntegracaoErp` do tipo F360
    - Se não houver: renderizar aviso "Configure o ERP F360 na seção acima para liberar esta etapa"

- [x] **Task 6** – Testes de componente
  - [x] `f360-token-form.test.tsx`: modo display mascarado; toggle para edição; validação token vazio; submit com sucesso; tratamento de erro; modo readonly para `operador_bpo`
  - [x] Regressões: suite completa anterior continua passando

### Review Follow-ups (AI)

- [x] AI-Review (Médio): PUT `/api/clientes/[clienteId]/erp/f360` retorna `tokenMascarado: "••••••••"` em vez de `"••••••••[últimos 4 chars]"` — após salvar, o UI exibe display incompleto até page refresh. Fix: descriptografar o token após update e computar `"••••••••" + plain.slice(-4)` no route handler antes de retornar a resposta. `bpo360-app/src/app/api/clientes/[clienteId]/erp/f360/route.ts:178`
- [x] AI-Review (Baixo): Constante `AUTH_TAG_LENGTH` declarada mas nunca utilizada em `crypto.ts` — remover para evitar lint warning. `bpo360-app/src/lib/security/crypto.ts:10`
- [x] AI-Review (Baixo): `operador_bpo` sem token configurado vê campos de input sem botão Salvar (UX ruim) — exibir mensagem "Token não configurado" em modo somente leitura em vez do form vazio. `bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/_components/f360-token-form.tsx:110`
- [x] AI-Review (Baixo): CTA de pré-requisito F360 não é link — AC 5 especifica "link para a seção de ERP"; o texto atual é um `<p>` sem âncora. `bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/page.tsx:65`
- [x] AI-Review (Baixo): GET route define `COLS` e query Supabase manualmente duplicando lógica de `buscarIntegracaoF360` do repositório — refatorar para usar a função do repositório. `bpo360-app/src/app/api/clientes/[clienteId]/erp/f360/route.ts:15`
- [x] AI-Review (Baixo): Funções `buscarIntegracaoF360` e `atualizarConfigF360` sem testes unitários em `repository.test.ts`. `bpo360-app/src/lib/domain/integracoes-erp/repository.test.ts`

## Dev Notes

### Contexto da story 1.5 (pré-requisito)

Story 1.5 cria a tabela `integracoes_erp` e a rota `GET/POST /api/clientes/[clienteId]/erp`. Story 1.6 **depende** de uma linha `tipo_erp = 'F360'` existir em `integracoes_erp` para o cliente antes de configurar o token.

**Arquivos criados na story 1.5 que serão estendidos:**
```
bpo360-app/supabase/migrations/20260314000000_create_integracoes_erp_table.sql  # referência para schema
bpo360-app/src/lib/domain/integracoes-erp/types.ts                              # ALTERAR: novos campos
bpo360-app/src/lib/domain/integracoes-erp/repository.ts                         # ALTERAR: nova função
bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/page.tsx                   # ALTERAR: adicionar F360TokenForm
bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/_components/erp-config-client.tsx  # NÃO ALTERAR
```

**Arquivos reutilizados das stories anteriores (não recriar):**
```
bpo360-app/src/lib/auth/get-current-user.ts          # getCurrentUser() → { id, email, bpoId, role }
bpo360-app/src/lib/supabase/server.ts                # createClient()
bpo360-app/src/lib/domain/clientes/repository.ts     # buscarClientePorIdEBpo(supabase, clienteId, bpoId)
bpo360-app/src/components/feedback/                  # toasts/banners de erro — usar sempre
```

### Implementação do utilitário de criptografia

```typescript
// src/lib/security/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit para GCM
const AUTH_TAG_LENGTH = 16; // 128-bit

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY inválida ou ausente (deve ter 64 hex chars)");
  }
  return Buffer.from(hex, "hex");
}

/** Criptografa e retorna string no formato "iv:authTag:encrypted" (tudo em hex). */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Descriptografa string no formato "iv:authTag:encrypted". Uso exclusivo server-side. */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Formato de ciphertext inválido");
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
```

### Mascaramento do token

```typescript
// Em rowToIntegracaoErp (repository.ts) — gerar tokenMascarado sem descriptografar
function mascararToken(tokenEncrypted: string | null): string | null {
  if (!tokenEncrypted) return null;
  // Não descriptografar aqui — o ciphertext não revela o tamanho real do token
  // Usar placeholder fixo para indicar que está configurado
  return "••••••••";
}
```

> ⚠️ Se o tamanho real do token for necessário para mascaramento parcial (ex.: `"••••abcd"`), somente o route handler GET pode descriptografar server-side e gerar o mascarado. Nesse caso, importar `decrypt` em `route.ts` e nunca passar o ciphertext para o cliente.

### Adição de colunas na migration

```sql
-- Story 1.6: Adicionar configuração F360 à tabela integracoes_erp
-- A tabela foi criada na story 1.5 (20260314000000_create_integracoes_erp_table.sql)

ALTER TABLE public.integracoes_erp
  ADD COLUMN token_f360_encrypted   TEXT        NULL,
  ADD COLUMN observacoes            TEXT        NULL,
  ADD COLUMN token_configurado_em   TIMESTAMPTZ NULL;

-- NOTA (EP4): Em produção, considerar mover token_f360_encrypted para tabela dedicada
-- (similar ao cofre de segredos - story 8.4) com chave de criptografia por tenant.
-- Para MVP da story 1.6, a coluna inline é suficiente e mantém a complexidade baixa.
```

> ⚠️ A coluna `token_f360_encrypted` é protegida pelas políticas RLS existentes em `integracoes_erp` (SELECT restrito a usuários do BPO, UPDATE restrito a admin/gestor). Nenhuma nova política é necessária.

### Tipos de domínio atualizados

```typescript
// Adições em types.ts (existente da story 1.5)

// IntegracaoErpRow — adicionar:
token_f360_encrypted: string | null;
observacoes: string | null;
token_configurado_em: string | null;

// IntegracaoErp — adicionar:
tokenConfigurado: boolean;    // true se token_f360_encrypted !== null
tokenMascarado: string | null; // "••••••••" ou mascarado parcial (server-side)
observacoes: string | null;
tokenConfiguradoEm: string | null;

// Novo tipo de input:
export type ConfigF360Input = {
  token: string;       // obrigatório, não vazio
  observacoes?: string | null;
};
```

### Regra de segurança crítica para o route handler

```typescript
// src/app/api/clientes/[clienteId]/erp/f360/route.ts — GET
// NUNCA incluir token_f360_encrypted na resposta JSON
const { token_f360_encrypted, ...camposPublicos } = row; // excluir explicitamente
// Computar tokenMascarado server-side se necessário:
// const mascarado = token_f360_encrypted ? `••••${decrypt(token_f360_encrypted).slice(-4)}` : null;
```

### Padrão da UI: campo token com toggle visibilidade

```tsx
// Em f360-token-form.tsx
const [revelarToken, setRevelarToken] = useState(false);

<div className="relative">
  <input
    type={revelarToken ? "text" : "password"}
    placeholder="Cole o token gerado no painel F360"
    value={token}
    onChange={(e) => setToken(e.target.value)}
    autoComplete="off"
    className="..."
  />
  <button
    type="button"
    onClick={() => setRevelarToken(!revelarToken)}
    aria-label={revelarToken ? "Ocultar token" : "Revelar token"}
  >
    {/* ícone olho aberto/fechado */}
  </button>
</div>
```

### Onde o token é gerado (contexto UX)

A UI deve orientar o gestor a gerar o token no painel F360 Finanças. Incluir na UI a seguinte instrução (tooltip ou texto de ajuda):

> "O token F360 é gerado no painel F360 Finanças em **Configurações → Integrações → API**. Copie o token gerado e cole aqui."

Isso está alinhado ao AC de "UI orienta que deve ser gerado no painel F360" (story 1.6 épico).

### Padrões obrigatórios da Arquitetura

- **Criptografia**: AES-256-GCM via `node:crypto`. Chave em `TOKEN_ENCRYPTION_KEY` (env var, nunca hardcoded).
- **API Response**: `{ "data": <payload> | null, "error": { "code": "...", "message": "..." } | null }`.
- **Segurança**: token nunca em JSON de resposta; nunca em logs; plaintext só em memória server-side.
- **JSON boundary**: camelCase para o cliente; `token_f360_encrypted` nunca sai do servidor.
- **Loading**: `isSubmittingF360` para submit do formulário de token.
- **Feedback**: componentes de `src/components/feedback/` — não criar novo padrão.
- **Testes co-localizados**: `*.test.ts` / `*.test.tsx` ao lado do módulo.

### Limites de escopo desta story (NÃO implementar)

- ❌ Chamar a API F360 (`/PublicLoginAPI/DoLogin`) para testar o token → isso é story 4.1 (EP4)
- ❌ Marcar integração como "ativa" → ocorre em story 4.1 após teste bem-sucedido
- ❌ Campo "Testar conexão" → story 4.1
- ❌ Rotação de chave de criptografia → fora do escopo do MVP
- ❌ Criptografia assimétrica ou uso do cofre de segredos (story 8.4) → evolução futura

### Estrutura de arquivos desta story

```
bpo360-app/
├── supabase/
│   └── migrations/
│       └── 20260314010000_add_f360_config_to_integracoes_erp.sql   # NOVO
├── .env.example                                                     # ALTERAR: + TOKEN_ENCRYPTION_KEY
├── src/
│   ├── lib/
│   │   ├── security/
│   │   │   ├── crypto.ts            # NOVO: encrypt/decrypt AES-256-GCM
│   │   │   └── crypto.test.ts       # NOVO: testes de roundtrip e segurança
│   │   └── domain/
│   │       └── integracoes-erp/
│   │           ├── types.ts         # ALTERAR: + token/observacoes fields
│   │           └── repository.ts    # ALTERAR: + atualizarConfigF360, rowToIntegracaoErp atualizado
│   └── app/
│       ├── api/
│       │   └── clientes/
│       │       └── [clienteId]/
│       │           └── erp/
│       │               └── f360/
│       │                   ├── route.ts       # NOVO: GET (mascarado) + PUT (salvar token criptografado)
│       │                   └── route.test.ts  # NOVO: testes de rota
│       └── (bpo)/
│           └── clientes/
│               └── [clienteId]/
│                   └── config/
│                       ├── page.tsx           # ALTERAR: adicionar F360TokenForm abaixo do ErpConfigClient
│                       └── _components/
│                           ├── f360-token-form.tsx      # NOVO: formulário de token (Client Component)
│                           └── f360-token-form.test.tsx # NOVO: testes de componente
```

### Integração com stories futuras

- **Story 1.7** usará `token_configurado_em` e presença de `token_f360_encrypted` para exibir "F360 – config básica salva" na lista de clientes.
- **Story 4.1** (EP4) adicionará botão "Testar conexão" que chama `F360AuthService.login(token)` usando `decrypt(token_f360_encrypted)` — o decrypt acontece na camada de integração (`lib/integrations/f360/`).
- **Story 8.4** (cofre de senhas) pode absorver `token_f360_encrypted` em uma tabela de segredos centralizada — a interface de `decrypt` deve facilitar essa migração.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — §Story 1.6 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/epics.md — §Story 4.1 (EP4) para delimitar escopo da 1.6]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Authentication & Security (criptografia em repouso para tokens F360)]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Format Patterns, §Enforcement Guidelines]
- [Source: _bmad-output/implementation-artifacts/1-5-configurar-erp-principal-f360-por-cliente.md — schema da tabela, tipos, arquivos criados]
- [Source: bpo360-app/.env.example — padrão de variáveis de ambiente do projeto]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Migration `20260314010000_add_f360_config_to_integracoes_erp.sql`: colunas `token_f360_encrypted`, `observacoes`, `token_configurado_em`.
- `crypto.ts` (AES-256-GCM) + `crypto.test.ts` (6 testes); `.env.example` com `TOKEN_ENCRYPTION_KEY`.
- Tipos e repositório: `IntegracaoErpRow`/`IntegracaoErp` com campos F360; `buscarIntegracaoF360`, `atualizarConfigF360`; `rowToIntegracaoErp` com `tokenMascarado` ("••••••••"); `ConfigF360Input`.
- API GET/PUT `/api/clientes/[clienteId]/erp/f360`: GET retorna token mascarado (últimos 4 via decrypt server-side); PUT criptografa e persiste; nunca expõe token em JSON; 9 testes em `route.test.ts`.
- `F360TokenForm`: display mascarado, toggle edição, validação token vazio, FeedbackToast; página config renderiza form só quando F360 existe, senão CTA "Configure o ERP F360 na seção acima". 8 testes em `f360-token-form.test.tsx`.
- Regressão: 112 testes passando (erp-config-client e integracoes-erp/repository atualizados para novos campos).
- 2026-03-14 (action items): Resolvidos os 6 Review Follow-ups (AI): PUT retorna tokenMascarado com últimos 4 chars; removido AUTH_TAG_LENGTH; operador_bpo sem token vê "Token não configurado"; CTA pré-requisito como link #erp; GET refatorado para buscarIntegracaoF360Row; testes unitários para buscarIntegracaoF360Row, buscarIntegracaoF360 e atualizarConfigF360. DoD revalidado — 125 testes passando.
- 2026-03-14 (validação final): Corrigida regressão no mock de `src/app/api/clientes/route.test.ts` para o filtro `erpStatus=config_basica_salva`; `F360TokenForm` passou a consumir `integracaoId` sem alterar comportamento. Revalidação concluída com 127/127 testes passando e lint focado nos arquivos da story sem erros.

### File List

- bpo360-app/supabase/migrations/20260314010000_add_f360_config_to_integracoes_erp.sql
- bpo360-app/.env.example
- bpo360-app/src/lib/security/crypto.ts
- bpo360-app/src/lib/security/crypto.test.ts
- bpo360-app/src/lib/domain/integracoes-erp/types.ts
- bpo360-app/src/lib/domain/integracoes-erp/repository.ts
- bpo360-app/src/lib/domain/integracoes-erp/repository.test.ts
- bpo360-app/src/app/api/clientes/[clienteId]/erp/route.test.ts
- bpo360-app/src/app/api/clientes/[clienteId]/erp/f360/route.ts
- bpo360-app/src/app/api/clientes/[clienteId]/erp/f360/route.test.ts
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/page.tsx
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/_components/f360-token-form.tsx
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/_components/f360-token-form.test.tsx
- bpo360-app/src/app/(bpo)/clientes/[clienteId]/config/_components/erp-config-client.test.tsx

### Change Log

- 2026-03-14: Story 1.6 implementada (migração F360, crypto, tipos/repo, API f360, F360TokenForm, testes). Status → review.
- 2026-03-14: Action items do code review: PUT token mascarado com últimos 4; crypto.ts sem AUTH_TAG_LENGTH; F360TokenForm operador sem token; CTA link #erp; GET usa buscarIntegracaoF360Row; repository.test com buscarIntegracaoF360/atualizarConfigF360.
- 2026-03-14: Validação final da story concluída; regressão em `clientes/route.test.ts` corrigida e status mantido em review.
