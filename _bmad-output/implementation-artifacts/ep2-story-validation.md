# Validação das Stories do Epic 2

**Data:** 2026-03-14  
**Escopo:** Epic 2 – Rotinas, Tarefas, Checklists e Atribuição em Massa  
**FRs do épico (epics.md):** RF-04, RF-05, RF-06, RF-07, RF-08, RF-32, RF-33, RF-34, RF-35

---

## 1. Resumo executivo

| Story | Título | RFs | Status artefato | Pronto para dev? | Observações |
|-------|--------|-----|-----------------|------------------|-------------|
| 2.1 | Criar modelo de rotina padrão | RF-04, RF-32 | ready-for-dev | ✅ Sim | UI /modelos pendente na implementação |
| 2.2 | Aplicar modelo de rotina a um cliente | RF-05 | ready-for-dev | ✅ Sim | Depende de 2.1 |
| 2.3 | Visualizar e gerenciar tarefas em calendário/lista | RF-06, RF-07 | ready-for-dev | ✅ Sim | Depende de 2.1 e 2.2 |
| 2.4 | Executar checklist de uma tarefa | RF-07, RF-08 | ready-for-dev | ✅ Sim | Depende de 2.2 e 2.3 |
| 2.5 | Atribuição em massa de tarefas | RF-35, RF-08 | ready-for-dev | ✅ Sim | Depende de 2.3 |
| 2.6 | Editar configuração de rotinas em massa | RF-34 | ready-for-dev | ✅ Sim | Depende de 2.2 |

**Conclusão:** Todas as seis stories estão **consistentes com o épico**, com ACs mapeáveis aos FRs, dependências explícitas e referências à arquitetura. Nenhuma story invalida outra; há pontos a esclarecer (ver seção 4).

---

## 2. Cobertura de requisitos funcionais

| RF | Descrição | Story(s) que atendem |
|----|-----------|----------------------|
| RF-04 | Criar modelos de rotinas (periodicidade, tipo, checklists) | 2.1 |
| RF-05 | Instanciar rotinas por cliente (tarefas no calendário) | 2.2 |
| RF-06 | Configurar por tarefa (responsável, datas, prioridade, SLA) | 2.3 (listagem/filtros); 2.2 (responsável/prioridade na rotina) |
| RF-07 | Alterar status de tarefa | 2.3 (PATCH status), 2.4 (concluir com checklist) |
| RF-08 | Registrar histórico de mudanças e comentários | 2.4 (concluido_por_id, concluido_em), 2.5 (tarefa_historico) |
| RF-32 | Biblioteca de modelos reutilizáveis | 2.1 |
| RF-33 | Importar modelos para múltiplos clientes em lote | **Nenhuma story** – citado no épico; pode ser evolução ou story futura |
| RF-34 | Editar em massa recorrência, prioridade, responsável padrão | 2.6 |
| RF-35 | Atribuir/reatribuir tarefas em massa | 2.5 |

**Gap:** RF-33 (“Importar modelos para múltiplos clientes em lote”) não está coberto por nenhuma story do EP2. **Decisão (2026-03-14):** story futura (2.x) a ser criada quando priorizado.

---

## 3. Consistência com a arquitetura

### 3.1 Modelo de dados (architecture.md)

- **rotina_modelo** → tabelas `rotinas_modelo` e `rotina_modelo_checklist_itens` (2.1). ✅ Alinhado.
- **rotina_cliente** → tabela `rotinas_cliente` (2.2). ✅ Alinhado.
- **tarefa** → tabelas `tarefas` e `tarefa_checklist_itens` (2.2). ✅ Alinhado.

Naming: tabelas em snake_case plural; colunas snake_case; PK UUID; FKs com sufixo `_id`. Todas as stories seguem.

### 3.2 RLS e isolamento

- Todas as stories exigem **bpo_id** e políticas RLS para papéis internos (admin_bpo, gestor_bpo, operador_bpo). ✅
- 2.3 menciona **cliente_final** não acessar área BPO (ou só suas tarefas no portal); coerente com Epic 8.

### 3.3 API e frontend

- Resposta `{ data, error }`; JSON em camelCase; rotas REST plural. ✅ Todas as stories referenciam.
- Estrutura de pastas: `app/(bpo)/modelos`, `app/(bpo)/clientes/[id]/tarefas`, `app/(bpo)/tarefas/hoje`, etc., alinhadas a `bpo360-information-architecture.md`.

### 3.4 Pontos de atenção

- **2.2** – **Decisão:** operador_bpo pode aplicar modelo (admin_bpo, gestor_bpo e operador_bpo). Documentado na story 2.2.
- **2.4** – **Decisão:** itens opcionais podem ser desmarcados apenas até a tarefa ser concluída; após conclusão, ficam travados como os obrigatórios. Documentado na story 2.4.
- **2.5** – “usuário ou time”: artefato diz interpretar como “atribuir a um usuário”; entidade “time” como evolução. ✅ OK para não expandir escopo.

---

## 4. Dependências entre stories

```
2.1 (modelo + checklist)
  └── 2.2 (rotinas_cliente + tarefas + geração)
        ├── 2.3 (calendário/lista + detalhe tarefa)
        │     ├── 2.4 (executar checklist)
        │     └── 2.5 (atribuição em massa de tarefas)
        └── 2.6 (edição em massa de rotinas_cliente)
```

- **2.1** é pré-requisito de todas.
- **2.2** introduz `rotinas_cliente`, `tarefas` e `tarefa_checklist_itens`; 2.3, 2.4, 2.5 e 2.6 referenciam corretamente.
- **2.3** entrega lista e detalhe; 2.4 e 2.5 estendem a mesma UI (checklist e seleção múltipla).
- **2.6** atua sobre **rotinas_cliente** (não tarefas), distinção clara em relação a 2.5.

Ordem recomendada de implementação: **2.1 → 2.2 → 2.3 → 2.4**; 2.5 e 2.6 podem ser em paralelo após 2.3 (2.5) e 2.2 (2.6).

---

## 5. Validação por story

### 2.1 – Criar modelo de rotina padrão

| Critério | Resultado |
|----------|-----------|
| AC completos e testáveis | ✅ 4 ACs com Given/When/Then |
| Tasks cobrem todos os ACs | ✅ Tasks 1–5 mapeadas a AC 1–4 |
| Referências a architecture/epics/IA | ✅ architecture.md, epics.md, bpo360-information-architecture.md |
| Dev Notes e guardrails | ✅ Periodicidade custom, tipo serviço, ordenação documentados |
| Tipos e rotas | ✅ /api/modelos, /modelos; tipos em lib/domain/rotinas |

**Pendência:** Nenhuma no artefato; na implementação falta a página `/modelos` (UI).

---

### 2.2 – Aplicar modelo de rotina a um cliente

| Critério | Resultado |
|----------|-----------|
| AC completos | ✅ 4 ACs |
| Modelo de dados (rotinas_cliente, tarefas, tarefa_checklist_itens) | ✅ Colunas e FKs descritas |
| Lógica de geração (diária/semanal/mensal) | ✅ Task 2 descreve política (ex.: 30 dias ou 12 ocorrências) |
| API POST/GET clientes/[id]/rotinas | ✅ Contrato descrito |
| Dependência 2.1 | ✅ Explícita |

**Ponto aberto:** Frequência “custom” – tratada como mínima (default ou evolução); adequado para não atrasar 2.2.

---

### 2.3 – Visualizar e gerenciar tarefas em calendário/lista

| Critério | Resultado |
|----------|-----------|
| AC (calendário, lista, filtros, detalhe) | ✅ 4 ACs |
| GET /api/tarefas com filtros e paginação | ✅ Query params e resposta { tarefas, total, page, limit } |
| GET /api/tarefas/[id] com checklist | ✅ Inclui itens e comentários/histórico (placeholder se não existir) |
| Visão por cliente e “Hoje” | ✅ /clientes/[id]/tarefas e /tarefas/hoje |
| Comentários/histórico | ✅ Mínimo: “Sem comentários” e seção vazia; evolução em 2.4 ou tabela dedicada |

**Consistência:** Status “atrasada” pode ser derivado (data_vencimento < hoje e status != concluida); story deixa flexível. ✅

---

### 2.4 – Executar checklist de uma tarefa

| Critério | Resultado |
|----------|-----------|
| Concluir tarefa só com obrigatórios | ✅ PATCH status validado no backend |
| Desmarcar obrigatório após conclusão | ✅ Bloqueado (400) |
| PATCH checklist/[itemId] com concluido_por_id, concluido_em | ✅ Task 1 e 4 |
| UI na tela de detalhe (2.3) | ✅ Task 5 referencia drawer/página da 2.3 |

**Regra a fixar:** Itens opcionais – permitir desmarcar “sempre” ou “até tarefa concluída”; documentar na Dev Notes.

---

### 2.5 – Atribuição em massa de tarefas

| Critério | Resultado |
|----------|-----------|
| API em massa (tarefaIds, responsavelId) | ✅ POST atribuir-massa com resposta { sucesso, falhas[] } |
| Papel (apenas gestor/admin) | ✅ Guard e testes |
| responsavelId do mesmo BPO | ✅ Validação e teste |
| Histórico (tarefa_historico) | ✅ Task 4 descreve tabela e inserção |

**Alinhamento:** Padrão de “sucesso + falhas por tarefa” reutilizável em 2.6. ✅

---

### 2.6 – Editar configuração de rotinas em massa

| Critério | Resultado |
|----------|-----------|
| Escopo em rotinas_cliente (não tarefas) | ✅ Diferença em relação a 2.5 explícita nas Dev Notes |
| Campos: prioridade, responsavel_padrao_id, frequencia, data_inicio | ✅ Task 1 |
| Resumo antes de confirmar | ✅ Task 2 (preview ou mensagem “N rotinas serão atualizadas”) |
| Tarefas já geradas não alteradas | ✅ Documentado |

**Consistência:** GET para listar rotinas já previsto em 2.2 (GET /api/clientes/[id]/rotinas). ✅

---

## 6. Checklist de implementação readiness

- [x] Todas as stories têm User Story + AC em formato Given/When/Then.
- [x] Tasks e subtasks cobrem backend (modelo, API, RLS), frontend e testes.
- [x] Referências a architecture.md, epics.md e artefatos anteriores estão corretas.
- [x] Dependências entre 2.1–2.6 estão explícitas e em ordem coerente.
- [x] Naming (DB snake_case, API camelCase, rotas plural) respeitado.
- [x] **RF-33** (importar modelos em lote) – decisão: story futura 2.x quando priorizado.
- [x] **2.2** – operador_bpo pode aplicar modelo (admin_bpo, gestor_bpo, operador_bpo).
- [x] **2.4** – itens opcionais: desmarcar apenas até a tarefa ser concluída.

---

## 7. Ações recomendadas

1. ~~RF-33~~ – **Concluído:** story futura 2.x quando priorizado.
2. ~~2.2 / 2.4~~ – **Concluído:** decisões documentadas nas stories. 
3. **Dev:** Ao implementar 2.1, concluir a UI em `app/(bpo)/modelos/` (biblioteca + formulário com reordenação de itens).

---

*Validação gerada com base em: sprint-status.yaml, implementation-artifacts 2-1 a 2-6, planning-artifacts (epics.md, architecture.md, prd, bpo360-information-architecture).*
