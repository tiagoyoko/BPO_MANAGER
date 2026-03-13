# 6. Requisitos funcionais

## 6.1. Gestão de clientes

- **RF-01**: Cadastrar clientes com CNPJ, razão social, contatos, receita mensal estimada e tags.  
- **RF-02**: Associar cada cliente a um ou mais ERPs, com F360 como ERP principal no MVP.  
- **RF-03**: Ativar/desativar integrações por cliente (F360 ativo, outros futuros).

## 6.2. Rotinas, tarefas e checklists

- **RF-04**: Criar modelos de rotinas recorrentes (periodicidade, tipo de serviço, checklists).  
- **RF-05**: Instanciar rotinas por cliente, gerando tarefas no calendário automaticamente.  
- **RF-06**: Configurar por tarefa:
  - Responsável (usuário ou time).  
  - Datas (início, vencimento, recorrência).  
  - Prioridade (baixa/média/alta/urgente).  
  - SLA interno (tempo alvo para conclusão).  
- **RF-07**: Alterar status de tarefa (a fazer, em andamento, concluída, bloqueada).  
- **RF-08**: Registrar histórico de mudanças e comentários.

## 6.3. Central de comunicação e documentos

- **RF-09**: Abrir solicitações (tickets) internas ou de clientes, vinculadas a clientes e, opcionalmente, a tarefas.  
- **RF-10**: Fazer upload de documentos e anexar a tarefas/solicitações.  
- **RF-11**: Exibir timeline unificada por cliente (tarefas, solicitações, documentos, comentários).

## 6.4. Indicadores financeiros integrados ao F360

- **RF-12**: Exibir, para clientes com F360 ativo:
  - Saldo do dia por conta bancária e consolidado.  
  - Contas a receber:
    - Total de hoje  
    - Total vencido (valor e quantidade).  
  - Contas a pagar:
    - Total de hoje  
    - Total vencido (valor e quantidade).  
  - Conciliações bancárias pendentes:
    - Quantidade de lançamentos pendentes  
    - Valor agregado.  
- **RF-13**: Permitir drill-down dos cards para listas detalhadas dos itens.  
- **RF-14**: Atualizar dados F360:
  - De forma agendada (ex.: a cada 15/30 minutos).  
  - De forma manual (“Atualizar agora”), respeitando limites da API.  
- **RF-15**: Mostrar o horário da última sincronização bem-sucedida.

## 6.5. Integração com F360 (camada de integração)

### 6.5.1. Autenticação

- **RF-16**: Configurar, por cliente, token F360 e parâmetros necessários para login na API:
  - Utilizar `/PublicLoginAPI/DoLogin` para obter JWT Bearer com base no token gerado na plataforma (doc F360 Finanças).  
- **RF-17**: Implementar serviço de sessão:
  - Armazenar JWT de forma segura.  
  - Controlar expiração e renovação automática.  
  - Fazer re-login quando receber erros de autenticação.

### 6.5.2. Dados e endpoints conceituais

- **RF-18**: Consumir endpoints de relatórios/movimentações (ex.: `/PublicRelatorioAPI/GerarRel` e correlatos) para obter:
  - Saldos bancários por conta em data corrente.  
  - Títulos a receber filtrados por vencimento (hoje, vencidos) e status.  
  - Títulos a pagar (mesma lógica).  
  - Situação das conciliações (movimentos pendentes).  
- **RF-19**: Normalizar a resposta da API F360 em estruturas internas (entidades de domínio BPO360).

### 6.5.3. Mapeamento BPO360 ↔ F360

- **RF-40**: Implementar tela de mapeamento:
  - Cliente (BPO360) ↔ Empresa(s) do F360 (IDs/CNPJs).  
  - Seleção de contas bancárias relevantes para os indicadores.  

### 6.5.4. Sincronização e snapshots

- **RF-41**: Serviço de sincronização:
  - Executar jobs de coleta de dados F360 (por cliente mapeado).  
  - Gerar snapshots agregados e detalhados para saldos, pagar/receber, conciliações.  
  - Persistir snapshots com timestamp e status.  
- **RF-42**: Manter histórico de snapshots para análise temporal e fallback.

### 6.5.5. Tratamento de erros, limites e UX de falha

- **RF-20**: Tratar erros de API:
  - Diferenciar erros de autenticação, negócio e infraestrutura.  
  - Exibir mensagens amigáveis em telas administrativas.  
- **RF-43**: Implementar rate limiting interno para evitar excesso de chamadas.  
- **RF-44**: Exibir aviso na UI em até 2s, com texto objetivo (até 200 caracteres), quando:
  - Dados estiverem desatualizados (ex.: última sync há mais de X horas).  
  - Integração estiver desconfigurada (mostrar CTA para configurar F360).  

## 6.6. Segurança e cofre de senhas

- **RF-21**: Cadastrar usuários internos (admin, gestor, operador) com papéis e permissões.  
- **RF-22**: Cadastrar usuários de clientes com acesso apenas aos dados do seu CNPJ.  
- **RF-23**: Implementar cofre de senhas:
  - Guardar segredos criptografados.  
  - Exibir apenas parcialmente mascarados.  
  - Registrar quem visualiza/edita.

## 6.7. Timesheet e custo da operação

- **RF-24**: Registrar tempo de trabalho:
  - Por tarefa (start/stop ou input manual).  
  - Por tipo de atividade (lançamento, conciliação, cobrança, suporte etc.).  
- **RF-25**: Consolidar tempos por cliente, operador, tarefa e período.  
- **RF-26**: Disponibilizar relatórios de timesheet com filtros e exportação.  
- **RF-28**: Cadastrar custo/hora por operador/senioridade.  
- **RF-29**: Calcular custo operacional por cliente, período, tarefa/rotina.  
- **RF-30**: Gerar indicadores de rentabilidade (receita contratada vs custo, margem em R$ e %).  
- **RF-31**: Destacar clientes com margem abaixo de limite configurado.

## 6.8. Atribuição em massa e modelos de tarefas

- **RF-32**: Manter biblioteca de modelos de rotinas/tarefas reutilizáveis.  
- **RF-33**: Importar modelos para múltiplos clientes em lote.  
- **RF-34**: Editar em massa recorrência, datas relativas, priorização, responsável padrão.  
- **RF-35**: Atribuir/reatribuir tarefas em massa para operadores.

## 6.9. Regras de negócio – foco em uma empresa por vez

- **RF-36**: Habilitar modo foco para um cliente (UI e contextos filtrados).  
- **RF-37**: Controlar alternância entre clientes, alertando o usuário quando alternar demais sem concluir/pausar tarefas.  
- **RF-38**: Registrar blocos de trabalho focado no timesheet (cliente e período).  
- **RF-39**: Permitir parametrizar políticas de foco por gestor (ex.: limite de clientes simultâneos).

---
