# Plano de Implementação – Sprint 2 (BPO360)

**Data:** 2026-03-14  
**Projeto:** BPO_MANAGER (BPO360)  
**Base:** estado atual em `sprint-status.yaml`, stories `ready-for-dev` e correção de rumo da sprint

---

## Objetivo da Sprint 2

Equilibrar **continuidade da fundação** com **avanço funcional visível**, sem abrir uma sprint superdimensionada.

O foco replanejado da Sprint 2 passa a ser:

- concluir a entrega de acesso externo do `cliente_final`
- iniciar o núcleo operacional de rotinas com a biblioteca de modelos

---

## Motivo do Replanejamento

O plano anterior colocava `8.3` e `8.4` juntos para encerrar o `EP8`. Esse plano ficou desalinhado com o estado real do backlog, porque:

- `2-1` passou a estar `ready-for-dev`
- `epic-2` já está `in-progress`
- `8-4` é uma story significativamente maior e mais transversal que `8-3`

Manter `8.3 + 8.4` como compromisso principal aumenta o risco de uma sprint pesada demais em segurança/infrastructure, sem ganho funcional equivalente na operação. O replanejamento corrige isso.

---

## Escopo Replanejado

### Compromisso principal

| # | Story ID | Título | Épico | Prioridade |
|---|----------|--------|-------|------------|
| 1 | **8.3** | Cadastrar usuários de clientes (acesso por CNPJ) | EP8 | P0 |
| 2 | **2.1** | Criar modelo de rotina padrão | EP2 | P0 |

### Stretch goal

| # | Story ID | Título | Épico | Prioridade |
|---|----------|--------|-------|------------|
| S1 | **8.4** | Cofre de senhas (segredos criptografados e auditoria) | EP8 | P1 |

---

## Ordem Recomendada

**Sequência recomendada:** `8.3 -> 2.1 -> 8.4 (se houver capacidade)`

**Racional:**

- `8.3` fecha uma lacuna importante da fundação de acesso e reduz risco de autorização.
- `2.1` abre valor operacional real e dá sequência ao fato de `EP2` já estar em andamento.
- `8.4` continua importante, mas é melhor tratá-la como stretch devido ao tamanho e ao impacto transversal em banco, criptografia, auditoria, API e UI.

---

## Detalhamento das Stories Comprometidas

### Story 8.3: Cadastrar usuários de clientes (acesso por CNPJ)

**Objetivo:** permitir que `admin_bpo` e `gestor_bpo` criem e gerenciem usuários `cliente_final` vinculados a um `cliente_id`, com isolamento por `bpo_id` e `cliente_id`.

**Entregas esperadas:**

- API para criar, listar e editar usuários de clientes
- validação de `cliente_id` dentro do mesmo BPO
- UI administrativa para esse fluxo
- rota/layout de portal restrita a `cliente_final`

**Valor da sprint:**

- fecha parte crítica da fundação de acesso
- prepara a trilha do portal do cliente sem depender ainda do Epic 3 completo

---

### Story 2.1: Criar modelo de rotina padrão

**Objetivo:** permitir que o gestor de BPO crie modelos reutilizáveis de rotina com checklist ordenável.

**Entregas esperadas:**

- modelo de dados para `rotinas_modelo` e itens de checklist
- APIs de criação, listagem e edição mínima
- página `/modelos` com biblioteca e formulário
- persistência da ordem dos itens do checklist

**Valor da sprint:**

- inaugura o fluxo operacional do `EP2`
- cria base para `2.2` e `2.3`
- entrega funcionalidade mais visível ao produto do que uma sprint puramente de infraestrutura

---

## Story Remanejada

### Story 8.4: Cofre de senhas (segredos criptografados e auditoria)

**Novo tratamento:** sair do compromisso principal da Sprint 2 e virar `stretch goal` ou candidata à Sprint 3.

**Motivo:**

- envolve migração nova, criptografia dedicada, trilha de auditoria, múltiplos endpoints e UI própria
- tem maior risco técnico e maior superfície de testes
- não bloqueia `2.1`
- agrega mais valor quando implementada com espaço suficiente para revisão rigorosa

---

## Impacto nos Artefatos

### Plano da sprint

**OLD**

- Sprint 2 comprometida com `8.3 + 8.4`

**NEW**

- Sprint 2 comprometida com `8.3 + 2.1`
- `8.4` vira stretch goal

**Racional:** reduzir risco de overcommit e alinhar a sprint ao backlog já puxado (`EP2 in-progress`).

### Roadmap de curto prazo

**OLD**

- Encerrar `EP8` antes de abrir nova frente operacional

**NEW**

- Fechar `8.3`
- Iniciar `EP2` formalmente com `2.1`
- Avaliar `8.4` no restante da sprint ou mover para Sprint 3

**Racional:** a fundação principal já existe (`8.1`, `8.2`, `EP1` concluídos), então o custo de adiar `8.4` é aceitável.

---

## Definição de Pronto (Sprint 2 Replanejada)

- [ ] Story `8.3` concluída com guards, RLS, API e UI administrativa
- [ ] Story `2.1` concluída com banco, API e UI da biblioteca de modelos
- [ ] `cliente_final` segue isolado por `cliente_id`
- [ ] modelos de rotina respeitam isolamento por `bpo_id`
- [ ] testes cobrindo autorização, isolamento e regras principais das duas stories
- [ ] `8.4` claramente classificada como stretch ou backlog da próxima sprint

---

## Riscos e Contenção

- **Risco:** paralelismo entre `EP8` e `EP2` pode fragmentar contexto.
  **Contenção:** limitar escopo de `8.3` ao essencial e não puxar `8.4` sem capacidade real.

- **Risco:** `2.1` crescer demais se tentar resolver geração de recorrência completa.
  **Contenção:** manter estritamente no escopo de biblioteca/modelo; geração de tarefas fica para `2.2`.

- **Risco:** `8.4` entrar no meio da sprint e competir com revisão das duas stories principais.
  **Contenção:** só iniciar `8.4` após `8.3` ou `2.1` estarem em review avançado.

---

## Próximo Passo Recomendado

1. Executar `8.3` como primeira story da sprint.
2. Em seguida, implementar `2.1`.
3. Só então decidir se `8.4` entra ainda nesta sprint.

---

## Referências

- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/8-3-cadastrar-usuarios-de-clientes-acesso-por-cnpj.md`
- `_bmad-output/implementation-artifacts/8-4-cofre-de-senhas-segredos-criptografados-e-auditoria.md`
- `_bmad-output/implementation-artifacts/2-1-criar-modelo-de-rotina-padrao.md`
- `_bmad-output/planning-artifacts/epics.md`
