# Communication Tables

This document covers requests/tickets, comments, and document attachments.

---

## Quick Reference

### Business Context
BPO360 has a communication layer centered on "solicitações" (requests/tickets) that track interactions between the BPO team and their clients. Each request has a timeline of comments and can have document attachments. Requests can originate from internal BPO staff or from the client portal. Documents can also be attached directly to tasks.

### Standard Filters
```sql
-- Open requests only
WHERE s.bpo_id = '<bpo_id>'
  AND s.status IN ('aberta', 'em_andamento')

-- Client-originated requests
  AND s.origem = 'cliente'
```

---

## Key Tables

### public.solicitacoes
**Description**: Request/ticket per client. Can be linked to a task. Supports internal and client-originated requests.
**Primary Key**: `id` (UUID)
**Indexes**: `idx_solicitacoes_bpo_id`, `idx_solicitacoes_cliente_id`, `idx_solicitacoes_status`, `idx_solicitacoes_created_at`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **cliente_id** | UUID | Client FK | NOT NULL |
| **titulo** | TEXT | Request title | NOT NULL |
| **descricao** | TEXT | Detailed description | Nullable |
| **tipo** | TEXT | Request type | Default `'outro'` |
| **prioridade** | TEXT | Priority | Default `'media'` |
| **tarefa_id** | UUID | Related task FK | Nullable |
| **status** | TEXT | Current status | Default `'aberta'` |
| **origem** | TEXT | Origin of request | Default `'interno'` |
| **criado_por_id** | UUID | Creator FK | Nullable, refs `usuarios` |
| **created_at** | TIMESTAMPTZ | | Auto |
| **updated_at** | TIMESTAMPTZ | | Auto-trigger |

**Type values**: `'documento_faltando'`, `'duvida'`, `'ajuste'`, `'outro'`
**Status values**: `'aberta'`, `'em_andamento'`, `'resolvida'`, `'fechada'`
**Origin values**: `'interno'`, `'cliente'`
**Priority values**: `'baixa'`, `'media'`, `'alta'`, `'urgente'`

**RLS**:
- Internal BPO users: full access within `bpo_id`
- `cliente_final`: can SELECT/INSERT only for their own `cliente_id`

---

### public.comentarios
**Description**: Comments on a request. Immutable by design (no UPDATE/DELETE policies).
**Primary Key**: `id` (UUID)
**Indexes**: `idx_comentarios_solicitacao_id`, `idx_comentarios_bpo_id`, `idx_comentarios_created_at`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **solicitacao_id** | UUID | Parent request FK | NOT NULL, ON DELETE CASCADE |
| **autor_id** | UUID | Author FK | Nullable, refs `usuarios` |
| **texto** | TEXT | Comment text | NOT NULL |
| **created_at** | TIMESTAMPTZ | | Auto |

**Note**: Comments are intentionally immutable — no UPDATE or DELETE policies exist in this version.

**RLS**: Only internal BPO roles (`admin_bpo`, `gestor_bpo`, `operador_bpo`) can read/write. `cliente_final` access to comments is NOT yet implemented.

---

### public.documentos
**Description**: File attachment metadata. Physical files are stored in Supabase Storage bucket `anexos-solicitacoes`.
**Primary Key**: `id` (UUID)
**Indexes**: `idx_documentos_solicitacao_id`, `idx_documentos_tarefa_id`, `idx_documentos_bpo_cliente`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **cliente_id** | UUID | Client FK | NOT NULL |
| **solicitacao_id** | UUID | Related request FK | Nullable, ON DELETE CASCADE |
| **tarefa_id** | UUID | Related task FK | Nullable, ON DELETE SET NULL |
| **storage_key** | TEXT | Supabase Storage path | NOT NULL |
| **nome_arquivo** | TEXT | Original filename | NOT NULL |
| **tipo_mime** | TEXT | MIME type | NOT NULL |
| **tamanho** | BIGINT | File size in bytes | NOT NULL |
| **criado_por_id** | UUID | Uploader FK | Nullable, refs `usuarios` |
| **created_at** | TIMESTAMPTZ | | Auto |

**Storage path convention**: `{bpo_id}/{cliente_id}/{solicitacao_id|tarefa_id}/{uuid}_{filename}`

**RLS**:
- Internal BPO users: see all documents within `bpo_id`
- `cliente_final`: see only documents for their own `cliente_id`

**Storage bucket**: `anexos-solicitacoes` (private, access via signed URLs)

---

## Sample Queries

### Open requests with comment count
```sql
SELECT
    s.id,
    s.titulo,
    s.tipo,
    s.prioridade,
    s.status,
    s.origem,
    c.nome_fantasia AS cliente,
    u.nome AS criado_por,
    s.created_at,
    COUNT(cm.id) AS total_comentarios,
    COUNT(d.id) AS total_anexos
FROM public.solicitacoes s
JOIN public.clientes c ON c.id = s.cliente_id
LEFT JOIN public.usuarios u ON u.id = s.criado_por_id
LEFT JOIN public.comentarios cm ON cm.solicitacao_id = s.id
LEFT JOIN public.documentos d ON d.solicitacao_id = s.id
WHERE s.bpo_id = '<bpo_id>'
  AND s.status IN ('aberta', 'em_andamento')
GROUP BY s.id, s.titulo, s.tipo, s.prioridade, s.status, s.origem, c.nome_fantasia, u.nome, s.created_at
ORDER BY s.created_at DESC;
```

### Request volume by type and month
```sql
SELECT
    DATE_TRUNC('month', created_at) AS mes,
    tipo,
    COUNT(*) AS total
FROM public.solicitacoes
WHERE bpo_id = '<bpo_id>'
  AND created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY mes, tipo
ORDER BY mes DESC, total DESC;
```

### Documents by client (storage usage)
```sql
SELECT
    c.nome_fantasia,
    COUNT(d.id) AS total_arquivos,
    SUM(d.tamanho) AS total_bytes,
    ROUND(SUM(d.tamanho) / 1048576.0, 2) AS total_mb
FROM public.documentos d
JOIN public.clientes c ON c.id = d.cliente_id
WHERE d.bpo_id = '<bpo_id>'
GROUP BY c.nome_fantasia
ORDER BY total_bytes DESC;
```

### Full thread for a request (comments + documents timeline)
```sql
WITH thread AS (
    SELECT
        cm.created_at AS evento_em,
        'comentario' AS tipo,
        cm.texto AS conteudo,
        u.nome AS autor
    FROM public.comentarios cm
    LEFT JOIN public.usuarios u ON u.id = cm.autor_id
    WHERE cm.solicitacao_id = '<solicitacao_id>'

    UNION ALL

    SELECT
        d.created_at AS evento_em,
        'documento' AS tipo,
        d.nome_arquivo || ' (' || ROUND(d.tamanho / 1024.0, 1) || ' KB)' AS conteudo,
        u.nome AS autor
    FROM public.documentos d
    LEFT JOIN public.usuarios u ON u.id = d.criado_por_id
    WHERE d.solicitacao_id = '<solicitacao_id>'
)
SELECT * FROM thread
ORDER BY evento_em ASC;
```

---

## Common Gotchas

1. **Comments are immutable**: No UPDATE/DELETE is allowed. If a user needs to "edit" a comment, the app should create a new one.
2. **`cliente_final` cannot see comments yet**: RLS policies for comments only cover internal BPO roles. Client-visible comments require additional policy work.
3. **Two `documentos` migrations exist**: Migration `20260314235000` and `20260314240000` both create `public.documentos`. The later one (240000) is canonical and includes `tarefa_id`.
4. **`solicitacao_id` on `documentos` is ON DELETE CASCADE**: Deleting a request deletes its document metadata (but not the storage file).
5. **`tarefa_id` on `documentos` is ON DELETE SET NULL**: Deleting a task orphans the document (keeps metadata with null FK).
6. **Storage key != URL**: The `storage_key` column stores the path within the bucket. To generate a download URL, use Supabase's `createSignedUrl()`.
