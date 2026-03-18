---
name: bpo360-data-analyst
description: "BPO360 data analysis skill. Provides context for querying Supabase PostgreSQL including entity definitions, metric calculations, RLS patterns, and common query patterns. Use when analyzing BPO360 data for: (1) client portfolio health and operational metrics, (2) task/routine completion and SLA tracking, (3) financial integration status and F360 sync monitoring, or any data questions requiring BPO360-specific context."
---

# BPO360 Data Analysis

## SQL Dialect: PostgreSQL (Supabase)

- **Table references**: `public.table_name` (snake_case, plural)
- **Safe division**: `NULLIF(b, 0)` pattern: `a / NULLIF(b, 0)`
- **Date functions**:
  - `DATE_TRUNC('month', date_col)`
  - `date_col - INTERVAL '1 day'`
  - `DATE_PART('day', end_date - start_date)`
- **Column selection**: No EXCEPT; must list columns explicitly
- **JSON**: `json_col->>'field_name'` for text, `json_col->'field_name'` for JSON object
- **Timestamps**: All stored as `TIMESTAMPTZ`; use `AT TIME ZONE 'America/Sao_Paulo'` for BR display
- **String matching**: `LIKE`, `col ~ 'pattern'` for regex
- **Boolean**: Native BOOLEAN type; use `TRUE`/`FALSE`
- **UUIDs**: All PKs are `UUID DEFAULT gen_random_uuid()`

### Supabase-Specific Notes
- **RLS is enabled on ALL tables** — queries via Supabase client are automatically scoped by `bpo_id`
- Direct SQL via `execute_sql` bypasses RLS (service role)
- Helper functions exist: `get_my_bpo_id()`, `get_my_role()`, `get_my_cliente_id()`
- `updated_at` is auto-managed by triggers on most tables

---

## Entity Disambiguation

When users mention these terms, clarify which entity they mean:

**"Cliente" can mean:**
- **Cliente BPO (empresa atendida)**: A company serviced by the BPO firm (`public.clientes`: `id`)
- **Usuário cliente_final**: A person from the client company with portal access (`public.usuarios` WHERE `role = 'cliente_final'`: `id`)
- Always ask: "the company record or the user login?"

**"Usuário" can mean:**
- **Operador BPO**: Staff who executes daily tasks (`public.usuarios` WHERE `role = 'operador_bpo'`)
- **Gestor BPO**: Manager overseeing client portfolio (`public.usuarios` WHERE `role = 'gestor_bpo'`)
- **Admin BPO**: System administrator (`public.usuarios` WHERE `role = 'admin_bpo'`)
- **Cliente final**: External user from client company (`public.usuarios` WHERE `role = 'cliente_final'`)

**"Tarefa" can mean:**
- **Tarefa (instância)**: A concrete task occurrence with due date (`public.tarefas`: `id`)
- **Rotina modelo**: A reusable task template (`public.rotinas_modelo`: `id`)
- **Rotina cliente**: The assignment of a template to a specific client (`public.rotinas_cliente`: `id`)

**"Integração" means:**
- **Integração ERP**: Config record linking a client to an ERP system (`public.integracoes_erp`: `id`)
- Currently only `tipo_erp = 'F360'` exists

**Relationships:**
- `bpos` → `usuarios`: 1:many (via `bpo_id`)
- `bpos` → `clientes`: 1:many (via `bpo_id`)
- `clientes` → `tarefas`: 1:many (via `cliente_id`)
- `clientes` → `integracoes_erp`: 1:many (via `cliente_id`)
- `clientes` → `solicitacoes`: 1:many (via `cliente_id`)
- `rotinas_modelo` → `rotinas_cliente`: 1:many (via `rotina_modelo_id`)
- `rotinas_cliente` → `tarefas`: 1:many (via `rotina_cliente_id`)
- `tarefas` → `tarefa_checklist_itens`: 1:many (via `tarefa_id`)
- `solicitacoes` → `comentarios`: 1:many (via `solicitacao_id`)
- `solicitacoes` → `documentos`: 1:many (via `solicitacao_id`)

---

## Business Terminology

| Term | Definition | Notes |
|------|------------|-------|
| BPO | Business Process Outsourcing — the firm running the platform | Each BPO is a tenant (`bpos.id`) |
| Carteira | The portfolio of all clients managed by a BPO | Filtered by `bpo_id` |
| Rotina | A recurring task template (modelo) applied to clients | diaria, semanal, mensal, custom |
| Modo Foco | UI mode where operator works on one client at a time | No dedicated table — frontend state |
| F360 | Finanças 360 — external ERP for financial data | Integration via encrypted token |
| SLA | Service Level Agreement — task deadline compliance | Derived from `tarefas.data_vencimento` vs completion |
| Snapshot financeiro | Cached financial data from F360 sync | Table not yet created (planned) |
| Cofre de senhas | Encrypted secrets vault for client credentials | Table not yet created (planned: `segredos`) |
| Timesheet | Time tracking entries per operator per client | Table not yet created (planned) |
| Rentabilidade | Profitability per client (revenue - cost) | Calculated from timesheet + client revenue |
| CNPJ | Brazilian company tax ID (14 digits) | Unique per `bpo_id` in `clientes` |
| LGPD | Brazilian data protection law (like GDPR) | Impacts audit/logging requirements |

---

## Standard Filters

Always apply these filters unless explicitly told otherwise:

```sql
-- Multi-tenant isolation (ALWAYS required for direct SQL)
WHERE bpo_id = '<target_bpo_uuid>'

-- Exclude inactive/closed clients (for operational queries)
  AND c.status IN ('Ativo', 'Em implantação')

-- For task queries: exclude future tasks by default
  AND t.data_vencimento <= CURRENT_DATE
```

**When to override:**
- Include `status = 'Pausado'` or `'Encerrado'` clients when doing historical analysis
- Include future tasks when building calendar/forecast views
- When running admin-level reports across all clients, still always filter by `bpo_id`

---

## Key Metrics

### Taxa de Conclusão de Tarefas (Task Completion Rate)
- **Definition**: Percentage of tasks completed on or before due date
- **Formula**: `COUNT(*) FILTER (WHERE status = 'concluida' AND updated_at::date <= data_vencimento) / NULLIF(COUNT(*), 0) * 100`
- **Source**: `public.tarefas`
- **Time grain**: Daily / Weekly / Monthly
- **Caveats**: Tasks with `status = 'bloqueada'` should typically be excluded from rate calculation

### Tarefas Atrasadas (Overdue Tasks)
- **Definition**: Tasks past due date that are not completed
- **Formula**: `COUNT(*) FILTER (WHERE status NOT IN ('concluida') AND data_vencimento < CURRENT_DATE)`
- **Source**: `public.tarefas`
- **Time grain**: Real-time snapshot
- **Caveats**: Check if `status = 'atrasada'` is set or if you need to derive from date comparison

### Saúde da Integração (Integration Health)
- **Definition**: Percentage of active clients with working F360 integration
- **Formula**: `COUNT(ie.*) FILTER (WHERE ie.ativo = true) / NULLIF(COUNT(DISTINCT c.id), 0) * 100`
- **Source**: `public.integracoes_erp` JOIN `public.clientes`
- **Caveats**: `ativo` defaults to `false` — only `true` after successful F360 connection test

### Solicitações Abertas por Cliente (Open Requests per Client)
- **Definition**: Count of unresolved requests per client
- **Formula**: `COUNT(*) FILTER (WHERE status IN ('aberta', 'em_andamento'))`
- **Source**: `public.solicitacoes`
- **Time grain**: Real-time snapshot

### Progresso de Checklist (Checklist Progress)
- **Definition**: Percentage of checklist items completed per task
- **Formula**: `COUNT(*) FILTER (WHERE concluido = true) / NULLIF(COUNT(*), 0) * 100`
- **Source**: `public.tarefa_checklist_itens`

---

## Data Freshness

| Table | Update Frequency | Typical Lag |
|-------|------------------|-------------|
| `clientes` | On user action | Real-time |
| `tarefas` | On user action + scheduled generation | Real-time |
| `integracoes_erp` | On config change | Real-time |
| `solicitacoes` | On user action | Real-time |
| `tarefa_checklist_itens` | On user action | Real-time |
| `snapshots_financeiros` | Scheduled F360 sync (planned) | Up to 6 hours |

To check data freshness:
```sql
SELECT MAX(updated_at) AS latest_update FROM public.clientes WHERE bpo_id = '<bpo_id>';
SELECT MAX(created_at) AS latest_task FROM public.tarefas WHERE bpo_id = '<bpo_id>';
```

---

## Knowledge Base Navigation

Use these reference files for detailed table documentation:

| Domain | Reference File | Use For |
|--------|----------------|---------|
| Identity & Auth | `references/tables/identity-auth.md` | bpos, usuarios, roles, RLS helpers |
| Clients | `references/tables/clients.md` | clientes, cliente_preferencias, integracoes_erp |
| Tasks & Routines | `references/tables/tasks-routines.md` | rotinas_modelo, rotinas_cliente, tarefas, checklist, historico |
| Communication | `references/tables/communication.md` | solicitacoes, comentarios, documentos |
| Entities | `references/entities.md` | Entity definitions, relationships, ER diagram |
| Metrics | `references/metrics.md` | KPI calculations and formulas |

---

## Common Query Patterns

### List active clients with task counts
```sql
SELECT
    c.id,
    c.razao_social,
    c.nome_fantasia,
    c.status,
    COUNT(t.id) FILTER (WHERE t.status = 'a_fazer') AS tarefas_pendentes,
    COUNT(t.id) FILTER (WHERE t.status = 'concluida') AS tarefas_concluidas,
    COUNT(t.id) FILTER (WHERE t.data_vencimento < CURRENT_DATE AND t.status NOT IN ('concluida')) AS tarefas_atrasadas
FROM public.clientes c
LEFT JOIN public.tarefas t ON t.cliente_id = c.id
WHERE c.bpo_id = '<bpo_id>'
  AND c.status = 'Ativo'
GROUP BY c.id, c.razao_social, c.nome_fantasia, c.status
ORDER BY tarefas_atrasadas DESC;
```

### Operator daily workload (Painel Hoje)
```sql
SELECT
    t.id,
    t.titulo,
    c.nome_fantasia AS cliente,
    t.prioridade,
    t.status,
    t.data_vencimento
FROM public.tarefas t
JOIN public.clientes c ON c.id = t.cliente_id
WHERE t.bpo_id = '<bpo_id>'
  AND t.responsavel_id = '<usuario_id>'
  AND t.data_vencimento = CURRENT_DATE
  AND t.status IN ('a_fazer', 'em_andamento')
ORDER BY
    CASE t.prioridade
        WHEN 'urgente' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'media' THEN 3
        WHEN 'baixa' THEN 4
    END;
```

### Integration status overview
```sql
SELECT
    c.id AS cliente_id,
    c.nome_fantasia,
    ie.tipo_erp,
    ie.ativo,
    ie.token_configurado_em,
    ie.updated_at AS ultima_atualizacao
FROM public.clientes c
LEFT JOIN public.integracoes_erp ie ON ie.cliente_id = c.id
WHERE c.bpo_id = '<bpo_id>'
  AND c.status = 'Ativo'
ORDER BY ie.ativo ASC NULLS FIRST, c.nome_fantasia;
```

### Client timeline (unified events)
```sql
WITH timeline AS (
    SELECT
        s.created_at AS evento_em,
        'solicitacao_criada' AS tipo_evento,
        s.titulo AS descricao,
        s.criado_por_id AS usuario_id,
        s.cliente_id
    FROM public.solicitacoes s
    WHERE s.bpo_id = '<bpo_id>' AND s.cliente_id = '<cliente_id>'

    UNION ALL

    SELECT
        cm.created_at AS evento_em,
        'comentario' AS tipo_evento,
        LEFT(cm.texto, 100) AS descricao,
        cm.autor_id AS usuario_id,
        s.cliente_id
    FROM public.comentarios cm
    JOIN public.solicitacoes s ON s.id = cm.solicitacao_id
    WHERE cm.bpo_id = '<bpo_id>' AND s.cliente_id = '<cliente_id>'

    UNION ALL

    SELECT
        d.created_at AS evento_em,
        'documento_anexado' AS tipo_evento,
        d.nome_arquivo AS descricao,
        d.criado_por_id AS usuario_id,
        d.cliente_id
    FROM public.documentos d
    WHERE d.bpo_id = '<bpo_id>' AND d.cliente_id = '<cliente_id>'
)
SELECT * FROM timeline
ORDER BY evento_em DESC
LIMIT 50;
```

---

## Troubleshooting

### Common Mistakes
- **Forgetting `bpo_id` filter**: Every query MUST include `WHERE bpo_id = '...'` when using service role SQL. RLS handles this automatically via Supabase client, but direct SQL does NOT.
- **Confusing `rotinas_modelo` with `rotinas_cliente`**: Modelo = template library; rotina_cliente = assignment of that template to a specific client with schedule config.
- **Status values are PT-BR strings**: Task statuses are `'a_fazer'`, `'em_andamento'`, `'concluida'`, `'atrasada'`, `'bloqueada'` — not English.
- **`integracoes_erp.ativo` defaults to FALSE**: A record existing doesn't mean integration is active. Always check `ativo = true`.
- **Duplicate `documentos` migrations**: There are two migrations creating `public.documentos`. The later one (20260314240000) includes `tarefa_id` — use that schema as canonical.

### Access & RLS Notes
- All tables have RLS enabled with policies scoped to `bpo_id`
- `cliente_final` users can only see their own `cliente_id` data
- `operador_bpo` can see all clients within their `bpo_id`
- `admin_bpo` and `gestor_bpo` have full BPO-scoped access

### Performance Tips
- Filter by `bpo_id` first — all tables are indexed on it
- For task queries, use `idx_tarefas_data_vencimento` index
- For large client portfolios, paginate with `LIMIT/OFFSET` or keyset pagination
- Prefer `COUNT(*) FILTER (WHERE ...)` over subqueries for conditional aggregation
