# Clients Tables

This document covers client companies, their preferences, and ERP integration configurations.

---

## Quick Reference

### Business Context
Clients ("clientes") are the companies serviced by the BPO firm. Each client has a CNPJ (Brazilian tax ID), a status lifecycle, optional tags, and can have an ERP integration configured (currently only F360). Notification preferences are stored separately per client.

### Standard Filters
```sql
-- Active clients only (most common)
WHERE c.bpo_id = '<bpo_id>' AND c.status = 'Ativo'

-- Include onboarding clients
WHERE c.bpo_id = '<bpo_id>' AND c.status IN ('Ativo', 'Em implantação')
```

---

## Key Tables

### public.clientes
**Description**: Companies serviced by the BPO. Central entity for tasks, integrations, communication.
**Primary Key**: `id` (UUID)
**Update Frequency**: On user action (real-time)
**Indexes**: `idx_clientes_bpo_id`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | `gen_random_uuid()` |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **cnpj** | TEXT | Brazilian tax ID | NOT NULL, unique per `bpo_id` |
| **razao_social** | TEXT | Legal company name | NOT NULL |
| **nome_fantasia** | TEXT | Trade/display name | NOT NULL |
| **email** | TEXT | Primary contact email | NOT NULL |
| **telefone** | TEXT | Phone number | Nullable |
| **responsavel_interno_id** | UUID | Internal manager FK | Nullable, references `usuarios` |
| **receita_estimada** | NUMERIC(15,2) | Estimated monthly revenue | Nullable, in BRL |
| **status** | TEXT | Lifecycle status | Default `'Ativo'` |
| **tags** | JSONB | Freeform tags array | Default `'[]'::jsonb` |
| **created_at** | TIMESTAMPTZ | Record creation | Auto |
| **updated_at** | TIMESTAMPTZ | Last modification | Auto-trigger |

**Status values**: `'Ativo'`, `'Em implantação'`, `'Pausado'`, `'Encerrado'`

**Constraints**:
- `clientes_cnpj_unique_per_bpo`: UNIQUE(bpo_id, cnpj)
- `clientes_status_valido`: CHECK status IN (...)

**Relationships**:
- Belongs to `bpos` via `bpo_id`
- Has many `tarefas`, `solicitacoes`, `documentos`, `integracoes_erp`, `rotinas_cliente`
- Has one `cliente_preferencias`
- `responsavel_interno_id` → `usuarios.id` (the internal account manager)

**Tags column**:
- JSONB array of strings, e.g. `["contabilidade", "fiscal", "premium"]`
- Query: `WHERE tags @> '["premium"]'::jsonb`

---

### public.cliente_preferencias
**Description**: Notification preferences per client (one row per client).
**Primary Key**: `cliente_id` (UUID) — references `clientes(id)`
**Update Frequency**: On user preference change

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **cliente_id** | UUID | PK + FK to clientes | ON DELETE CASCADE |
| **notificar_por_email** | BOOLEAN | Email notifications enabled | Default `true` |
| **created_at** | TIMESTAMPTZ | Record creation | Auto |
| **updated_at** | TIMESTAMPTZ | Last modification | Auto-trigger |

---

### public.integracoes_erp
**Description**: ERP integration config per client. Currently supports F360 only.
**Primary Key**: `id` (UUID)
**Update Frequency**: On integration setup/config
**Indexes**: `idx_integracoes_erp_cliente_id`, `idx_integracoes_erp_bpo_id`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | `gen_random_uuid()` |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **cliente_id** | UUID | Client FK | NOT NULL |
| **tipo_erp** | TEXT | ERP type identifier | Currently only `'F360'` |
| **e_principal** | BOOLEAN | Is this the primary ERP? | Default `true` |
| **ativo** | BOOLEAN | Integration active? | Default `false` (!) |
| **token_f360_encrypted** | TEXT | AES-256-GCM encrypted F360 token | Nullable |
| **observacoes** | TEXT | Free-text notes | Nullable |
| **token_configurado_em** | TIMESTAMPTZ | When token was configured | Nullable |
| **created_at** | TIMESTAMPTZ | Record creation | Auto |
| **updated_at** | TIMESTAMPTZ | Last modification | Auto-trigger |

**Constraints**:
- `integracoes_erp_unique_per_cliente_tipo`: UNIQUE(cliente_id, tipo_erp)
- `integracoes_erp_tipo_valido`: CHECK tipo_erp IN ('F360')

**IMPORTANT**: `ativo` defaults to `false`. A record existing does NOT mean the integration is active. It only becomes `true` after a successful F360 connection test (Story 4.1).

**RLS**: Only `admin_bpo` and `gestor_bpo` can INSERT/UPDATE. All internal BPO roles can SELECT. `cliente_final` has NO access.

---

## Sample Queries

### Portfolio overview with integration status
```sql
SELECT
    c.id,
    c.nome_fantasia,
    c.cnpj,
    c.status,
    c.receita_estimada,
    c.tags,
    u.nome AS responsavel,
    ie.tipo_erp,
    COALESCE(ie.ativo, false) AS integracao_ativa,
    ie.token_configurado_em
FROM public.clientes c
LEFT JOIN public.usuarios u ON u.id = c.responsavel_interno_id
LEFT JOIN public.integracoes_erp ie ON ie.cliente_id = c.id
WHERE c.bpo_id = '<bpo_id>'
ORDER BY c.nome_fantasia;
```

### Clients by tag
```sql
SELECT id, nome_fantasia, tags
FROM public.clientes
WHERE bpo_id = '<bpo_id>'
  AND tags @> '["fiscal"]'::jsonb;
```

### Revenue at risk (inactive or paused clients)
```sql
SELECT
    status,
    COUNT(*) AS total,
    SUM(receita_estimada) AS receita_em_risco
FROM public.clientes
WHERE bpo_id = '<bpo_id>'
  AND status IN ('Pausado', 'Encerrado')
GROUP BY status;
```

---

## Common Gotchas

1. **CNPJ uniqueness is per BPO**: The same CNPJ can exist in different BPOs (different tenants). Filter by `bpo_id` first.
2. **`receita_estimada` is often NULL**: Not all clients have this filled in. Use `COALESCE(receita_estimada, 0)` or filter `IS NOT NULL`.
3. **Tags are JSONB arrays**: Use `@>` for containment checks, not `LIKE` or `=`.
4. **Integration record may not exist**: Use `LEFT JOIN` to `integracoes_erp` — many clients won't have an integration row at all.
