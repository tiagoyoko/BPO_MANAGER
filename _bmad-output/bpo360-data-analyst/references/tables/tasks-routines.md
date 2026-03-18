# Tasks & Routines Tables

This document covers routine templates, client routine assignments, task instances, checklists, and audit history.

---

## Quick Reference

### Business Context
BPO360 has a three-tier task system: (1) **Rotinas Modelo** are reusable task templates maintained as a BPO-wide library, (2) **Rotinas Cliente** bind a template to a specific client with schedule/priority/assignee config, (3) **Tarefas** are concrete task instances with due dates. Each task can have checklist items copied from the template, and all changes are tracked in history.

### Flow: Template → Assignment → Task
```
rotinas_modelo (library)
  └── rotinas_cliente (assignment to client + schedule)
        └── tarefas (concrete instance per period)
              ├── tarefa_checklist_itens (copied from template)
              ├── tarefa_checklist_logs (mark/unmark audit)
              └── tarefa_historico (field change audit)
```

### Standard Filters
```sql
-- Today's tasks for an operator
WHERE t.bpo_id = '<bpo_id>'
  AND t.responsavel_id = '<user_id>'
  AND t.data_vencimento = CURRENT_DATE
  AND t.status IN ('a_fazer', 'em_andamento')
```

---

## Key Tables

### public.rotinas_modelo
**Description**: Reusable task template library. BPO-wide scope.
**Primary Key**: `id` (UUID)
**Indexes**: `idx_rotinas_modelo_bpo_id`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **nome** | TEXT | Template name | NOT NULL |
| **descricao** | TEXT | Description | Nullable |
| **periodicidade** | TEXT | Suggested frequency | `diaria`, `semanal`, `mensal`, `custom` |
| **tipo_servico** | TEXT | Service category | Nullable, freeform |
| **criado_por_id** | UUID | Creator FK | Nullable, refs `auth.users` |
| **created_at** | TIMESTAMPTZ | | Auto |
| **updated_at** | TIMESTAMPTZ | | Auto-trigger |

---

### public.rotina_modelo_checklist_itens
**Description**: Checklist items belonging to a routine template.
**Primary Key**: `id` (UUID)
**Indexes**: `idx_rotina_modelo_checklist_itens_rotina_modelo_id`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **rotina_modelo_id** | UUID | Parent template FK | NOT NULL, ON DELETE CASCADE |
| **titulo** | TEXT | Item title | NOT NULL |
| **descricao** | TEXT | Item description | Nullable |
| **obrigatorio** | BOOLEAN | Is mandatory? | Default `true` |
| **ordem** | INT | Display order | >= 0 |

**RLS**: Access scoped via parent `rotinas_modelo.bpo_id` (EXISTS subquery).

---

### public.rotinas_cliente
**Description**: Assignment of a template to a specific client, with scheduling configuration.
**Primary Key**: `id` (UUID)
**Indexes**: `idx_rotinas_cliente_bpo_id`, `idx_rotinas_cliente_cliente_id`, `idx_rotinas_cliente_rotina_modelo_id`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **cliente_id** | UUID | Client FK | NOT NULL |
| **rotina_modelo_id** | UUID | Template FK | NOT NULL |
| **data_inicio** | DATE | Start date for task generation | NOT NULL |
| **frequencia** | TEXT | Actual frequency for this client | `diaria`, `semanal`, `mensal`, `custom` |
| **responsavel_padrao_id** | UUID | Default assignee FK | Nullable, refs `usuarios` |
| **prioridade** | TEXT | Default priority | `baixa`, `media`, `alta`, `urgente` |
| **created_at** | TIMESTAMPTZ | | Auto |
| **updated_at** | TIMESTAMPTZ | | Auto-trigger |

---

### public.tarefas
**Description**: Concrete task instances with due dates. The main operational table.
**Primary Key**: `id` (UUID)
**Indexes**: `idx_tarefas_bpo_id`, `idx_tarefas_cliente_id`, `idx_tarefas_rotina_cliente_id`, `idx_tarefas_data_vencimento`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **cliente_id** | UUID | Client FK | NOT NULL |
| **rotina_cliente_id** | UUID | Source routine assignment | Nullable (ad-hoc tasks have NULL) |
| **titulo** | TEXT | Task title | NOT NULL |
| **data_vencimento** | DATE | Due date | NOT NULL, indexed |
| **status** | TEXT | Current status | Default `'a_fazer'` |
| **prioridade** | TEXT | Priority level | Default `'media'` |
| **responsavel_id** | UUID | Assigned operator FK | Nullable, refs `usuarios` |
| **created_at** | TIMESTAMPTZ | | Auto |
| **updated_at** | TIMESTAMPTZ | | Auto-trigger |

**Status values**: `'a_fazer'`, `'em_andamento'`, `'concluida'`, `'atrasada'`, `'bloqueada'`
**Priority values**: `'baixa'`, `'media'`, `'alta'`, `'urgente'`

**RLS**: Internal BPO roles see all within `bpo_id`. `cliente_final` sees only their `cliente_id`.

---

### public.tarefa_checklist_itens
**Description**: Checklist items for a specific task instance (copied from template at generation time).
**Primary Key**: `id` (UUID)
**Indexes**: `idx_tarefa_checklist_itens_tarefa_id`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **tarefa_id** | UUID | Parent task FK | NOT NULL, ON DELETE CASCADE |
| **titulo** | TEXT | Item title | NOT NULL |
| **descricao** | TEXT | Item description | Nullable |
| **obrigatorio** | BOOLEAN | Is mandatory? | Default `true` |
| **ordem** | INT | Display order | >= 0 |
| **concluido** | BOOLEAN | Is completed? | Default `false` |
| **concluido_por_id** | UUID | Who completed it | Nullable, refs `usuarios` |
| **concluido_em** | TIMESTAMPTZ | When completed | Nullable |

---

### public.tarefa_checklist_logs
**Description**: Audit log for checklist mark/unmark actions.
**Primary Key**: `id` (UUID)
**Indexes**: `idx_tarefa_checklist_logs_tarefa_id`, `idx_tarefa_checklist_logs_item_id`, `idx_tarefa_checklist_logs_bpo_id`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **bpo_id** | UUID | Tenant FK | NOT NULL |
| **tarefa_id** | UUID | Task FK | NOT NULL |
| **tarefa_checklist_item_id** | UUID | Checklist item FK | NOT NULL |
| **acao** | TEXT | Action performed | `'marcar'` or `'desmarcar'` |
| **usuario_id** | UUID | Who did it | Nullable, refs `usuarios` |
| **ocorrido_em** | TIMESTAMPTZ | When it happened | Default `now()` |

---

### public.tarefa_historico
**Description**: Audit trail for task field changes (e.g., reassignment, status change).
**Primary Key**: `id` (UUID)
**Indexes**: `idx_tarefa_historico_tarefa_id`, `idx_tarefa_historico_created_at`

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| **id** | UUID | Primary key | |
| **tarefa_id** | UUID | Task FK | NOT NULL, ON DELETE CASCADE |
| **campo** | TEXT | Field that changed | e.g., `'responsavel_id'`, `'status'` |
| **valor_anterior** | TEXT | Previous value | Nullable (for new fields) |
| **valor_novo** | TEXT | New value | Nullable |
| **usuario_id** | UUID | Who made the change | NOT NULL, refs `usuarios` |
| **created_at** | TIMESTAMPTZ | When changed | Auto |

---

## Sample Queries

### Tasks due this week with checklist progress
```sql
SELECT
    t.id,
    t.titulo,
    c.nome_fantasia AS cliente,
    t.data_vencimento,
    t.status,
    t.prioridade,
    u.nome AS responsavel,
    COUNT(ci.id) AS checklist_total,
    COUNT(ci.id) FILTER (WHERE ci.concluido) AS checklist_done
FROM public.tarefas t
JOIN public.clientes c ON c.id = t.cliente_id
LEFT JOIN public.usuarios u ON u.id = t.responsavel_id
LEFT JOIN public.tarefa_checklist_itens ci ON ci.tarefa_id = t.id
WHERE t.bpo_id = '<bpo_id>'
  AND t.data_vencimento BETWEEN DATE_TRUNC('week', CURRENT_DATE) AND DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days'
GROUP BY t.id, t.titulo, c.nome_fantasia, t.data_vencimento, t.status, t.prioridade, u.nome
ORDER BY t.data_vencimento, t.prioridade DESC;
```

### Routine templates with usage count
```sql
SELECT
    rm.id,
    rm.nome,
    rm.periodicidade,
    rm.tipo_servico,
    COUNT(rc.id) AS clientes_usando
FROM public.rotinas_modelo rm
LEFT JOIN public.rotinas_cliente rc ON rc.rotina_modelo_id = rm.id
WHERE rm.bpo_id = '<bpo_id>'
GROUP BY rm.id, rm.nome, rm.periodicidade, rm.tipo_servico
ORDER BY clientes_usando DESC;
```

### Recent task reassignments (audit)
```sql
SELECT
    th.created_at,
    t.titulo AS tarefa,
    c.nome_fantasia AS cliente,
    u_from.nome AS de,
    u_to.nome AS para,
    u_by.nome AS alterado_por
FROM public.tarefa_historico th
JOIN public.tarefas t ON t.id = th.tarefa_id
JOIN public.clientes c ON c.id = t.cliente_id
LEFT JOIN public.usuarios u_from ON u_from.id::text = th.valor_anterior
LEFT JOIN public.usuarios u_to ON u_to.id::text = th.valor_novo
JOIN public.usuarios u_by ON u_by.id = th.usuario_id
WHERE t.bpo_id = '<bpo_id>'
  AND th.campo = 'responsavel_id'
ORDER BY th.created_at DESC
LIMIT 20;
```

---

## Common Gotchas

1. **`rotina_cliente_id` can be NULL on `tarefas`**: Ad-hoc (manually created) tasks won't link to any routine. Don't assume all tasks come from templates.
2. **Status `'atrasada'` may not be auto-set**: The app might rely on date comparison (`data_vencimento < CURRENT_DATE AND status != 'concluida'`) rather than explicitly setting `atrasada`.
3. **Checklist items are COPIES, not references**: When a task is generated from a template, items are copied. Later changes to the template don't affect existing tasks.
4. **`tarefa_historico.valor_anterior/novo` are TEXT**: UUIDs, dates, and statuses are all stored as text strings. Cast as needed.
5. **Priority ordering**: Use CASE expression for ordering — `urgente > alta > media > baixa`.
