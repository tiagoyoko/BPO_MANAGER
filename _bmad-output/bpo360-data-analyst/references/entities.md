# BPO360 Entity Definitions & Relationships

## Entity Hierarchy

```
BPO (tenant)
├── Usuarios (users — all roles)
│   ├── admin_bpo
│   ├── gestor_bpo
│   ├── operador_bpo
│   └── cliente_final → linked to one Cliente
├── Clientes (companies served)
│   ├── Integracoes ERP (F360 config per client)
│   ├── Rotinas Cliente (routine assignments)
│   │   └── Tarefas (task instances)
│   │       ├── Tarefa Checklist Itens
│   │       ├── Tarefa Checklist Logs
│   │       ├── Tarefa Historico
│   │       └── Documentos (attachments)
│   ├── Solicitacoes (requests/tickets)
│   │   ├── Comentarios
│   │   └── Documentos (attachments)
│   └── Cliente Preferencias (notification prefs)
└── Rotinas Modelo (task templates — BPO-wide library)
    └── Rotina Modelo Checklist Itens
```

---

## Core Entities

### BPO (Tenant)
- **Table**: `public.bpos`
- **PK**: `id` (UUID)
- **What it represents**: The BPO company operating the platform. Every row in the system belongs to exactly one BPO.
- **Key fields**: `nome`, `created_at`, `updated_at`
- **Multi-tenancy**: `bpo_id` column appears in ALL domain tables. RLS policies enforce isolation.

### Usuario (User)
- **Table**: `public.usuarios`
- **PK**: `id` (UUID) — references `auth.users(id)`
- **What it represents**: A person with access to the system. Roles determine what they can see/do.
- **Key fields**: `bpo_id`, `role` (enum `papel_bpo`), `cliente_id` (nullable — required only for `cliente_final`), `nome`, `email`
- **Roles enum** (`public.papel_bpo`):
  - `admin_bpo` — full admin access within BPO
  - `gestor_bpo` — manager, oversees portfolio
  - `operador_bpo` — executes tasks daily
  - `cliente_final` — external user, restricted to their own company
- **Constraint**: `cliente_final` users MUST have a non-null `cliente_id`

### Cliente (Client Company)
- **Table**: `public.clientes`
- **PK**: `id` (UUID)
- **What it represents**: A company serviced by the BPO firm. Central entity for most operations.
- **Key fields**: `bpo_id`, `cnpj` (unique per bpo), `razao_social`, `nome_fantasia`, `email`, `telefone`, `responsavel_interno_id` (FK to `usuarios`), `receita_estimada` (NUMERIC), `status`, `tags` (JSONB array)
- **Status values**: `'Ativo'`, `'Em implantação'`, `'Pausado'`, `'Encerrado'`
- **Unique constraint**: `(bpo_id, cnpj)` — same CNPJ can exist in different BPOs

### Tarefa (Task Instance)
- **Table**: `public.tarefas`
- **PK**: `id` (UUID)
- **What it represents**: A concrete task with a due date, assigned to a client and optionally to an operator.
- **Key fields**: `bpo_id`, `cliente_id`, `rotina_cliente_id` (nullable), `titulo`, `data_vencimento` (DATE), `status`, `prioridade`, `responsavel_id` (FK to `usuarios`)
- **Status values**: `'a_fazer'`, `'em_andamento'`, `'concluida'`, `'atrasada'`, `'bloqueada'`
- **Priority values**: `'baixa'`, `'media'`, `'alta'`, `'urgente'`

### Solicitacao (Request/Ticket)
- **Table**: `public.solicitacoes`
- **PK**: `id` (UUID)
- **What it represents**: A request or ticket associated with a client — can be opened internally or by the client.
- **Key fields**: `bpo_id`, `cliente_id`, `titulo`, `descricao`, `tipo`, `prioridade`, `tarefa_id` (nullable link to related task), `status`, `origem`, `criado_por_id`
- **Type values**: `'documento_faltando'`, `'duvida'`, `'ajuste'`, `'outro'`
- **Status values**: `'aberta'`, `'em_andamento'`, `'resolvida'`, `'fechada'`
- **Origin values**: `'interno'`, `'cliente'`

---

## Join Map

| From | To | Join Key | Cardinality |
|------|----|----------|-------------|
| `bpos` | `usuarios` | `usuarios.bpo_id = bpos.id` | 1:N |
| `bpos` | `clientes` | `clientes.bpo_id = bpos.id` | 1:N |
| `clientes` | `usuarios` | `usuarios.cliente_id = clientes.id` | 1:N (only `cliente_final`) |
| `clientes` | `integracoes_erp` | `integracoes_erp.cliente_id = clientes.id` | 1:N |
| `clientes` | `rotinas_cliente` | `rotinas_cliente.cliente_id = clientes.id` | 1:N |
| `clientes` | `tarefas` | `tarefas.cliente_id = clientes.id` | 1:N |
| `clientes` | `solicitacoes` | `solicitacoes.cliente_id = clientes.id` | 1:N |
| `clientes` | `documentos` | `documentos.cliente_id = clientes.id` | 1:N |
| `clientes` | `cliente_preferencias` | `cliente_preferencias.cliente_id = clientes.id` | 1:1 |
| `rotinas_modelo` | `rotina_modelo_checklist_itens` | `rotina_modelo_checklist_itens.rotina_modelo_id = rotinas_modelo.id` | 1:N |
| `rotinas_modelo` | `rotinas_cliente` | `rotinas_cliente.rotina_modelo_id = rotinas_modelo.id` | 1:N |
| `rotinas_cliente` | `tarefas` | `tarefas.rotina_cliente_id = rotinas_cliente.id` | 1:N |
| `tarefas` | `tarefa_checklist_itens` | `tarefa_checklist_itens.tarefa_id = tarefas.id` | 1:N |
| `tarefas` | `tarefa_checklist_logs` | `tarefa_checklist_logs.tarefa_id = tarefas.id` | 1:N |
| `tarefas` | `tarefa_historico` | `tarefa_historico.tarefa_id = tarefas.id` | 1:N |
| `tarefas` | `documentos` | `documentos.tarefa_id = tarefas.id` | 1:N |
| `solicitacoes` | `comentarios` | `comentarios.solicitacao_id = solicitacoes.id` | 1:N |
| `solicitacoes` | `documentos` | `documentos.solicitacao_id = solicitacoes.id` | 1:N |
| `usuarios` | `tarefas` | `tarefas.responsavel_id = usuarios.id` | 1:N |
| `usuarios` | `clientes` | `clientes.responsavel_interno_id = usuarios.id` | 1:N |

---

## Tables Not Yet Created (Planned)

These entities are defined in the architecture but migrations haven't been written yet:

| Entity | Planned Table | Purpose |
|--------|--------------|---------|
| Snapshot Financeiro | `snapshots_financeiros` | Cached F360 financial data per client |
| Segredo (Vault) | `segredos` | Encrypted secrets vault with audit trail |
| Timesheet Entry | `timesheets` | Time tracking per operator/task/client |
| Empresa ERP Mapeada | `empresas_erp_mapeadas` | F360 company → BPO client mapping |
| Conta ERP Mapeada | `contas_erp_mapeadas` | F360 bank account selection per client |
