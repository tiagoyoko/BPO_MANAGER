## EP4 – Integração F360 (Auth, Relatórios, Snapshots)

### Contexto

Este épico cobre a integração técnica com o F360 Finanças: configuração e validação do token, mapeamento de empresas/contas, serviços de autenticação, cliente de API, jobs de sincronização e visibilidade de status/histórico.

---

### US 4.1 – Configurar token F360 e testar conexão

- **Como** gestor de BPO  
- **Quero** informar o token do F360 e testar se a conexão funciona  
- **Para** garantir que a integração está corretamente configurada antes de usar os dados  

**Critérios de aceite:**

- Na seção “Integração F360” do cliente, além do campo **Token F360**, existe um botão **“Testar conexão”**.  
- Ao clicar:
  - Backend chama `/PublicLoginAPI/DoLogin` com o token informado.  
  - Se sucesso: exibe mensagem “Conexão bem-sucedida com F360” e salva internamente o estado “integração ativa”.  
  - Se erro: exibe mensagem clara (ex.: “Token inválido ou expirado”) e **não** marca integração como ativa.  
- O token é armazenado criptografado; o backend nunca devolve o valor em texto puro via API.  

---

### US 4.2 – Mapear empresas F360 para cliente BPO

- **Como** gestor de BPO  
- **Quero** mapear quais empresas do F360 correspondem a um cliente do BPO  
- **Para** garantir que os relatórios e saldos certos serão usados nos indicadores  

**Critérios de aceite:**

- Após conexão bem-sucedida, é possível clicar em “Carregar empresas do F360”.  
- Sistema chama API para listar empresas disponíveis para aquele token.  
- UI mostra lista de empresas com: nome, CNPJ, ID F360.  
- Gestor pode:
  - Selecionar uma ou mais empresas para vincular ao cliente.  
  - Salvar o mapeamento.  
- Mapeamentos são persistidos (ex.: em `F360EmpresaMapeada`) e usados em todos os jobs de sincronização.  

---

### US 4.3 – Selecionar contas bancárias relevantes

- **Como** gestor de BPO  
- **Quero** escolher quais contas bancárias do F360 entram nos cálculos de saldo e conciliação  
- **Para** evitar misturar contas que não são parte do escopo do BPO (ex.: contas inativas ou pessoais dos sócios)  

**Critérios de aceite:**

- Para cada empresa F360 mapeada, é possível abrir uma tela de “Contas bancárias”.  
- Sistema busca as contas via API F360 e lista: nome/descrição, banco, agência/conta, tipo.  
- Gestor marca quais contas:
  - **Entram no saldo do dia** (flag `incluirNoSaldo`).  
  - São monitoradas para conciliação, quando aplicável.  
- Configuração é salva (ex.: em `F360ContaMapeada`) e usada na geração de `SnapshotFinanceiro`.  

---

### US 4.4 – Sincronizar dados F360 por job agendado

- **Como** gestor de BPO  
- **Quero** que os dados do F360 sejam sincronizados automaticamente em intervalos regulares  
- **Para** que os indicadores estejam atualizados sem ação manual constante  

**Critérios de aceite:**

- Existe um job `F360SyncJob.runAll` configurável (ex.: a cada 15 ou 30 minutos).  
- Para cada cliente com integração ativa:
  - Obtém JWT válido via `F360AuthService.getValidJwt(clienteId)`.  
  - Para cada empresa/conta mapeada, chama endpoints de:
    - Saldo bancário.  
    - Contas a receber (hoje, vencidas).  
    - Contas a pagar (hoje, vencidas).  
    - Conciliações pendentes.  
  - Normaliza dados e grava um `SnapshotFinanceiro` com:
    - `dataReferencia` (ex.: hoje).  
    - `indicadores` agregados e `detalhes` (títulos/movimentos).  
- Falhas são logadas com nível e causa; não impedem o job de seguir para outros clientes.  

---

### US 4.5 – Rodar sincronização F360 para um cliente específico via API

- **Como** backend da aplicação / API interna  
- **Quero** disparar uma sincronização F360 apenas para um cliente  
- **Para** suportar ações manuais da UI e integrações internas sem afetar toda a carteira  

**Critérios de aceite:**

- Existe endpoint interno (ex.: `POST /integrations/f360/sync/{clienteId}`):
  - Autenticado e autorizado apenas para perfis adequados (admin/gestor).  
  - Executa `F360SyncJob.runSingle(clienteId)`.  
- Endpoint retorna:
  - Status de aceitação da solicitação (OK/erro).  
  - Opcionalmente, um resumo dos indicadores gerados ou o ID do novo snapshot.  

---

### US 4.6 – Ver status e histórico de sincronizações F360

- **Como** gestor ou time técnico  
- **Quero** ver um histórico das sincronizações F360 por cliente  
- **Para** diagnosticar problemas de integração e validar se os dados estão atualizando corretamente  

**Critérios de aceite:**

- Na seção de integração do cliente, há uma aba “Histórico de sincronizações”.  
- Para cada execução (agendada ou manual) são exibidos:
  - Data/hora, tipo (agendada/manual), resultado (sucesso/falha), duração.  
  - Em caso de falha, código/descrição resumida do erro.  
- É possível filtrar por período e por tipo de execução.  

---

### US 4.7 – Desativar temporariamente a integração F360

- **Como** gestor de BPO  
- **Quero** poder desativar a integração F360 de um cliente sem apagar as configurações  
- **Para** pausar sincronizações em casos específicos (ex.: troca de token, auditoria, cliente em pausa)  

**Critérios de aceite:**

- Na config do cliente, existe um toggle “Integração F360 ativa”.  
- Quando desativado:
  - Jobs de sincronização não processam aquele cliente.  
  - UI de indicadores mostra mensagem “Integração F360 desativada para este cliente”.  
  - Mapeamentos e token permanecem armazenados (para possível reativação).  

