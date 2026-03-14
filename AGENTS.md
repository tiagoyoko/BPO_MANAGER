# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

BPO360 is a multi-tenant Next.js (App Router) + Supabase SaaS platform for financial BPO operations. The single app lives in `bpo360-app/`. All npm commands should be run from that directory.

### Services

| Service | Purpose | Start command |
|---|---|---|
| Supabase local stack | PostgreSQL, Auth, Studio, API gateway | `sg docker -c "npx supabase start"` (from `bpo360-app/`) |
| Next.js dev server | Frontend + API routes | `npm run dev` (from `bpo360-app/`, port 3000) |

### Key commands (from `bpo360-app/`)

See `package.json` scripts. Summary:
- **Lint:** `npm run lint`
- **Unit/integration tests:** `npm run test`
- **DB/RLS tests:** `npm run test:db` (requires Supabase running)
- **Dev server:** `npm run dev`

### Non-obvious caveats

- **Docker must be started first.** Run `sudo dockerd &>/dev/null &` then wait a few seconds before running `supabase start`. The docker group must be used: wrap commands with `sg docker -c "..."`.
- **Migration ordering bug (fixed).** Migration `20260314193000_create_tarefa_checklist_logs.sql` was renamed to `20260314205000_create_tarefa_checklist_logs.sql` because it referenced `public.tarefas` which is created in `20260314200000`. If reverting to `main`, this bug may re-appear.
- **`cacheComponents: true` removed from `next.config.ts`.** This non-standard option caused build errors with `dynamic = "force-dynamic"` route exports. It was commented out.
- **Supabase local keys.** After `supabase start`, keys are printed. Create `bpo360-app/.env.local` with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and a generated `TOKEN_ENCRYPTION_KEY` (32-byte hex).
- **Admin user setup.** After `supabase start`, create a user via Auth API and then insert a row in `public.usuarios` linking the Auth UID to the BPO Demo tenant (`00000000-0000-0000-0000-000000000001`) with role `admin_bpo`. See `README.md` section "BPO360 – Primeiro BPO e usuário admin".
- **Pre-existing lint errors.** The file `tarefa-detalhe-client.tsx` has 2 `react/no-unescaped-entities` errors that exist in the codebase already.
