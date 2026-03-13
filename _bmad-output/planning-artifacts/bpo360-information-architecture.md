---
title: BPO360 – Arquitetura de Informação e Sitemap
relatedDoc: prd.md
---

## 1. Visão geral

Este documento descreve a arquitetura de informação e o sitemap do BPO360, mapeando **telas principais** e os **fluxos** que passam por cada uma delas. Serve como referência direta para UX/UI (ex.: Figma) e para alinhamento entre produto, design e engenharia.

---

## 2. Estrutura raiz do app

- **/login**
  - Tela de autenticação para todos os papéis (admin, gestor, operador, cliente).

- **/app**
  - Shell principal (header, side-nav, contexto de usuário/papel).
  - Entradas principais:
    - `Dashboard / Home`
    - `Clientes`
    - `Tarefas / Hoje`
    - `Integrações`
    - `Timesheet / Relatórios`
    - `Admin / Configurações`

---

## 3. Dashboard / Home

- **/app/home**
  - Para **gestor**:
    - Resumos: carteira, clientes em risco, integrações com problema.
    - Atalhos para: `Carteira de clientes`, `Integrações`, `Relatórios`.
    - Fluxos:
      - Gestor acompanha saúde da carteira (entrada rápida).
      - Visualizar status geral de integrações.
  - Para **operador**:
    - Bloco “Tarefas de hoje” por cliente.
    - CTA `Entrar em modo foco`.
    - Fluxos:
      - Operador executa rotina diária.
      - Ativar modo foco para um cliente.
  - Para **cliente (empresa)**:
    - Cards: pendências, pagamentos de hoje, documentos faltando.
    - Fluxos:
      - Cliente acompanha pendências e solicitações.

---

## 4. Clientes (lista + detalhe)

### 4.1. Lista de clientes – Carteira

- **/app/clientes**
  - Tabela/grade de clientes com:
    - Nome, CNPJ, tags.
    - Chips de risco: tarefas, financeiro, margem.
    - Mini indicadores F360 (resumo).
    - Status de integração.
  - Filtros:
    - Risco, margem, ERP, tags, F360 ativo.
  - Fluxos:
    - Listagem e filtro de clientes.
    - Gestor acompanha saúde da carteira.
    - Entrar no detalhe de um cliente.

### 4.2. Detalhe do cliente – Visão 360

- **/app/clientes/:clienteId**
  - Layout com abas/segmentos:
    - `Resumo` (default)
    - `Tarefas & Rotinas`
    - `Financeiro (F360)`
    - `Timeline`
    - `Rentabilidade`
    - `Configurações / Integração`
  - Fluxos:
    - Visualização 360 de um cliente.
    - Gestor entra em detalhe para análise de risco.
    - Operador abre painel do cliente a partir do modo foco.
    - Admin revisa integração F360 do cliente.

#### 4.2.1. Cliente – Resumo

- Cards principais:
  - Saúde operacional, saúde financeira, margem.
  - Principais indicadores F360.
  - Principais tarefas/rotinas do período.
- Fluxos:
  - Ponto de entrada para drill-down em Tarefas, Financeiro, Rentabilidade.

#### 4.2.2. Cliente – Tarefas & Rotinas

- **/app/clientes/:clienteId/tarefas**
  - Lista de tarefas com filtros (data, status, responsável, tipo).
  - Acesso à criação/edição de tarefas e rotinas.
  - Fluxos:
    - Visualização de lista de tarefas por cliente.
    - Configuração de tarefa (responsável, datas, prioridade, SLA).
    - Atualização de status de tarefa.
    - Registro de histórico e comentários de tarefa.

#### 4.2.3. Cliente – Financeiro (F360)

- **/app/clientes/:clienteId/financeiro**
  - Dashboard financeiro com cards de:
    - Saldo por conta e consolidado.
    - Contas a receber: hoje, vencidas.
    - Contas a pagar: hoje, vencidas.
    - Conciliações bancárias pendentes.
  - Fluxos:
    - Visualização de dashboard financeiro por cliente.
    - Drill-down de cards para listas detalhadas.
    - Ver horário da última sincronização e estado dos dados.

#### 4.2.4. Cliente – Timeline

- **/app/clientes/:clienteId/timeline**
  - Linha do tempo unificada:
    - Tarefas, solicitações, uploads de documentos, comentários.
  - Fluxos:
    - Timeline unificada por cliente.
    - Revisão rápida de histórico de interação.

#### 4.2.5. Cliente – Rentabilidade

- **/app/clientes/:clienteId/rentabilidade**
  - Indicadores:
    - Receita contratada, custo, margem (% e R$).
    - Distribuição de horas por tipo de atividade.
  - Fluxos:
    - Cálculo e visualização de rentabilidade por cliente.
    - Destacar clientes com margem abaixo de limite.

#### 4.2.6. Cliente – Configurações / Integração

- **/app/clientes/:clienteId/config**
  - Seções:
    - Dados cadastrais (CNPJ, receita, tags, status).
    - Integração F360 (atalho para módulo dedicado).
    - Políticas de foco específicas (opcional).
  - Fluxos:
    - Edição de dados de cliente.
    - Ativar/desativar integração por cliente.

---

## 5. Tarefas, Rotinas e Modo Foco

### 5.1. Painel “Hoje” / Tarefas globais

- **/app/tarefas/hoje**
  - Para operador:
    - Lista de clientes com tarefas para hoje.
    - Lista geral de tarefas (todas empresas), se necessário.
    - CTA `Entrar em foco em [cliente]`.
  - Fluxos:
    - Operador visualiza painel Hoje.
    - Escolher cliente e entrar em modo foco.

### 5.2. Modo Foco – Empresa por vez

- **/app/foco/:clienteId**
  - Layout 2 colunas:
    - Esquerda: tarefas do dia para o cliente.
    - Direita: detalhe da tarefa selecionada (checklist + dados F360 + timesheet).
  - Barra superior:
    - Indicação de cliente em foco.
    - Ações para sair ou trocar de cliente.
  - Fluxos:
    - Executar rotina diária de um cliente.
    - Executar conciliação bancária com dados F360.
    - Registro de tempo integrado (start/stop).
    - Controle de alternância entre clientes (alertas).

### 5.3. Modelos de rotinas e atribuição em massa

- **/app/modelos**
  - Biblioteca de modelos de rotinas/tarefas reutilizáveis.
  - Fluxos:
    - Criar/editar modelo de rotina.
    - Gerenciar biblioteca de modelos.

- **/app/atribuicao-massa**
  - Tela para:
    - Importar modelos para múltiplos clientes em lote.
    - Editar em massa recorrência, datas relativas, prioridade, responsável padrão.
    - Atribuir/reatribuir tarefas em massa para operadores.
  - Fluxos:
    - Importar modelos em lote.
    - Atribuição em massa para operadores.

---

## 6. Central de Comunicação e Documentos

### 6.1. Central de solicitações

- **/app/solicitacoes**
  - Lista de tickets com filtros (cliente, status, origem).
  - Fluxos:
    - Abertura de solicitação interna.
    - Gestão de solicitações do cliente.

### 6.2. Detalhe da solicitação

- **/app/solicitacoes/:id**
  - Conteúdo:
    - Dados principais, cliente, tarefa associada (opcional).
    - Mensagens, anexos.
  - Fluxos:
    - Responder solicitação.
    - Anexar documentos.
    - Encerrar solicitação.

### 6.3. Central de documentos

- **/app/documentos**
  - Lista/global de documentos com filtros (cliente, tipo, data).
  - Fluxos:
    - Upload de documentos (via tarefa/solicitação ou direto).
    - Consulta de documentos por cliente.

---

## 7. Integrações & F360

### 7.1. Visão geral de integrações

- **/app/integacoes**
  - Lista de clientes com status da integração F360 (e futuros ERPs).
  - Fluxos:
    - Visualizar status geral de integrações.
    - Acessar configuração F360 por cliente.

### 7.2. Configuração F360 por cliente (wizard)

- **/app/integacoes/f360/:clienteId**
  - Passos:
    1. Token F360 → validar.
    2. Mapeamento de empresas F360.
    3. Seleção de contas bancárias relevantes.
    4. Primeira sincronização (feedback).
  - Fluxos:
    - Configurar integração F360.
    - Reconfigurar token / corrigir erro.
    - Disparar primeira sincronização.

### 7.3. Logs e histórico de snapshots

- **/app/integacoes/logs**
  - Logs de chamadas de API, erros, latências.
  - Lista de snapshots por cliente (timestamp, status).
  - Fluxos:
    - Monitorar falhas e tempo de sincronização.

---

## 8. Timesheet, Custo e Relatórios

### 8.1. Registro de tempo do usuário

- **/app/timesheet/minhas-entradas**
  - Lista dos blocos de tempo do usuário.
  - Ações: ajustar, excluir, adicionar manualmente.
  - Fluxos:
    - Registro manual e revisão do tempo.

### 8.2. Relatórios de timesheet

- **/app/timesheet/relatorios**
  - Filtros: cliente, período, operador, tipo de atividade.
  - Tabelas + exportação CSV/Excel.
  - Fluxos:
    - Consolidar tempos por cliente/operador/tarefa/período.
    - Exportar relatórios.

### 8.3. Configuração de custo/hora

- **/app/admin/custos**
  - Cadastro de custo/hora por operador / senioridade.
  - Fluxos:
    - Configurar custos operacionais.

---

## 9. Segurança, Usuários e Cofre de Senhas

### 9.1. Gestão de usuários

- **/app/admin/usuarios**
  - Lista de usuários, papéis, clientes associados (para usuários clientes).
  - Fluxos:
    - Cadastro de usuário interno (admin, gestor, operador).
    - Cadastro de usuário cliente.
    - Gestão de papéis e permissões.

### 9.2. Cofre de senhas

- **/app/cofre**
  - Lista de segredos:
    - Nome, tipo, cliente relacionado, tags, última visualização.
  - Fluxos:
    - Cadastro de segredo.
    - Visualização mascarada / revelar segredo.
    - Registrar log de auditoria.
    - Edição/remoção de segredos.

---

## 10. Observabilidade e Alertas

- **/app/monitoracao**
  - Painel com:
    - Status de integrações (resumo).
    - Alertas de dados desatualizados (última sync acima de X horas).
    - Métricas: falhas, tempo médio de sync, volume de chamadas por cliente.
  - Fluxos:
    - Observabilidade da integração.
    - Diagnóstico de problemas.

---

## 11. Uso em UX/UI (Figma)

- Cada URL/tela aqui descrita deve virar:
  - Uma página ou frame principal em Figma (ex.: `4. Clientes – Lista`, `4.2 Cliente – Visão 360`).
  - Um conjunto de variações de estado (loading, vazio, erro, dados normais) quando relevante.
- Este documento é o “mapa de navegação” de referência para:
  - Planejar fluxo de usuários (gestor, operador, cliente, admin).
  - Garantir cobertura completa dos requisitos do PRD.
  - Evitar telas órfãs e rotas sem uso.

