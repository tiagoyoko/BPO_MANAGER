## EP5 – Dashboard Operacional com Indicadores F360

### Contexto

Este épico cobre o dashboard operacional por cliente e a visão resumida de carteira, exibindo indicadores financeiros vindos do F360 (saldo, pagar/receber, conciliações) e permitindo drill-down e atualização manual.

---

### US 5.1 – Ver indicadores financeiros por cliente

- **Como** gestor de BPO  
- **Quero** ver, na página de um cliente, cards com saldo do dia, contas a pagar/receber (hoje e vencidas) e conciliações pendentes  
- **Para** ter uma visão rápida da saúde financeira operacional daquele cliente  

**Critérios de aceite:**

- Ao acessar o cliente com F360 configurado, são exibidos 4 cards:
  - **Saldo do dia**: valor consolidado + tooltip/lista de contas.  
  - **Contas a receber**: hoje / vencidas (valor e quantidade).  
  - **Contas a pagar**: hoje / vencidas (valor e quantidade).  
  - **Conciliações pendentes**: quantidade e valor agregado.  
- Os valores são baseados no último `SnapshotFinanceiro` do cliente.  
- Se não houver snapshot ainda, exibe mensagem de “Dados ainda não sincronizados” e CTA para sincronizar.  
- Se a integração F360 estiver desativada ou mal configurada, os cards não aparecem; no lugar, aparece CTA “Configurar integração com F360”.  

---

### US 5.2 – Drill-down de contas a pagar/receber

- **Como** gestor ou operador de BPO  
- **Quero** clicar em um card de pagar/receber e ver a lista de títulos correspondentes  
- **Para** identificar rapidamente quais lançamentos estão causando o risco (ex.: muitos vencidos)  

**Critérios de aceite:**

- Ao clicar no card **Contas a receber**:
  - Abre lista com:
    - Abas ou filtros: “Hoje” e “Vencidos”.  
    - Colunas mínimas: descrição, sacado/cedente, vencimento, valor, status.  
  - Os itens vêm de `detalhes.receberHoje` ou `detalhes.receberVencidos` do `SnapshotFinanceiro`.  
- Ao clicar no card **Contas a pagar**:
  - Mesma lógica, usando `pagarHoje` e `pagarVencidos`.  
- É possível filtrar e ordenar por valor, vencimento e status.  
- Se não houver itens para uma categoria (ex.: sem vencidos), a interface mostra texto “Nenhum título encontrado” para aquele filtro.  

---

### US 5.3 – Drill-down de conciliações pendentes

- **Como** operador de BPO  
- **Quero** ver a lista de movimentos bancários pendentes de conciliação  
- **Para** conseguir executar a conciliação de forma priorizada  

**Critérios de aceite:**

- Ao clicar no card **Conciliações pendentes**:
  - Exibe lista paginada com `detalhes.conciliacoesPendentes`.  
  - Colunas: conta, data do movimento, descrição, valor.  
- Há um filtro por conta bancária e por intervalo de datas.  
- Se não houver movimentos pendentes, o card já indica “0 / R$ 0,00” e o drill-down mostra mensagem “Nenhuma conciliação pendente para o período selecionado”.  

---

### US 5.4 – Atualizar indicadores manualmente

- **Como** gestor ou operador  
- **Quero** poder forçar a atualização dos indicadores de um cliente  
- **Para** garantir que estou olhando para dados mais recentes em momentos críticos  

**Critérios de aceite:**

- Na área de indicadores do cliente existe botão “Atualizar agora”.  
- Ao clicar:
  - A UI dispara chamada para API que executa `F360SyncJob.runSingle(clienteId)`.  
  - Mostra estado de carregamento (“Atualizando dados do F360...”).
- Ao terminar com sucesso:
  - Os cards são atualizados com base no novo `SnapshotFinanceiro`.  
  - O timestamp “Última atualização” é atualizado.  
- Em caso de erro:
  - É exibida mensagem amigável com causa provável (ex.: problema de autenticação vs erro de comunicação).  
  - O último snapshot válido continua sendo usado; a UI explicita que os dados podem estar desatualizados.  

---

### US 5.5 – Ver timestamp e status da última sincronização

- **Como** gestor de BPO  
- **Quero** ver quando os dados F360 foram atualizados pela última vez  
- **Para** avaliar se posso confiar na “atualidade” dos números exibidos  

**Critérios de aceite:**

- Na área de indicadores do cliente é exibido:
  - “Última atualização: DD/MM/AAAA HH:MM” quando houver snapshot válido.  
  - “Nunca atualizado” se não existir snapshot.  
- Se o último snapshot tiver mais de N horas (configurável), o timestamp aparece com destaque de atenção (cor/ícone).  
- Em caso de falha na última sincronização agendada, aparece um ícone de alerta com tooltip indicando “Falha na última tentativa de sincronização – veja logs ou tente atualizar agora”.  

---

### US 5.6 – Visão resumida de carteira (múltiplos clientes)

- **Como** gestor de BPO  
- **Quero** ver, em uma grade única, os principais indicadores F360 e operacionais por cliente  
- **Para** priorizar onde atuar primeiro na carteira  

**Critérios de aceite:**

- Tela de visão geral da carteira mostra uma linha por cliente com:
  - Nome do cliente.  
  - Quantidade de tarefas atrasadas (vinda de EP2).  
  - Indicador de risco F360 (por exemplo: badge baseado em % de títulos vencidos ou valor de vencidos).  
  - Sinalização se conciliações pendentes estão acima de um limiar.  
- É possível ordenar clientes por:
  - Maior valor de pagar/receber vencidos.  
  - Maior número de conciliações pendentes.  
- Cada linha tem link para abrir o dashboard detalhado daquele cliente.  

