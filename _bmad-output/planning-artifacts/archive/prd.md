---
stepsCompleted:
  - step-01-init
  - step-e-02-review
  - step-e-03-edit
inputDocuments:
  - docs/deep-research-report_playbpo.md
workflowType: 'prd'
documentCounts:
  productBriefs: 0
  researchDocs: 1
  brainstormingDocs: 0
  projectDocs: 1
classification:
  domain: general
  projectType: web_app
  complexity: low
date: '2026-03-13'
lastEdited: '2026-03-13'
editHistory:
  - date: '2026-03-13'
    changes: 'Validação PRD – mensurabilidade (NFR Performance, RF-44), frontmatter (classification, date), requisitos web_app (navegadores, responsividade, acessibilidade), nota no Anexo 11.'
---

# Product Requirements Document - BPO360 (nome provisório)

**Author:** Tiago  
**Date:** 2026-03-13

---

## 1. Visão geral do produto

**Nome provisório:** BPO360  
**Tipo de produto:** SaaS B2B multi-cliente, inicialmente para uso interno do BPO, com visão de se tornar produto comercial.  
**Inspiração principal:** PlayBPO (análise detalhada em `docs/deep-research-report_playbpo.md`).  
**Diferencial crítico:** Integração nativa com **F360 Finanças** como ERP financeiro principal, expondo no dashboard operacional indicadores-chave de caixa e pendências, com arquitetura preparada para múltiplos ERPs no futuro.

**Proposta de valor resumida:**

- Centralizar gestão de tarefas, rotinas e comunicação do BPO financeiro em um único sistema.  
- Conectar diretamente ao F360, trazendo dados financeiros críticos (saldos, contas a pagar/receber, conciliações) para dentro do fluxo de trabalho.  
- Aumentar visibilidade e controle para gestores (rentabilidade, margem, riscos por cliente) e operadores (tarefas claras, menos retrabalho).  
- Evoluir de ferramenta interna para produto vertical SaaS para outros BPOs/contabilidades.

---

## 2. Objetivos do produto

- **Objetivo principal:**  
  Construir uma plataforma de operação de BPO financeiro, semelhante ao PlayBPO, porém com integração forte ao **F360 Finanças** para entregar visão operacional e financeira integrada por cliente.

- **Objetivos específicos:**
  - Reduzir retrabalho e atrasos por falta de padronização e visibilidade de rotinas.  
  - Centralizar comunicação e documentos entre BPO e clientes.  
  - Expor indicadores financeiros em tempo quase real, vindos do F360:
    - Saldo do dia (por conta e consolidado)  
    - Contas a receber de hoje e vencidas  
    - Contas a pagar de hoje e vencidas  
    - Conciliações bancárias pendentes  
  - Medir rentabilidade por cliente, combinando timesheet + custo-hora + receita.  
  - Criar uma camada de integração extensível que hoje prioriza F360, mas que possa suportar outros ERPs.

- **Métricas de sucesso (exemplos):**
  - Reduzir em X% as tarefas atrasadas por cliente após 3–6 meses.  
  - Reduzir em X% o tempo médio de fechamento mensal por carteira.  
  - Manter conciliações bancárias pendentes abaixo de Y% antes de D+2.  
  - Aumentar em X% a margem média por cliente (a partir dos dados de custo operacional).

---

## 3. Escopo do MVP

### 3.1. Escopo incluído

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

### 3.2. Fora de escopo (MVP, mas previsto)

- IA para autopreenchimento de lançamentos a partir de documentos.  
- Integração profunda com outros ERPs (Omie, Conta Azul, Nibo etc.).  
- App mobile próprio para cliente final (estágio 2, similar ao “Financeiro na Mão”).  
- SLA enterprise formal (99,9% uptime) e certificações (ISO, SOC2).  
- Mecanismos completos de billing/assinaturas para terceiros (BPOs externos).

---

## 4. Personas

### 4.1. Gestor de BPO Financeiro

- **Responsável por:** carteira de clientes, margem, qualidade de entrega, escala do time.  
- **Dores:**
  - Falta de visão consolidada de tarefas, riscos e lucratividade por cliente.  
  - Trabalho manual para cruzar dados do ERP (F360) com operação.  
- **Ganhos esperados:**
  - Painel único por cliente com tarefas + indicadores F360 + margem.  
  - Alertas de risco (muitos títulos vencidos, conciliação atrasada, margem baixa).

### 4.2. Operador de BPO

- **Responsável por:** execução diária (lançamentos, conciliação, cobranças, relatórios).  
- **Dores:**
  - Múltiplos sistemas e planilhas, falta de priorização clara.  
  - Perda de foco alternando entre muitos clientes.  
- **Ganhos esperados:**
  - Lista clara de tarefas, com contexto financeiro integrado.  
  - Modo foco por empresa, reduzindo dispersão.  
  - Registro automático/simples de horas.

### 4.3. Cliente (empresa atendida)

- **Responsável por:** enviar documentos, aprovar pagamentos, responder solicitações.  
- **Dores:**
  - Falta de transparência sobre o que o BPO está fazendo.  
  - Canais de comunicação dispersos (WhatsApp, e-mail, ligações).  
- **Ganhos esperados:**
  - Canal único de solicitações/documentos.  
  - Visão resumida de pendências críticas (pagamentos hoje, documentos faltando).

---

## 5. Jornadas principais

### 5.1. Jornada – Gestor acompanha saúde da carteira

1. Abre o painel geral de clientes.  
2. Visualiza para cada cliente:
   - Status das tarefas (atrasadas, em dia).  
   - Indicadores F360 (saldo, pagar/receber, conciliação).  
   - Margem estimada (receita x custo).  
3. Filtra clientes por risco (ex.: muitos títulos vencidos ou margem abaixo de X%).  
4. Entra no detalhe de um cliente para ver tarefas, comunicação e detalhes financeiros.

### 5.2. Jornada – Operador executa rotina diária de um cliente

1. Abre o painel “Hoje” → entra em modo foco para um cliente.  
2. Vê suas tarefas daquele cliente para o dia (priorizadas).  
3. Para conciliação:
   - Abre checklist da tarefa de conciliação.  
   - Vê lista de conciliações pendentes (dados F360).  
   - Executa as ações e marca subitens como concluídos.  
4. Registra o tempo dedicado (timesheet automático ou manual).  
5. Sai do modo foco e, se necessário, muda para outro cliente.

### 5.3. Jornada – Configurar integração F360 para um cliente

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

## 6. Requisitos funcionais

### 6.1. Gestão de clientes

- **RF-01**: Cadastrar clientes com CNPJ, razão social, contatos, receita mensal estimada e tags.  
- **RF-02**: Associar cada cliente a um ou mais ERPs, com F360 como ERP principal no MVP.  
- **RF-03**: Ativar/desativar integrações por cliente (F360 ativo, outros futuros).

### 6.2. Rotinas, tarefas e checklists

- **RF-04**: Criar modelos de rotinas recorrentes (periodicidade, tipo de serviço, checklists).  
- **RF-05**: Instanciar rotinas por cliente, gerando tarefas no calendário automaticamente.  
- **RF-06**: Configurar por tarefa:
  - Responsável (usuário ou time).  
  - Datas (início, vencimento, recorrência).  
  - Prioridade (baixa/média/alta/urgente).  
  - SLA interno (tempo alvo para conclusão).  
- **RF-07**: Alterar status de tarefa (a fazer, em andamento, concluída, bloqueada).  
- **RF-08**: Registrar histórico de mudanças e comentários.

### 6.3. Central de comunicação e documentos

- **RF-09**: Abrir solicitações (tickets) internas ou de clientes, vinculadas a clientes e, opcionalmente, a tarefas.  
- **RF-10**: Fazer upload de documentos e anexar a tarefas/solicitações.  
- **RF-11**: Exibir timeline unificada por cliente (tarefas, solicitações, documentos, comentários).

### 6.4. Indicadores financeiros integrados ao F360

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

### 6.5. Integração com F360 (camada de integração)

#### 6.5.1. Autenticação

- **RF-16**: Configurar, por cliente, token F360 e parâmetros necessários para login na API:
  - Utilizar `/PublicLoginAPI/DoLogin` para obter JWT Bearer com base no token gerado na plataforma (doc F360 Finanças).  
- **RF-17**: Implementar serviço de sessão:
  - Armazenar JWT de forma segura.  
  - Controlar expiração e renovação automática.  
  - Fazer re-login quando receber erros de autenticação.

#### 6.5.2. Dados e endpoints conceituais

- **RF-18**: Consumir endpoints de relatórios/movimentações (ex.: `/PublicRelatorioAPI/GerarRel` e correlatos) para obter:
  - Saldos bancários por conta em data corrente.  
  - Títulos a receber filtrados por vencimento (hoje, vencidos) e status.  
  - Títulos a pagar (mesma lógica).  
  - Situação das conciliações (movimentos pendentes).  
- **RF-19**: Normalizar a resposta da API F360 em estruturas internas (entidades de domínio BPO360).

#### 6.5.3. Mapeamento BPO360 ↔ F360

- **RF-40**: Implementar tela de mapeamento:
  - Cliente (BPO360) ↔ Empresa(s) do F360 (IDs/CNPJs).  
  - Seleção de contas bancárias relevantes para os indicadores.  

#### 6.5.4. Sincronização e snapshots

- **RF-41**: Serviço de sincronização:
  - Executar jobs de coleta de dados F360 (por cliente mapeado).  
  - Gerar snapshots agregados e detalhados para saldos, pagar/receber, conciliações.  
  - Persistir snapshots com timestamp e status.  
- **RF-42**: Manter histórico de snapshots para análise temporal e fallback.

#### 6.5.5. Tratamento de erros, limites e UX de falha

- **RF-20**: Tratar erros de API:
  - Diferenciar erros de autenticação, negócio e infraestrutura.  
  - Exibir mensagens amigáveis em telas administrativas.  
- **RF-43**: Implementar rate limiting interno para evitar excesso de chamadas.  
- **RF-44**: Exibir aviso na UI em até 2s, com texto objetivo (até 200 caracteres), quando:
  - Dados estiverem desatualizados (ex.: última sync há mais de X horas).  
  - Integração estiver desconfigurada (mostrar CTA para configurar F360).  

### 6.6. Segurança e cofre de senhas

- **RF-21**: Cadastrar usuários internos (admin, gestor, operador) com papéis e permissões.  
- **RF-22**: Cadastrar usuários de clientes com acesso apenas aos dados do seu CNPJ.  
- **RF-23**: Implementar cofre de senhas:
  - Guardar segredos criptografados.  
  - Exibir apenas parcialmente mascarados.  
  - Registrar quem visualiza/edita.

### 6.7. Timesheet e custo da operação

- **RF-24**: Registrar tempo de trabalho:
  - Por tarefa (start/stop ou input manual).  
  - Por tipo de atividade (lançamento, conciliação, cobrança, suporte etc.).  
- **RF-25**: Consolidar tempos por cliente, operador, tarefa e período.  
- **RF-26**: Disponibilizar relatórios de timesheet com filtros e exportação.  
- **RF-28**: Cadastrar custo/hora por operador/senioridade.  
- **RF-29**: Calcular custo operacional por cliente, período, tarefa/rotina.  
- **RF-30**: Gerar indicadores de rentabilidade (receita contratada vs custo, margem em R$ e %).  
- **RF-31**: Destacar clientes com margem abaixo de limite configurado.

### 6.8. Atribuição em massa e modelos de tarefas

- **RF-32**: Manter biblioteca de modelos de rotinas/tarefas reutilizáveis.  
- **RF-33**: Importar modelos para múltiplos clientes em lote.  
- **RF-34**: Editar em massa recorrência, datas relativas, priorização, responsável padrão.  
- **RF-35**: Atribuir/reatribuir tarefas em massa para operadores.

### 6.9. Regras de negócio – foco em uma empresa por vez

- **RF-36**: Habilitar modo foco para um cliente (UI e contextos filtrados).  
- **RF-37**: Controlar alternância entre clientes, alertando o usuário quando alternar demais sem concluir/pausar tarefas.  
- **RF-38**: Registrar blocos de trabalho focado no timesheet (cliente e período).  
- **RF-39**: Permitir parametrizar políticas de foco por gestor (ex.: limite de clientes simultâneos).

---

## 7. Modelo de dados (alto nível)

- **Cliente**: id, CNPJ, razão, receita mensal, status, tags.  
- **Usuário**: id, nome, e-mail, papel, clientes associados.  
- **RotinaModelo**: id, nome, periodicidade, checklists padrão.  
- **RotinaCliente/Tarefa**: id, clienteId, modeloId, datas, responsável, status.  
- **Solicitação**: id, clienteId, origem, descrição, status, anexos.  
- **Documento**: id, clienteId, tarefaId/solicitaçãoId, metadados, storageKey.  
- **IntegraçãoERP**: id, clienteId, tipoERP, token, configF360.  
- **EmpresaF360Mapeada**: id, clienteId, f360EmpresaId, CNPJ, contasSelecionadas.  
- **SnapshotFinanceiro**: id, clienteId, tipoIndicador, payload normalizado, timestamp.  
- **Timesheet**: id, usuárioId, clienteId, tarefaId, tipoAtividade, início/fim, duração, custoCalculado (derivável).

---

## 8. Requisitos não funcionais

- **Performance:**  
  - Dashboard de gestor deve carregar em até 3s para carteiras médias, definidas como 10–50 clientes ativos no contexto do gestor (mensurável por carga de dados e tempo de resposta).  
- **Segurança:**  
  - HTTPS obrigatório.  
  - Criptografia em repouso para tokens F360 e segredos.  
  - Logs de auditoria para operações sensíveis (cofre, integrações, permissões).  
- **Disponibilidade:**  
  - Meta interna inicial de 99% de uptime (sem SLA público no MVP).  
- **Observabilidade:**  
  - Logs estruturados de integração (endpoint, status, latência).  
  - Métricas de falhas, tempo médio de sincronização, volume de chamadas por cliente.  

- **Web (tipo produto):**
  - Suporte a navegadores: Chrome, Edge e Firefox nas duas versões principais (MVP); Safari opcional.
  - Layout responsivo: uso em desktop (primário) e tablet; experiência legível em viewport ≥ 1024px.
  - Acessibilidade: nível alvo WCAG 2.1 AA para telas principais (login, dashboard, listas, formulários críticos); trilha de melhorias contínuas.

---

## 9. Riscos e hipóteses

- **Riscos principais:**
  - Mudanças na API do F360 (contratos, limites).  
  - Complexidade de mapping multi-empresa/multi-conta.  
  - Resistência de operadores se a UX não reduzir de fato o atrito vs planilhas.

- **Hipóteses:**
  - H1: Gestores valorizam ver indicadores F360 dentro da ferramenta de tarefas a ponto de adotar BPO360.  
  - H2: Usar F360 como ERP principal permite validar a tese rapidamente antes de suportar outros ERPs.  

---

## 10. Roadmap (alto nível)

- **Release 1 – MVP interno:**
  - Núcleo de clientes, rotinas, tarefas, comunicação e documentos.  
  - Integração F360 básica (login + indicadores principais).  
  - Dashboard por cliente e visão geral para gestor.  
  - Cofre de senhas mínimo.  

- **Release 2 – Operação e gestão avançada:**
  - Timesheet completo, custo operacional, rentabilidade.  
  - Atribuição em massa, biblioteca de modelos, modo foco refinado.  
  - Observabilidade da integração (logs, alertas, melhorias de UX de falha).  

- **Release 3 – Preparação para SaaS externo:**
  - Fortalecimento de segurança (MFA, mais trilhas).  
  - Multi-tenant robusto para múltiplos BPOs.  
  - Billing e planos.  
  - Documentação externa de produto e eventual API.

---

## 11. Anexo técnico – Integração F360

*Detalhe de referência para rastreabilidade e decisões de produto; detalhes de implementação podem ser documentados no documento de arquitetura.*

### 11.1. Componentes lógicos

- **F360AuthService**
  - Chama `/PublicLoginAPI/DoLogin` com o token configurado do cliente.  
  - Armazena o JWT e controla expiração/renovação.  
  - Interface exposta internamente: `getValidJwt(clienteId): JwtToken`.

- **F360ApiClient**
  - Wrapper para chamadas autenticadas à API do F360 (relatórios/movimentações).  
  - Usa `F360AuthService` para obter o JWT válido.  
  - Métodos principais (conceituais):
    - `getSaldos(clienteId, dataRef)`  
    - `getContasReceber(clienteId, filtros)`  
    - `getContasPagar(clienteId, filtros)`  
    - `getConciliaçõesPendentes(clienteId, dataRef)`  

- **F360SyncJob**
  - Job agendado/manual que:
    - Resolve mapeamentos de empresa/contas para o cliente.  
    - Chama `F360ApiClient` para cada tipo de dado.  
    - Normaliza as respostas e grava `SnapshotFinanceiro`.  

### 11.2. Fluxos principais

#### 11.2.1. Fluxo de configuração inicial

1. Admin acessa tela de integração do cliente.  
2. Informa token F360.  
3. Sistema chama `F360AuthService.loginComToken(token)` → `/PublicLoginAPI/DoLogin`.  
4. Se sucesso, JWT é armazenado; se erro, exibir mensagem e não salvar.  
5. Sistema chama `F360ApiClient.getEmpresas()` para listar empresas disponíveis (quando suportado pela API).  
6. Admin mapeia empresas/contas F360 ao cliente.  
7. Configuração é salva e uma primeira execução de `F360SyncJob` é disparada.

#### 11.2.2. Fluxo de sincronização agendada

1. Scheduler dispara `F360SyncJob` em intervalos configurados.  
2. Para cada cliente com F360 ativo:
   - Obtém JWT via `F360AuthService.getValidJwt(clienteId)`.  
   - Para cada empresa/conta mapeada:
     - Chama `getSaldos`, `getContasReceber`, `getContasPagar`, `getConciliaçõesPendentes` com filtros de data (hoje) e status.  
   - Consolida os dados por cliente (somatórios e listas).  
   - Cria registro `SnapshotFinanceiro` com payload normalizado e timestamp.  
3. Em caso de erro:
   - Se erro de autenticação: tenta renovar o JWT uma vez; se persistir, marca snapshot como falho e registra log.  
   - Se erro de negócio/infra: registra log e segue para próximos clientes.

#### 11.2.3. Fluxo de atualização manual (UI)

1. Usuário clica em “Atualizar agora” no dashboard de um cliente.  
2. API interna chama `F360SyncJob.runSingle(clienteId)`.  
3. Após término, a UI:
   - Recarrega os indicadores usando o último `SnapshotFinanceiro`.  
   - Atualiza o timestamp de última sincronização.

### 11.3. Pseudo-modelos de dados internos

```markdown
F360EmpresaMapeada
- id
- clienteId
- f360EmpresaId
- cnpj
- nome
- contasSelecionadas: [F360ContaMapeada]

F360ContaMapeada
- id
- empresaMapeadaId
- f360ContaId
- descricao
- incluirNoSaldo: boolean
```

```markdown
SnapshotFinanceiro
- id
- clienteId
- dataReferencia: date
- criadoEm: datetime
- origem: "F360"
- indicadores:
    saldo:
      - porConta: [{ contaId, descricao, valor }]
      - consolidado: number
    contasReceber:
      - hoje: { quantidade, valorTotal }
      - vencidas: { quantidade, valorTotal }
    contasPagar:
      - hoje: { quantidade, valorTotal }
      - vencidas: { quantidade, valorTotal }
    conciliacoesPendentes:
      - quantidade
      - valorTotal
- detalhes:
    receberHoje: [TituloFinanceiro]
    receberVencidos: [TituloFinanceiro]
    pagarHoje: [TituloFinanceiro]
    pagarVencidos: [TituloFinanceiro]
    conciliacoesPendentes: [MovimentoBancario]
```

```markdown
TituloFinanceiro
- idExterno: string (id no F360)
- tipo: "pagar" | "receber"
- descricao
- sacadoOuCedente
- vencimento: date
- valor: number
- status: "aberto" | "pago" | "parcial" | ...

MovimentoBancario
- idExterno: string (id no F360)
- contaId
- dataMovimento: date
- descricao
- valor: number
- conciliado: boolean
```

### 11.4. Contratos internos (interfaces entre camadas)

```markdown
interface F360AuthService {
  loginComToken(token: string): JwtToken
  getValidJwt(clienteId: string): JwtToken
}

interface F360ApiClient {
  getEmpresas(jwt: JwtToken): EmpresaF360[]
  getSaldos(jwt: JwtToken, empresaId: string, dataRef: date): SaldoF360[]
  getContasReceber(jwt: JwtToken, empresaId: string, filtros: FiltrosTitulos): TituloF360[]
  getContasPagar(jwt: JwtToken, empresaId: string, filtros: FiltrosTitulos): TituloF360[]
  getConciliaçõesPendentes(jwt: JwtToken, empresaId: string, dataRef: date): MovimentoF360[]
}

interface F360SyncJob {
  runAll(): void
  runSingle(clienteId: string): void
}
```

Esses contratos são conceituais; a implementação real pode adaptar nomes/tipos conforme SDK, linguagem e detalhes da API F360.

### 11.5. Diagrama de fluxo da integração F360

```mermaid
flowchart LR
  subgraph BPO360["BPO360 (plataforma)"]
    UI[UI Admin<br/>Config. Integração]
    DASH[Dashboard Cliente]
    AUTH[F360AuthService]
    API[F360ApiClient]
    SYNC[F360SyncJob]
    MAP[Mapeamento<br/>Empresa/Contas]
    SNAP[SnapshotFinanceiro<br/>(banco)]
  end

  subgraph F360["F360 Finanças (API)"]
    LOGIN[/PublicLoginAPI/DoLogin/]
    REL[/PublicRelatorioAPI/GerarRel<br/>(saldos, pagar/receber, conciliação)/]
  end

  UI -->|token F360| AUTH
  AUTH -->|JWT| LOGIN
  LOGIN -->|JWT válido| AUTH

  UI --> MAP
  MAP --> SYNC

  SYNC -->|getValidJwt(cliente)| AUTH
  AUTH -->|JWT| API
  API -->|chamada relatórios| REL
  REL -->|dados brutos| API
  API -->|dados normalizados| SYNC
  SYNC -->|salva| SNAP

  SNAP --> DASH
  DASH -->|Atualizar agora| SYNC
```

