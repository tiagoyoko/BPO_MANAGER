## EP6 – Timesheet, Custo Operacional e Rentabilidade

### Contexto

Este épico cobre o registro de tempo por tarefa, classificação de atividades, cálculo de custo operacional por cliente/rotina e visualização de rentabilidade (receita vs custo), tanto por cliente quanto por carteira/responsável.

---

### US 6.1 – Registrar tempo em uma tarefa

- **Como** operador de BPO  
- **Quero** registrar o tempo que gasto em cada tarefa  
- **Para** que o time possa medir esforço e custo da operação por cliente  

**Critérios de aceite:**

- Em tela de tarefa, existe seção “Tempo” com:
  - Botão “Iniciar” / “Parar” cronômetro, ou opção de lançar tempo manual.  
- Vários intervalos podem ser registrados na mesma tarefa (start/stop múltiplos).  
- O total de tempo da tarefa é a soma dos intervalos; aparece em horas e minutos.  

---

### US 6.2 – Ver e editar lançamentos de timesheet

- **Como** operador ou gestor (com permissão)  
- **Quero** visualizar e, quando necessário, ajustar lançamentos de tempo  
- **Para** corrigir erros e garantir que os dados reflitam a realidade  

**Critérios de aceite:**

- Em uma aba de timesheet do usuário:
  - Lista por dia/tarefa com duração e tipo de atividade.  
- Operador consegue editar ou apagar lançamentos próprios dentro de uma janela de tempo definida (ex.: até D+1).  
- Gestor pode ajustar tempos de sua equipe, com log de quem alterou e quando.  

---

### US 6.3 – Classificar tempo por tipo de atividade

- **Como** gestor de BPO  
- **Quero** que o tempo seja classificado por tipo de atividade (lançamento, conciliação, cobrança, suporte etc.)  
- **Para** entender onde está sendo gasto o esforço da operação  

**Critérios de aceite:**

- Ao registrar tempo, operador seleciona um tipo de atividade em lista configurável.  
- Tipo de atividade pode ter categorias pai/filho (ex.: “Conciliação > Bancária diária”).  
- Relatórios podem agrupar tempo por tipo de atividade.  

---

### US 6.4 – Configurar custo/hora por operador

- **Como** gestor de BPO  
- **Quero** definir o custo/hora de cada operador (ou faixa)  
- **Para** que o sistema calcule automaticamente o custo operacional a partir do timesheet  

**Critérios de aceite:**

- Tela de configuração de usuários com campo “Custo/hora” (R$/hora).  
- Suporte a moeda e casas decimais.  
- Alterações de custo-hora valem a partir de uma data de vigência (para não distorcer histórico já calculado).  

---

### US 6.5 – Calcular custo operacional por cliente e por rotina

- **Como** gestor de BPO  
- **Quero** ver o custo total da operação por cliente e por rotina/tipo de serviço  
- **Para** avaliar se o contrato atual é saudável e onde ajustar preços ou processos  

**Critérios de aceite:**

- Relatório de custo apresenta:
  - Por cliente, em um período: total de horas, custo total, custo médio/hora.  
  - Por rotina/tipo de serviço: mesmas métricas, filtráveis por cliente.  
- Custo é calculado com base em:
  - Duração dos lançamentos de timesheet x custo/hora vigente do operador na data.  
- É possível exportar relatório em CSV/Excel.  

---

### US 6.6 – Ver rentabilidade por cliente

- **Como** gestor de BPO  
- **Quero** ver, por cliente, a comparação entre receita contratada e custo operacional  
- **Para** identificar clientes rentáveis, no limite ou deficitários  

**Critérios de aceite:**

- Para cada cliente, sistema calcula em um período:
  - Receita (campo de receita mensal estimada ou valor real importado, quando disponível).  
  - Custo (soma dos custos calculados a partir do timesheet).  
  - Margem em R$ e %.  
- Dashboard de rentabilidade:
  - Lista clientes com colunas de receita, custo, margem.  
  - Permite ordenar por menor margem.  
- Clientes com margem abaixo de um limite configurado aparecem destacados (ex.: vermelho).  

---

### US 6.7 – Ver rentabilidade agregada por carteira e por responsável

- **Como** gestor de BPO  
- **Quero** ver rentabilidade agregada por carteira de clientes e por responsável interno  
- **Para** entender desempenho de diferentes carteiras e gestores  

**Critérios de aceite:**

- Relatório apresenta:
  - Por responsável interno: total de receita e custo dos clientes sob sua gestão, margem consolidada.  
  - Possibilidade de expandir para ver a lista de clientes de cada responsável.  
- Filtros por período, tags/setor e tamanho do cliente (ex.: receita).  

