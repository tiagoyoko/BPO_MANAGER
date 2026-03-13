# 3. Escopo do MVP

## 3.1. Escopo incluído

- **Gestão de clientes e configurações por ERP:**
  - Cadastro de clientes BPO (CNPJ, dados básicos, parâmetros financeiros).  
  - Associação de cada cliente ao **F360** (ERP principal) e possibilidade estrutural de múltiplos ERPs.

- **Rotinas, tarefas e checklists (modelo PlayBPO-like):**
  - Modelos de rotinas recorrentes (contas a pagar, receber, conciliação, fechamento, folha etc.).  
  - Geração automática de tarefas em calendário por cliente.  
  - Checklists detalhados por tarefa, com status, responsáveis, prazos e prioridade.

- **Central de comunicação e documentos:**
  - Registro de solicitações e pendências.  
  - Upload de documentos, vinculação a tarefas e histórico unificado por cliente.

- **Indicadores financeiros integrados ao F360 (obrigatório no MVP):**
  - Dashboard com:
    - Saldo do dia por conta e consolidado  
    - Contas a receber de hoje e vencidas  
    - Contas a pagar de hoje e vencidas  
    - Conciliações bancárias pendentes  
  - Atualização agendada + atualização manual, com timestamp visível.

- **Timesheet, custo operacional e rentabilidade:**
  - Registro de horas por tarefa e por cliente.  
  - Cadastro de custo/hora por operador.  
  - Cálculo de custo da operação por cliente/tarefa.  
  - Indicadores de rentabilidade (receita x custo x margem).

- **Atribuição e configuração em massa:**
  - Biblioteca de modelos de tarefas/rotinas.  
  - Importação de modelos para múltiplos clientes.  
  - Edição em massa de recorrência, responsável, vencimento e prioridade.  
  - Atribuição em massa de tarefas a operadores.

- **Modo foco “uma empresa por vez”:**
  - Modo de trabalho focado por cliente, com controles para reduzir alternância excessiva.  
  - Registro de períodos de foco no timesheet.

- **Segurança básica + cofre de senhas:**
  - Gestão de usuários (admin, gestor, operador, cliente).  
  - Criptografia em repouso de segredos (tokens, senhas).  
  - Cofre de senhas com mascaramento e trilha de acesso.

## 3.2. Fora de escopo (MVP, mas previsto)

- IA para autopreenchimento de lançamentos a partir de documentos.  
- Integração profunda com outros ERPs (Omie, Conta Azul, Nibo etc.).  
- App mobile próprio para cliente final (estágio 2, similar ao “Financeiro na Mão”).  
- SLA enterprise formal (99,9% uptime) e certificações (ISO, SOC2).  
- Mecanismos completos de billing/assinaturas para terceiros (BPOs externos).

---
