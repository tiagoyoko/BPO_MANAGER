# Sprint Change Proposal – 2026-03-14

## 1. Issue Summary

O plano original da Sprint 2 foi definido como `8.3 + 8.4`, com objetivo de encerrar o `EP8`. Depois disso, o estado real do backlog mudou:

- `2-1-criar-modelo-de-rotina-padrao` passou para `ready-for-dev`
- `epic-2` passou para `in-progress`
- `8.3` e `8.4` continuaram `ready-for-dev`

Isso criou um desalinhamento entre o plano da sprint e o trabalho efetivamente puxado no backlog.

Problema prático:

- a sprint ficou concentrada demais em segurança/infraestrutura
- uma story operacional já pronta (`2.1`) ficou fora do compromisso principal
- `8.4` eleva muito o risco de overcommit por ser mais transversal e mais pesada que as demais

---

## 2. Impact Analysis

### Epic Impact

- **EP8** continua prioritário, mas deixa de monopolizar o compromisso da Sprint 2.
- **EP2** entra formalmente no escopo da Sprint 2 por já estar `in-progress` e ter a story `2.1` pronta.

### Story Impact

- **8.3** permanece no compromisso principal.
- **2.1** entra no compromisso principal.
- **8.4** sai do compromisso principal e vira stretch goal.

### Artifact Conflicts

- O plano anterior da Sprint 2 precisava ser atualizado para refletir o backlog real.
- O `sprint-status.yaml` já indica abertura de `EP2`, então mantê-lo fora do plano criava conflito entre planejamento e execução.

### Technical Impact

- `8.3` é uma extensão natural da base de auth/RLS já implementada.
- `2.1` é uma story de início de domínio operacional, com escopo mais controlável.
- `8.4` exige nova estrutura de dados, criptografia dedicada, auditoria e UI própria, com custo técnico maior.

---

## 3. Recommended Approach

**Abordagem escolhida:** ajuste direto do escopo da sprint com reclassificação de prioridade.

### Novo compromisso da Sprint 2

- `8.3-cadastrar-usuarios-de-clientes-acesso-por-cnpj`
- `2.1-criar-modelo-de-rotina-padrao`

### Novo stretch goal

- `8.4-cofre-de-senhas-segredos-criptografados-e-auditoria`

### Rationale

- reduz risco de overcommit
- alinha a sprint ao que já está em andamento no backlog
- preserva uma entrega de fundação (`8.3`) e uma entrega funcional de produto (`2.1`)
- trata `8.4` com o espaço técnico que ela exige

### Scope Classification

**Moderate**

Requer reorganização de backlog e atualização do plano da sprint, mas não exige mudança de PRD, arquitetura macro ou redefinição de produto.

---

## 4. Detailed Change Proposals

### Story Planning Change

**OLD**

- Sprint 2: `8.3 + 8.4`

**NEW**

- Sprint 2: `8.3 + 2.1`
- Stretch: `8.4`

**Justification**

`8.4` tem maior risco e maior superfície técnica; `2.1` já está pronta para desenvolvimento e inaugura o fluxo operacional do `EP2`.

### Roadmap Adjustment

**OLD**

- Fechar todo o `EP8` antes de iniciar `EP2`

**NEW**

- Fechar `8.3`
- Iniciar `EP2` com `2.1`
- Reavaliar `8.4` ao fim da sprint ou levá-la para Sprint 3

**Justification**

A fundação mínima já está estabelecida com `8.1`, `8.2` e `EP1` concluídos. O custo de adiar `8.4` é menor do que o custo de sobrecarregar a sprint.

---

## 5. Implementation Handoff

### Handoff Recipients

- **Scrum Master / PO:** manter o plano da sprint alinhado ao tracker
- **Dev:** executar `8.3` e `2.1` como compromisso principal

### Success Criteria

- `8.3` concluída e validada
- `2.1` concluída e validada
- `8.4` claramente classificada como stretch ou próxima sprint
- plano de sprint e execução sem conflito entre si

### Deliverables

- plano replanejado da Sprint 2
- proposta formal de mudança de sprint

