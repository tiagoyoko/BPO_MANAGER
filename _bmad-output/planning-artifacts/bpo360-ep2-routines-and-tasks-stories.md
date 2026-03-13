## EP2 – Rotinas, Tarefas, Checklists e Atribuição em Massa

### Contexto

Este épico cobre a definição de modelos de rotinas, geração de tarefas recorrentes, execução via checklists e operações em massa (atribuição e ajustes de configuração), garantindo padronização e eficiência na operação do BPO financeiro.

---

### US 2.1 – Criar modelo de rotina padrão

- **Como** gestor de BPO  
- **Quero** criar modelos de rotinas recorrentes com checklists  
- **Para** padronizar como o time executa processos (ex.: conciliação diária, fechamento mensal)  

**Critérios de aceite:**

- Tela de “Novo modelo de rotina” com campos: nome, descrição, periodicidade (diária, semanal, mensal, custom), tipo de serviço.  
- Possibilidade de adicionar/ordenar itens de checklist (título + descrição opcional).  
- Possibilidade de marcar passos como obrigatórios.  
- Modelo salvo aparece em uma biblioteca de modelos reutilizáveis.  

---

### US 2.2 – Aplicar modelo de rotina a um cliente

- **Como** gestor ou coordenador de BPO  
- **Quero** aplicar um modelo de rotina a um cliente  
- **Para** gerar automaticamente as tarefas recorrentes daquele processo para a empresa  

**Critérios de aceite:**

- A partir da ficha do cliente, é possível escolher “Adicionar rotina a partir de modelo”.  
- Usuário escolhe o modelo, define:
  - Data de início, frequência exata (ex.: todo dia útil, dia X do mês), horário opcional.  
  - Responsável padrão e prioridade.  
- Sistema gera instâncias de tarefas futuras conforme a recorrência configurada.  
- Rotina aplicada aparece na visão de calendário/cronograma do cliente.  

---

### US 2.3 – Visualizar e gerenciar tarefas recorrentes em calendário

- **Como** operador ou gestor de BPO  
- **Quero** ver tarefas em um calendário/lista por período  
- **Para** planejar e executar rotinas de forma organizada  

**Critérios de aceite:**

- Visão por cliente com:
  - Calendário (mensal/semanal) e/ou lista agrupada por data.  
  - Indicação visual de status (a fazer, em andamento, concluída, atrasada).  
- Filtros por tipo de rotina, responsável, status e prioridade.  
- Ao clicar em uma tarefa, abre-se o detalhe com checklist, comentários e histórico.  

---

### US 2.4 – Executar checklist de uma tarefa

- **Como** operador de BPO  
- **Quero** marcar itens de checklist de uma tarefa conforme executo  
- **Para** garantir que todos os passos da rotina foram seguidos  

**Critérios de aceite:**

- Na tela da tarefa é exibido o checklist com:
  - Itens obrigatórios e opcionais visualmente distintos.  
  - Marcação de concluído item a item; itens obrigatórios não podem ser desmarcados ao concluir a tarefa.  
- A tarefa só pode ser marcada como “Concluída” se:
  - Todos os itens obrigatórios do checklist estiverem marcados.  
- Histórico registra quem marcou/desmarcou cada item e quando.  

---

### US 2.5 – Atribuição em massa de tarefas

- **Como** gestor de BPO  
- **Quero** selecionar múltiplas tarefas e atribuí-las a um operador ou time de uma só vez  
- **Para** redistribuir carga de trabalho rapidamente  

**Critérios de aceite:**

- Visão de lista de tarefas com seleção múltipla (checkbox).  
- Ação em massa “Atribuir responsável” que:
  - Permite escolher usuário ou time.  
  - Aplica a mudança a todas as tarefas selecionadas.  
- Operação em massa registra em histórico da tarefa que o responsável foi alterado, por quem e quando.  
- A interface mostra feedback de sucesso/falha por tarefa (quando houver falha pontual).  

---

### US 2.6 – Editar configuração de rotinas em massa

- **Como** gestor de BPO  
- **Quero** ajustar recorrência, datas relativas, prioridade e responsável padrão de várias rotinas ao mesmo tempo  
- **Para** adaptar rapidamente o plano operacional quando há mudança de processo ou de equipe  

**Critérios de aceite:**

- Tela/lista de rotinas (não de tarefas individuais) com seleção múltipla.  
- Ações em massa disponíveis:
  - Alterar prioridade padrão.  
  - Alterar responsável padrão.  
  - Ajustar regra de recorrência (ex.: de mensal para quinzenal).  
  - Ajustar datas de início/fim de vigência da rotina.  
- As alterações passam a refletir apenas nas instâncias futuras (tarefas ainda não geradas ou não iniciadas, conforme regra a definir e documentar).  
- Sistema exibe resumo antes de confirmar (quantas rotinas serão afetadas, impacto previsto).  

