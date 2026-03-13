# 5. Jornadas principais

## 5.1. Jornada – Gestor acompanha saúde da carteira

1. Abre o painel geral de clientes.  
2. Visualiza para cada cliente:
   - Status das tarefas (atrasadas, em dia).  
   - Indicadores F360 (saldo, pagar/receber, conciliação).  
   - Margem estimada (receita x custo).  
3. Filtra clientes por risco (ex.: muitos títulos vencidos ou margem abaixo de X%).  
4. Entra no detalhe de um cliente para ver tarefas, comunicação e detalhes financeiros.

## 5.2. Jornada – Operador executa rotina diária de um cliente

1. Abre o painel “Hoje” → entra em modo foco para um cliente.  
2. Vê suas tarefas daquele cliente para o dia (priorizadas).  
3. Para conciliação:
   - Abre checklist da tarefa de conciliação.  
   - Vê lista de conciliações pendentes (dados F360).  
   - Executa as ações e marca subitens como concluídos.  
4. Registra o tempo dedicado (timesheet automático ou manual).  
5. Sai do modo foco e, se necessário, muda para outro cliente.

## 5.3. Jornada – Configurar integração F360 para um cliente

1. Admin acessa módulo de integrações.  
2. Seleciona o cliente.  
3. Informa token de integração F360 gerado no painel da F360.  
4. Sistema chama `/PublicLoginAPI/DoLogin` (F360) e valida o token.  
5. Carrega lista de empresas e contas do F360 relacionadas.  
6. Admin mapeia:
   - Cliente ↔ empresa(s) F360.  
   - Contas bancárias relevantes.  
7. Salva configuração e dispara primeira sincronização.  
8. Dashboard do cliente é populado com os primeiros indicadores.

---
