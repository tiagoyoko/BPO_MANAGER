# Identity & Auth Tables

This document covers authentication, user profiles, roles, and multi-tenant isolation.

---

## Quick Reference

### Business Context
BPO360 is multi-tenant: every BPO firm is isolated by `bpo_id`. Users authenticate via Supabase Auth (email/password), and their profile in `public.usuarios` maps them to a BPO, a role, and optionally a client company. RLS policies enforce data isolation at the database level.

### Standard Filters
```sql
-- Always scope to a single BPO tenant
WHERE bpo_id = public.get_my_bpo_id()  -- via RLS
-- Or for direct SQL:
WHERE bpo_id = '<bpo_uuid>'
```

---

## Key Tables

### public.bpos
**Description**: Tenant table — one row per BPO company operating the platform.
**Primary Key**: `id` (UUID)
**Update Frequency**: Rarely changes after creation
**RLS**: SELECT open to all authenticated users

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | `gen_random_uuid()` |
| **nome** | TEXT | BPO company name | NOT NULL |
| **created_at** | TIMESTAMPTZ | Record creation | Auto |
| **updated_at** | TIMESTAMPTZ | Last modification | Auto-trigger |

**Relationships**:
- Parent of ALL domain tables via `bpo_id`

---

### public.usuarios
**Description**: User profile linked 1:1 with `auth.users`. Contains role and tenant assignment.
**Primary Key**: `id` (UUID) — references `auth.users(id)` ON DELETE CASCADE
**Update Frequency**: On user management actions
**Indexes**: `idx_usuarios_bpo_id`, `idx_usuarios_email`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | PK, same as auth.users.id | References `auth.users` |
| **bpo_id** | UUID | Tenant FK | NOT NULL, references `bpos` |
| **role** | `papel_bpo` (enum) | User role | `admin_bpo`, `gestor_bpo`, `operador_bpo`, `cliente_final` |
| **cliente_id** | UUID | Client company FK | NULL except for `cliente_final` |
| **nome** | TEXT | Display name | Nullable |
| **email** | TEXT | User email | Nullable (also in auth.users) |
| **created_at** | TIMESTAMPTZ | Record creation | Auto |
| **updated_at** | TIMESTAMPTZ | Last modification | Auto-trigger |

**Constraints**:
- `cliente_final_deve_ter_cliente_id`: If `role = 'cliente_final'`, then `cliente_id` must be NOT NULL

**Relationships**:
- Belongs to `bpos` via `bpo_id`
- Optionally belongs to `clientes` via `cliente_id` (only `cliente_final`)
- Referenced by `tarefas.responsavel_id`, `clientes.responsavel_interno_id`, `comentarios.autor_id`, etc.

**RLS Policies**:
- `usuarios_select_own`: Users can see their own profile (`id = auth.uid()`)
- Additional admin RLS added in migration `20260313190000`

---

## Helper Functions (SECURITY DEFINER)

These functions are used in RLS policies and app logic:

| Function | Returns | Description |
|----------|---------|-------------|
| `public.get_my_bpo_id()` | UUID | Returns current user's `bpo_id` |
| `public.get_my_role()` | `papel_bpo` | Returns current user's role |
| `public.get_my_cliente_id()` | UUID | Returns current user's `cliente_id` (NULL for internal users) |

All are `STABLE`, `SECURITY DEFINER`, with `search_path = public`.

---

## Enum Type

### public.papel_bpo
```sql
CREATE TYPE public.papel_bpo AS ENUM (
  'admin_bpo',
  'gestor_bpo',
  'operador_bpo',
  'cliente_final'
);
```

---

## Sample Queries

### List all users for a BPO
```sql
SELECT u.id, u.nome, u.email, u.role, c.nome_fantasia AS cliente
FROM public.usuarios u
LEFT JOIN public.clientes c ON c.id = u.cliente_id
WHERE u.bpo_id = '<bpo_id>'
ORDER BY u.role, u.nome;
```

### Count users by role
```sql
SELECT role, COUNT(*) AS total
FROM public.usuarios
WHERE bpo_id = '<bpo_id>'
GROUP BY role
ORDER BY total DESC;
```

### Find operators with no tasks assigned
```sql
SELECT u.id, u.nome, u.email
FROM public.usuarios u
WHERE u.bpo_id = '<bpo_id>'
  AND u.role = 'operador_bpo'
  AND NOT EXISTS (
    SELECT 1 FROM public.tarefas t
    WHERE t.responsavel_id = u.id
      AND t.data_vencimento >= CURRENT_DATE
      AND t.status IN ('a_fazer', 'em_andamento')
  );
```

---

## Common Gotchas

1. **`usuarios.id` is NOT auto-generated**: It references `auth.users(id)`. Always create the auth user first, then insert into `usuarios`.
2. **Email exists in two places**: Both `auth.users.email` and `public.usuarios.email`. The `public` copy is for convenience/display; auth is the source of truth.
3. **RLS on `usuarios` is restrictive by default**: Regular users can only see their own row. Admin policies extend this for user management.
