## EP1 – Gestão de Clientes e Configurações de ERP

### Contexto

Este épico cobre o cadastro e gestão de clientes de BPO, bem como a configuração do ERP financeiro por cliente (com F360 como ERP principal no MVP), preparando a base para as integrações técnicas detalhadas em outros épicos.

---

### US 1.1 – Cadastrar cliente de BPO

- **Como** gestor de BPO  
- **Quero** cadastrar um novo cliente com seus dados básicos  
- **Para** que o time possa configurar rotinas e integrações específicas para ele  

**Critérios de aceite:**

- Tela de “Novo cliente” com campos obrigatórios: CNPJ, razão social, nome fantasia, e-mail de contato principal.  
- Campos opcionais: telefone, responsável interno (gestor da carteira), receita mensal estimada, tags/setor.  
- Validação de CNPJ (formato e duplicidade).  
- Ao salvar, o cliente aparece na lista de clientes com status “Ativo”.  

---

### US 1.2 – Editar dados e status de cliente

- **Como** gestor de BPO  
- **Quero** editar dados de um cliente já cadastrado e alterar seu status  
- **Para** manter informações atualizadas e controlar se ele continua ativo na operação  

**Critérios de aceite:**

- Ao abrir um cliente, é possível editar todos os campos cadastrados (exceto CNPJ, que pode ser apenas visualizado ou editado com confirmação forte).  
- Campo **status** com valores: Ativo, Em implantação, Pausado, Encerrado.  
- Mudança de status para “Encerrado” exige confirmação e texto explicando impacto (ex.: não gera novas tarefas).  

---

### US 1.3 – Listar e filtrar clientes

- **Como** gestor de BPO  
- **Quero** ver uma lista de clientes com filtros e busca  
- **Para** localizar rapidamente empresas por nome, CNPJ, status ou tags  

**Critérios de aceite:**

- Lista paginada com colunas: Cliente, CNPJ, status, responsável interno, receita estimada, indicadores resumidos (opcional).  
- Barra de busca por nome ou CNPJ.  
- Filtros por status, tags/setor e responsável interno.  
- Clique em uma linha leva ao “painel do cliente”.  

---

### US 1.4 – Configurar ERP principal (F360) por cliente

- **Como** gestor de BPO  
- **Quero** definir qual ERP financeiro é usado por um cliente (F360 como principal no MVP)  
- **Para** que o sistema saiba de onde buscar dados financeiros e quais integrações ativar  

**Critérios de aceite:**

- Na área de configurações do cliente, existe seção “ERP financeiro”.  
- Campos:
  - Tipo de ERP (dropdown – no MVP: F360).  
  - Indicador de “ERP principal” (no futuro pode haver mais de um ERP cadastrado, mas apenas um principal).  
- Ao definir F360 como ERP principal:
  - A UI exibe a subseção “Integração F360” (US 1.5).  
  - As telas de indicadores e integrações passam a usar esse ERP como fonte padrão.  

---

### US 1.5 – Configurar parâmetros básicos de integração F360 (sem chamar API ainda)

> A parte de chamadas à API e validação de token é tratada no épico de integração técnica (EP4). Aqui o foco é na experiência de configuração no nível de cliente.

- **Como** gestor de BPO  
- **Quero** registrar o token de integração do F360 e parâmetros mínimos por cliente  
- **Para** preparar o ambiente para que o time técnico configure a integração completa  

**Critérios de aceite:**

- Na seção “Integração F360” do cliente:
  - Campo “Token F360” (texto mascarado, com opção de revelar temporariamente).  
  - Campo opcional de observações internas (ex.: “Token gerado em DD/MM/AAAA, responsável X”).  
- O token é armazenado de forma criptografada.  
- A UI indica claramente que:
  - O token é responsabilidade do cliente/BPO.  
  - Deve ser gerado no painel do F360 (link ou instruções resumidas).  
- Sem integração técnica implementada (antes de EP4), a UI mostra o status “Configuração básica salva – integração técnica pendente”.  

---

### US 1.6 – Ver status de configuração ERP por cliente

- **Como** gestor de BPO  
- **Quero** ver rapidamente se o ERP/integração de cada cliente está configurado  
- **Para** saber onde ainda preciso atuar antes de usar indicadores e automação  

**Critérios de aceite:**

- Na lista de clientes, existe uma coluna “ERP/Integração” com estados, por exemplo:
  - “Não configurado” (nenhum ERP definido).  
  - “F360 – config básica salva” (ERP definido, token salvo).  
  - “F360 – integração ativa” (quando EP4 estiver implementado e testes estiverem OK).  
- Ao passar o mouse ou clicar no estado, são exibidos detalhes básicos (tipo de ERP, data da última alteração de config).  

