## EP3 – Central de Comunicação e Documentos

### Contexto

Este épico cobre a central de comunicação entre BPO e clientes, incluindo abertura de solicitações, envio/recebimento de documentos, timeline por cliente e vínculo com tarefas/rotinas.

---

### US 3.1 – Abrir solicitação para um cliente

- **Como** operador de BPO  
- **Quero** abrir uma solicitação (ticket) vinculada a um cliente  
- **Para** registrar demandas, dúvidas ou pendências relacionadas ao trabalho financeiro  

**Critérios de aceite:**

- Tela de “Nova solicitação” com campos: cliente, título, descrição, tipo (documento faltando, dúvida, ajuste, outro), prioridade.  
- Opcional: vincular a uma tarefa/rotina específica.  
- Ao salvar, a solicitação ganha um identificador e status inicial “Aberta”.  
- Solicitação aparece na timeline do cliente e em uma lista geral de solicitações.  

---

### US 3.2 – Cliente enviar solicitação e documentos pelo portal

- **Como** cliente do BPO  
- **Quero** enviar solicitações e anexar documentos em um portal simples  
- **Para** atender aos pedidos do BPO sem depender de e-mail/WhatsApp  

**Critérios de aceite:**

- Portal do cliente com:
  - Lista de solicitações abertas/fechadas.  
  - Botão “Nova solicitação” com campos: assunto, descrição, anexos.  
- Anexos aceitos: pelo menos PDFs, imagens comuns (PNG/JPG) e planilhas.  
- Cada solicitação criada pelo cliente fica automaticamente vinculada ao seu CNPJ e disponível na central interna.  

---

### US 3.3 – Centralizar comunicação por cliente (timeline)

- **Como** gestor ou operador de BPO  
- **Quero** ver uma timeline única por cliente com solicitações, comentários e documentos  
- **Para** entender rapidamente o histórico de comunicação e contexto de decisões  

**Critérios de aceite:**

- Visão “Comunicação” do cliente mostra:
  - Lista cronológica de eventos (solicitação criada, comentário, documento anexado, mudança de status).  
- Cada item indica:
  - Tipo de evento, autor (interno/cliente), data/hora.  
- Filtros por tipo de evento (só solicitações, só documentos, etc.).  

---

### US 3.4 – Anexar documentos a tarefas e solicitações

- **Como** operador de BPO  
- **Quero** anexar documentos diretamente a uma tarefa ou solicitação  
- **Para** manter todos os arquivos relevantes organizados por contexto  

**Critérios de aceite:**

- Em tela de tarefa ou solicitação, seção “Documentos” com:
  - Botão “Adicionar arquivo” (upload).  
  - Lista de arquivos com nome, tipo, tamanho, data de envio e autor.  
- É possível baixar ou visualizar (preview) os arquivos suportados.  
- Documento fica visível também na timeline do cliente, com referência à tarefa/solicitação associada.  

---

### US 3.5 – Notificação de atualização para o cliente

- **Como** cliente do BPO  
- **Quero** ser notificado quando uma solicitação minha for respondida ou concluída  
- **Para** acompanhar o andamento sem precisar ficar checando o portal o tempo todo  

**Critérios de aceite:**

- Ao operador adicionar comentário ou alterar status de uma solicitação de cliente:
  - Sistema registra o evento.  
  - Sistema pode enviar notificação por e-mail (configurável) com resumo e link para a solicitação no portal.  
- Preferências de notificação podem ser configuradas por cliente (receber ou não e-mails).  

---

### US 3.6 – Vincular comunicação às rotinas e indicadores

- **Como** gestor de BPO  
- **Quero** ver, em uma rotina ou tarefa, quais comunicações e documentos relacionados existem  
- **Para** entender se atrasos ou problemas vêm de pendências de cliente ou de execução interna  

**Critérios de aceite:**

- Ao abrir uma tarefa/rotina, é exibido:
  - Lista de solicitações vinculadas a ela (diretamente) ou ao mesmo período/tema.  
  - Contador de solicitações abertas relacionadas.  
- Na visão geral do cliente, é possível:
  - Filtrar tarefas que possuem solicitações abertas ligadas (ex.: tarefas “bloqueadas por cliente”).  

