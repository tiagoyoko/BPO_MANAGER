## EP7 – Modo Foco por Empresa e Regras de Trabalho

### Contexto

Este épico cobre o “modo foco” do operador em um único cliente, o registro de blocos de tempo focado e políticas para limitar/disciplinar a alternância entre empresas ao longo do dia.

---

### US 7.1 – Entrar em modo foco em um cliente

- **Como** operador de BPO  
- **Quero** entrar em um modo de trabalho focado em um único cliente  
- **Para** reduzir distrações e alternância entre empresas enquanto executo as tarefas do dia  

**Critérios de aceite:**

- Na tela “Hoje” ou na lista de clientes, existe ação “Entrar em modo foco” para um cliente.  
- Ao entrar em foco:
  - A interface passa a exibir apenas tarefas, solicitações e indicadores daquele cliente.  
  - Há um banner fixo indicando “Modo foco: [Nome do cliente]”.  
- O modo foco persiste enquanto o operador não sair explicitamente ou trocar de cliente.  

---

### US 7.2 – Ver somente tarefas do cliente em foco

- **Como** operador em modo foco  
- **Quero** ver apenas as tarefas do cliente em foco  
- **Para** não misturar prioridades de outras empresas enquanto trabalho  

**Critérios de aceite:**

- Na lista “Hoje” e em visões de tarefas, quando em modo foco:
  - Só aparecem tarefas pertencentes ao cliente em foco.  
- Filtros de responsável, status e tipo continuam funcionando, porém sempre dentro do cliente em foco.  

---

### US 7.3 – Registrar blocos de tempo focado por cliente

- **Como** gestor de BPO  
- **Quero** saber quanto tempo meus operadores passam focados em cada cliente  
- **Para** avaliar disciplina de foco e impacto na produtividade  

**Critérios de aceite:**

- Ao ativar modo foco, inicia-se um “bloco de foco” para aquele cliente (timestamp de início).  
- Ao sair do modo foco ou trocar de cliente, o bloco é encerrado (timestamp de fim).  
- Blocos de foco ficam registrados em entidade própria ou associados ao timesheet, sem interferir diretamente no tempo por tarefa.  
- É possível ver, em relatórios, o tempo total em modo foco por cliente e por operador.  

---

### US 7.4 – Limitar número de clientes ativos por dia/turno

- **Como** gestor de BPO  
- **Quero** configurar uma política de quantos clientes um operador pode atender em um dia/turno  
- **Para** reduzir alternância excessiva entre empresas e aumentar profundidade de foco  

**Critérios de aceite:**

- Configuração global ou por time para:
  - Número máximo de clientes ativos por operador em um dia (ex.: 3).  
- Quando o operador tenta entrar em foco em um novo cliente acima do limite:
  - Sistema exibe aviso explicando a política.  
  - Oferece opção de:
    - Cancelar entrada em foco; ou  
    - Substituir um dos clientes já ativos (encerrando o foco anterior).  

---

### US 7.5 – Alertar sobre alternância excessiva entre clientes

- **Como** gestor de BPO  
- **Quero** que o sistema alerte operadores quando estiverem alternando demais entre clientes em pouco tempo  
- **Para** incentivar blocos de trabalho mais concentrados  

**Critérios de aceite:**

- É possível configurar política de alternância (ex.: mais de X trocas de cliente em Y minutos).  
- Quando o operador excede essa política:
  - Sistema mostra aviso: “Você alternou entre muitos clientes em pouco tempo – considere concluir o que estava fazendo antes de trocar novamente.”  
- Alertas são registrados para análises posteriores de comportamento (logs/relatórios).  

---

### US 7.6 – Sair explicitamente do modo foco

- **Como** operador de BPO  
- **Quero** ter uma ação clara para sair do modo foco  
- **Para** voltar à visão geral de tarefas quando fizer sentido  

**Critérios de aceite:**

- Banner de modo foco possui um botão “Sair do modo foco”.  
- Ao sair:
  - A UI volta a mostrar todas as tarefas e clientes (respeitando filtros padrão).  
  - Bloco de foco em andamento é encerrado e registrado.  
- Se o operador fechar o app/navegador sem sair explicitamente, o sistema encerra o bloco de foco após um tempo de inatividade configurável.  

