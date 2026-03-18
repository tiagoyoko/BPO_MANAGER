# BPO360 Key Metrics & KPI Calculations

## Operational Metrics

### 1. Taxa de Conclusão de Tarefas (Task Completion Rate)
- **Definition**: % of tasks completed on or before due date within a period
- **Formula**:
```sql
SELECT
    COUNT(*) FILTER (WHERE status = 'concluida' AND updated_at::date <= data_vencimento) * 100.0
    / NULLIF(COUNT(*) FILTER (WHERE status != 'bloqueada'), 0) AS taxa_conclusao
FROM public.tarefas
WHERE bpo_id = '<bpo_id>'
  AND data_vencimento BETWEEN '<start_date>' AND '<end_date>';
```
- **Source**: `public.tarefas`
- **Grain**: Daily, Weekly, Monthly
- **Caveats**: Exclude `bloqueada` tasks from denominator. `updated_at` approximates completion time (no dedicated `concluida_em` column yet).

### 2. Tarefas Atrasadas (Overdue Tasks — Snapshot)
- **Definition**: Count of tasks past due date that are still open
- **Formula**:
```sql
SELECT COUNT(*)
FROM public.tarefas
WHERE bpo_id = '<bpo_id>'
  AND data_vencimento < CURRENT_DATE
  AND status NOT IN ('concluida', 'bloqueada');
```
- **Source**: `public.tarefas`
- **Grain**: Real-time snapshot
- **Caveats**: The `atrasada` status may or may not be set explicitly — safer to derive from date.

### 3. Tarefas Atrasadas por Cliente (Overdue per Client)
- **Definition**: Breakdown of overdue tasks grouped by client
- **Formula**:
```sql
SELECT
    c.id AS cliente_id,
    c.nome_fantasia,
    COUNT(t.id) AS tarefas_atrasadas
FROM public.clientes c
LEFT JOIN public.tarefas t ON t.cliente_id = c.id
    AND t.data_vencimento < CURRENT_DATE
    AND t.status NOT IN ('concluida', 'bloqueada')
WHERE c.bpo_id = '<bpo_id>' AND c.status = 'Ativo'
GROUP BY c.id, c.nome_fantasia
ORDER BY tarefas_atrasadas DESC;
```
- **Use for**: Client risk assessment, portfolio health dashboard

### 4. Progresso de Checklist por Tarefa (Checklist Completion %)
- **Definition**: % of checklist items marked as done for a task
- **Formula**:
```sql
SELECT
    t.id AS tarefa_id,
    t.titulo,
    COUNT(ci.id) AS total_itens,
    COUNT(ci.id) FILTER (WHERE ci.concluido = true) AS itens_concluidos,
    ROUND(
        COUNT(ci.id) FILTER (WHERE ci.concluido = true) * 100.0
        / NULLIF(COUNT(ci.id), 0), 1
    ) AS pct_concluido
FROM public.tarefas t
JOIN public.tarefa_checklist_itens ci ON ci.tarefa_id = t.id
WHERE t.bpo_id = '<bpo_id>'
GROUP BY t.id, t.titulo;
```
- **Source**: `public.tarefa_checklist_itens`

---

## Client Portfolio Metrics

### 5. Distribuição de Status de Clientes
- **Definition**: Count of clients by status
- **Formula**:
```sql
SELECT status, COUNT(*) AS total
FROM public.clientes
WHERE bpo_id = '<bpo_id>'
GROUP BY status
ORDER BY total DESC;
```

### 6. Receita Estimada Total da Carteira
- **Definition**: Sum of estimated revenue from active clients
- **Formula**:
```sql
SELECT
    SUM(receita_estimada) AS receita_total,
    COUNT(*) AS total_clientes,
    AVG(receita_estimada) AS ticket_medio
FROM public.clientes
WHERE bpo_id = '<bpo_id>'
  AND status = 'Ativo'
  AND receita_estimada IS NOT NULL;
```
- **Caveats**: `receita_estimada` is nullable and manually entered — may not reflect actual billing.

### 7. Clientes em Risco (At-Risk Clients)
- **Definition**: Active clients with high overdue task count or no integration
- **Formula**:
```sql
WITH client_risk AS (
    SELECT
        c.id,
        c.nome_fantasia,
        c.receita_estimada,
        COUNT(t.id) FILTER (WHERE t.data_vencimento < CURRENT_DATE AND t.status NOT IN ('concluida', 'bloqueada')) AS overdue_count,
        BOOL_OR(ie.ativo) AS has_active_integration
    FROM public.clientes c
    LEFT JOIN public.tarefas t ON t.cliente_id = c.id
    LEFT JOIN public.integracoes_erp ie ON ie.cliente_id = c.id
    WHERE c.bpo_id = '<bpo_id>' AND c.status = 'Ativo'
    GROUP BY c.id, c.nome_fantasia, c.receita_estimada
)
SELECT * FROM client_risk
WHERE overdue_count > 5 OR has_active_integration IS NOT TRUE
ORDER BY overdue_count DESC;
```

---

## Integration Metrics

### 8. Cobertura de Integração F360 (Integration Coverage)
- **Definition**: % of active clients with active F360 integration
- **Formula**:
```sql
SELECT
    COUNT(DISTINCT ie.cliente_id) FILTER (WHERE ie.ativo = true) * 100.0
    / NULLIF(COUNT(DISTINCT c.id), 0) AS pct_cobertura
FROM public.clientes c
LEFT JOIN public.integracoes_erp ie ON ie.cliente_id = c.id AND ie.tipo_erp = 'F360'
WHERE c.bpo_id = '<bpo_id>' AND c.status = 'Ativo';
```

### 9. Integração por Status
- **Definition**: Breakdown of integration states
- **Formula**:
```sql
SELECT
    CASE
        WHEN ie.id IS NULL THEN 'Sem integração'
        WHEN ie.ativo = true THEN 'Ativa'
        WHEN ie.token_f360_encrypted IS NOT NULL THEN 'Token configurado (inativa)'
        ELSE 'Pendente configuração'
    END AS status_integracao,
    COUNT(*) AS total
FROM public.clientes c
LEFT JOIN public.integracoes_erp ie ON ie.cliente_id = c.id
WHERE c.bpo_id = '<bpo_id>' AND c.status = 'Ativo'
GROUP BY status_integracao;
```

---

## Communication Metrics

### 10. Solicitações Abertas (Open Requests)
- **Definition**: Requests not yet resolved/closed
- **Formula**:
```sql
SELECT
    c.nome_fantasia,
    COUNT(s.id) AS abertas,
    MIN(s.created_at) AS mais_antiga
FROM public.solicitacoes s
JOIN public.clientes c ON c.id = s.cliente_id
WHERE s.bpo_id = '<bpo_id>'
  AND s.status IN ('aberta', 'em_andamento')
GROUP BY c.nome_fantasia
ORDER BY abertas DESC;
```

### 11. Tempo Médio de Resolução de Solicitações
- **Definition**: Average time from creation to resolution
- **Formula**:
```sql
SELECT
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) AS avg_horas_resolucao
FROM public.solicitacoes
WHERE bpo_id = '<bpo_id>'
  AND status IN ('resolvida', 'fechada')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';
```
- **Caveats**: Uses `updated_at` as proxy for resolution time (no explicit `resolvida_em` column).

---

## Planned Metrics (Not Yet Available)

| Metric | Depends On | Status |
|--------|-----------|--------|
| Rentabilidade por Cliente | `timesheets` table | Table not created |
| Margem Operacional | `timesheets` + `clientes.receita_estimada` | Table not created |
| Horas por Cliente/Operador | `timesheets` table | Table not created |
| Saldo Financeiro (F360) | `snapshots_financeiros` table | Table not created |
| Contas a Pagar/Receber | `snapshots_financeiros` table | Table not created |
