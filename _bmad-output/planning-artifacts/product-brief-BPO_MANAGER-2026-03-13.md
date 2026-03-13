## MVP Scope

### Core Features

- **Gestão de clientes e vínculo com F360**
  - Cadastro de clientes BPO (CNPJ, dados básicos, parâmetros financeiros).
  - Associação de cada cliente ao F360 como ERP principal, já preparada para múltiplos ERPs no futuro.
  - Tela de mapeamento BPO360 ↔ F360 (empresa(s), contas bancárias relevantes).

- **Rotinas, tarefas e checklists**
  - Modelos de rotinas recorrentes (contas a pagar/receber, conciliação, fechamento, folha etc.).
  - Geração automática de tarefas em calendário por cliente, com responsáveis, prazos, prioridade e SLA.
  - Checklists detalhados por tarefa, histórico de mudanças e comentários.

- **Central de comunicação e documentos**
  - Registro de solicitações (tickets) internas ou de clientes, sempre vinculadas a cliente e opcionalmente a tarefas.
  - Upload de documentos e anexos atrelados a tarefas/solicitações.
  - Timeline unificada por cliente (tarefas, solicitações, documentos, comentários).

- **Indicadores financeiros integrados ao F360**
  - Dashboard por cliente com:
    - Saldos do dia por conta e consolidado.
    - Contas a receber (hoje e vencidas).
    - Contas a pagar (hoje e vencidas).
    - Conciliações bancárias pendentes.
  - Atualização agendada + ação “Atualizar agora”, com timestamp claro de última sincronização.
  - Normalização de dados F360 em snapshots internos para uso seguro na UI.

- **Timesheet, custo operacional e rentabilidade**
  - Registro de tempo por tarefa/cliente e por tipo de atividade.
  - Cadastro de custo/hora por operador/senioridade.
  - Cálculo de custo operacional por cliente/período e geração de indicadores de rentabilidade (receita vs custo, margem em R$ e %), destacando clientes abaixo do limite configurado.

- **Atribuição em massa e biblioteca de modelos**
  - Biblioteca de modelos de rotinas/tarefas reutilizáveis.
  - Importação de modelos para múltiplos clientes em lote.
  - Edição em massa de recorrência, datas, responsável padrão e prioridade.
  - Atribuição/reatribuição em massa de tarefas para operadores.

- **Modo foco “uma empresa por vez”**
  - Modo de trabalho focado por cliente, com UI filtrada e registro de blocos de foco no timesheet.
  - Regras simples de alerta quando o operador alterna demais entre clientes sem concluir/pausar tarefas.

- **Segurança básica + cofre de senhas**
  - Gestão de usuários internos (admin, gestor, operador) e de clientes, com escopos por CNPJ.
  - Cofre de senhas com criptografia em repouso, mascaramento e trilha de acesso.
  - Armazenamento seguro de tokens/JWT do F360, com renovação automática e tratamento de erros de autenticação.

### Out of Scope for MVP

- IA para autopreenchimento de lançamentos a partir de documentos (OCR + classificação + sugestão de campos).
- Integrações profundas com outros ERPs (Omie, Conta Azul, Nibo etc.) além do F360 como foco inicial.
- App mobile próprio para cliente final (white-label) – etapa posterior, similar ao “Financeiro na Mão”.
- SLA enterprise formal (ex.: 99,9% uptime), certificações (ISO, SOC2) e status page pública.
- Mecanismos completos de billing/assinaturas multi-BPO (planos, cobrança recorrente, auto-onboarding de terceiros).

### MVP Success Criteria

- **Operação**
  - Pelo menos 1–2 squads internos de BPO usando a ferramenta como sistema principal de tarefas + indicadores F360 por 3–6 meses.
  - Redução perceptível de tarefas atrasadas e de retrabalho em clientes pilotados (com monitoramento de TMT, retrabalho e % de tarefas dentro do SLA).

- **Integração F360**
  - Integração estável em produção com F360 para clientes piloto, com taxa de falhas de sincronização dentro de limites aceitáveis e UX de erro compreensível para times internos.
  - Painéis de gestor sendo usados ativamente para priorização (uso recorrente dos dashboards em rotinas de gestão).

- **Viabilidade de produto**
  - Evidência de que o modelo baseado em F360 resolve dores reais de BPO em carteira piloto (feedback qualitativo + métricas de uso).
  - Confirmação de que o modelo arquitetural (auth, sync jobs, snapshots) é escalável para próxima fase (mais clientes e, no futuro, mais ERPs).

### Future Vision

- **Pós-MVP (Release 2+)**
  - Evolução de timesheet, rentabilidade e modo foco (mais automação, alertas inteligentes, relatórios avançados).
  - Observabilidade mais rica da camada de integração (dashboards de erros, latência, health checks, alertas).

- **Expansão de produto (Release 3+)**
  - App mobile white-label para cliente final, substituindo de vez o WhatsApp como canal principal.
  - Integrações com outros ERPs relevantes e abertura de API própria.
  - Recursos de segurança enterprise e multi-tenant robusto para operar como SaaS para múltiplos BPOs, com billing completo.
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - docs/deep-research-report_playbpo.md
  - https://documenter.getpostman.com/view/68066/Tz5m8Kcb#intro
date: 2026-03-13
author: Tiago
---

# Product Brief: BPO_MANAGER

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

O BPO_MANAGER nasce para destravar o crescimento dos escritórios de BPO financeiro que hoje operam num mosaico improvisado de planilhas, WhatsApp, e-mails e ERPs genéricos. Em vez de tentar encaixar o BPO em ferramentas horizontais ou forçar o uso do próprio ERP como “gestor de tarefas”, o BPO_MANAGER se posiciona como a plataforma operacional do BPO financeiro, desenhada desde o primeiro dia para a realidade brasileira de varejo e franquias.

Na prática, o produto combina três pilares: (i) motor de tarefas padronizado por cliente, (ii) comunicação/integração fluida entre lojista e operador, e (iii) orquestração de lançamentos financeiros diretamente no ERP F360 com inteligência de tempo e rentabilidade. O resultado é uma operação menos dependente de heróis individuais, com visão clara de margem por carteira e uma camada de governança que reduz risco LGPD e vira argumento de venda.

O MVP foca em três entregas fortes: calendário de obrigações por cliente, integração unidirecional de títulos com o F360 via Webhook e um portal simples para upload centralizado de notas/boletos. A partir daí, o produto evolui para um fluxo cada vez mais “sem atrito” entre app white-label no bolso do lojista, analistas do BPO e APIs do F360.

---

## Core Vision

### Problem Statement

Hoje, a maioria dos escritórios de BPO financeiro tenta controlar a operação com uma mistura frágil de Excel, WhatsApp, e-mail e, em alguns casos, gerenciadores de tarefas genéricos ou o próprio ERP forçado a fazer papel de sistema de processos. Documentos fiscais chegam por múltiplos canais, se perdem no caminho, e o conhecimento de “como fazer” para cada cliente fica preso na cabeça de poucos operadores.

Esse modelo impõe um “teto invisível” de crescimento: para cada novo cliente relevante, o escritório precisa adicionar quase o mesmo número de pessoas, tornando o negócio pouco escalável e corroendo a margem. Ao mesmo tempo, o uso de WhatsApp e canais informais para troca de senhas e dados financeiros expõe o BPO a riscos reais de não conformidade com LGPD.

### Problem Impact

Se nada mudar nos próximos dois anos, muitos BPOs vão estagnar em um platô operacional: não conseguem crescer carteira sem aumentar headcount na mesma proporção, perdem dinheiro em clientes supostamente “premium”, e convivem com o medo constante de incidentes de segurança e vazamento de dados.

Na prática, um analista de férias é suficiente para paralisar a entrega de determinados clientes, porque o processo não está mapeado em lugar nenhum. E, sem métricas de tempo por cliente, gestores seguem renovando contratos deficitários sem perceber, enquanto carregam um risco silencioso de compliance ao trafegar dados sensíveis em canais não controlados.

### Why Existing Solutions Fall Short

Ferramentas genéricas de processos (como Pipefy ou Asana) ajudam a organizar tarefas, mas não entendem o domínio financeiro: não oferecem cofre de senhas adequado, não calculam rentabilidade de contratos e não falam a linguagem de centros de custo, conciliação de adquirentes e rotinas fiscais brasileiras.

Os ERPs (Conta Azul, Nibo, Omie, entre outros) fazem muito bem a execução do financeiro em si, mas não organizam a rotina do escritório de BPO: não cuidam de SOPs por cliente, delegação detalhada entre analistas, ou timesheet que ligue esforço de trabalho à saúde do contrato.

Soluções especializadas como PlayBPO avançam bem na tese de gestão de BPO financeiro, mas ainda deixam espaço para um produto que vá mais fundo na integração nativa com ecossistemas específicos – como o varejo atendido pelo F360 – com fluxos bidirecionais e orquestração resiliente de APIs, de um jeito que o operador não precise viver alternando entre telas.

### Proposed Solution

O BPO_MANAGER propõe um fluxo onde o BPO se torna, de fato, o “cérebro operacional” entre o lojista e o ERP F360. O cliente final abre um app white-label com a marca do escritório, tira a foto de um boleto de fornecedor e, a partir daí, todo o resto acontece dentro do produto.

A IA do sistema lê a imagem, cria um rascunho de lançamento e coloca a tarefa correspondente na fila do analista, já com o timesheet rodando de forma invisível. O operador abre o seu quadro, vê a tarefa “Lançar Despesa”, confere e ajusta os dados pré-preenchidos pela IA na mesma tela e conclui a tarefa. No mesmo instante, o BPO_MANAGER dispara um payload JSON via Webhook para a API do F360 e cria automaticamente o “Contas a Pagar” lá no ERP do lojista. No fim do dia, o gestor enxerga, em um único painel, quanto tempo cada cliente consumiu e qual a margem de lucro associada, com base em dados reais de esforço.

O MVP se ancora em três blocos: um motor de tarefas/checklists por cliente, uma integração unidirecional confiável com o F360 e um portal/inbox para centralizar upload de documentos e tirar a operação do WhatsApp.

### Key Differentiators

- **Integração Nativa de Varejo com F360**: o BPO_MANAGER fala a língua do varejo e das franquias ao integrar-se diretamente com a complexidade de centros de custo, conciliação de adquirentes e particularidades do F360, em vez de ficar em cima de integrações genéricas e superficiais.
- **Timesheet Invisível e Inteligência de Rentabilidade**: o rastreamento de tempo é automático e contextual – não depende de o operador “lembrar de marcar horas”. Isso permite ao gestor fazer reajustes de contrato com base em dados concretos de esforço e margem.
- **Governança by Design**: cofre de senhas embarcado, controle de acesso RBAC e arquitetura pensada para reduzir o risco de vazamentos e não conformidade, transformando segurança em argumento comercial, não só em obrigação.
- **App White-Label como Defensiva de Mercado**: ao colocar um aplicativo com a marca do escritório no bolso do dono da loja e criar o hábito diário de enviar e aprovar documentos por ali, o BPO_MANAGER aumenta drasticamente o custo de troca do cliente.
- **Arquitetura de Orquestração Resiliente**: uma camada de middlewares e tolerância a falhas nas chamadas à API do F360, desenhada para não perder lançamentos mesmo em cenários de instabilidade, algo que demanda tempo, observabilidade e investimento de engenharia para ser copiado.

## Target Users

### Primary Users

**Gestor de Operação de BPO Financeiro (escritórios e squads dedicados)**  
- Profissional responsável por garantir que todas as rotinas financeiras dos clientes sejam executadas no prazo, com qualidade e margem saudável. Atua em empresas que prestam BPO financeiro para PMEs, varejo e, muitas vezes, carteiras com dezenas ou centenas de CNPJs.  
- Hoje se apoia em uma mistura de planilhas, ERPs, WhatsApp/e-mail e, às vezes, ferramentas genéricas de tarefas. Sofre com falta de visibilidade em tempo real da operação, dependência de analistas específicos e dificuldade de medir rentabilidade por cliente.  
- Sucesso para ele é conseguir escalar a carteira sem aumentar headcount na mesma proporção, ter clareza de produtividade e margem por cliente e reduzir risco operacional/compliance em auditorias e renovações de contrato.

**Operador/Analista de BPO Financeiro**  
- Profissional que executa as rotinas diárias: receber documentos, lançar contas a pagar/receber, conciliar, seguir checklists de fechamento, atender dúvidas pontuais dos clientes.  
- Hoje vive alternando entre sistemas (ERP, planilhas, WhatsApp, e-mail) e precisa “lembrar” das particularidades de cada cliente (regras, exceções, prazos), geralmente guardadas na cabeça ou em anotações soltas.  
- Sucesso para ele é ter um fluxo claro de “o que fazer hoje”, com menos retrabalho, menos caça a documentos e menos necessidade de ficar cobrando o cliente em múltiplos canais.

### Secondary Users

**Sócio/Dono de Escritório de BPO/Contabilidade**  
- Decide investir em plataformas que aumentem margem, reduzam risco e melhorem a experiência do cliente final. Acompanha indicadores de crescimento da carteira, churn e satisfação dos principais clientes.  
- Não usa o sistema no dia a dia, mas é fortemente impactado por relatórios de produtividade, rentabilidade por cliente e riscos de segurança/compliance.

**Cliente Final (Dono de Loja / Gestor de Unidade / Responsável Financeiro Local)**  
- Usa app ou portal para enviar documentos, acompanhar pendências e, em alguns casos, aprovar pagamentos ou responder dúvidas do BPO.  
- Hoje interage principalmente por WhatsApp/e-mail, com pouca clareza sobre status das demandas e sem um canal único para a operação financeira com o BPO.  
- Sucesso para ele é ter um jeito simples, rápido e confiável de “passar tudo para o BPO” e sentir que a operação está sob controle sem precisar entender o detalhamento técnico.

### User Journey

**Discovery**  
- Gestores e sócios de BPO conhecem soluções como PlayBPO e concorrentes via conteúdo educacional, eventos setoriais e indicações em comunidades contábeis/financeiras. A percepção de “caos em planilhas + WhatsApp” e a pressão por escala levam à busca por uma plataforma vertical.

**Onboarding**  
- Após demonstração, o escritório começa com um grupo piloto de clientes. O time de operação configura checklists/rotinas no sistema, integra alguns ERPs (como F360) e orienta clientes finais a usar app/portal para envio de documentos.  
- O foco inicial é tirar o fluxo operacional do WhatsApp/e-mail e centralizar tarefas e documentos em um único lugar.

**Core Usage**  
- Diariamente, analistas acessam o quadro de tarefas por cliente, recebem documentos do app/portal ou e-mail roteado, executam lançamentos (com crescente apoio de IA) e acompanham pendências.  
- Gestores monitoram painéis de produtividade e rentabilidade por cliente e ajustam alocação de time ou contratos à medida que dados reais de esforço ficam disponíveis.  
- Clientes finais usam o app/portal para enviar notas/boletos, responder solicitações e, em alguns casos, aprovar pagamentos.

**Success Moment (“aha!”)**  
- O gestor de BPO percebe que conseguiu adicionar novos clientes sem contratar na mesma proporção, graças a rotinas padronizadas, menos retrabalho e melhor uso do time.  
- O cliente final percebe que deixar de enviar documentos por WhatsApp e passar a usar o app/portal reduziu esquecimentos, atrasos e retrabalho nas interações com o BPO.

**Long-term**  
- O produto passa a ser o “sistema nervoso” da operação: todos os novos clientes são onboardados diretamente na plataforma, integrações com ERPs (como F360) se tornam parte do contrato-padrão, e dados de tempo/margem sustentam decisões de precificação, expansão e priorização de roadmap.

## Success Metrics

Do ponto de vista do usuário de operação (analistas e gestores de BPO financeiro), o sucesso do BPO_MANAGER é medido por uma rotina mais fluida, menos manual e com muito menos risco de erro ou atraso. Para o negócio (escritório de BPO/contabilidade), o sucesso se traduz em romper o “teto invisível” de clientes por operador, aumentar margem líquida e reduzir churn ao transformar o serviço em uma plataforma difícil de substituir.

### Business Objectives

- **Elevar a densidade produtiva (Clientes por Operador)**  
  - Sair do patamar tradicional de 3–5 clientes ativos por analista para um cenário em que um único operador consegue gerenciar com segurança de 8 a 12 empresas de varejo/franquias, mantendo qualidade de entrega.
  - Permitir aumento de faturamento sem crescimento proporcional de headcount, reduzindo a pressão de contratar sempre que novos clientes entram.

- **Aumentar a Margem de Rentabilidade Líquida da carteira**  
  - Usar o timesheet integrado para medir com precisão o custo-hora por cliente e identificar contratos deficitários.  
  - Buscar uma melhoria geral de margem líquida da carteira na ordem de **20% a 30%**, via reajuste de contratos, reprecificação ou descontinuação de clientes que consomem esforço excessivo.

- **Reduzir churn e aumentar retenção de clientes**  
  - Transformar o BPO em parceiro tecnológico percebido (e não apenas “lançador de despesas”), através de app/portal white-label e operação mais previsível.  
  - Reduzir o cancelamento anual e aumentar a vida média de contrato ao tornar a troca de fornecedor operacionalmente e culturalmente mais custosa para o cliente final.

### Key Performance Indicators

**User Success (Operador/Gestor de BPO)**  
- **Redução do Tempo Médio de Tratamento (TMT) de rotinas em até 60%**  
  - Menos tempo cobrando documentos via WhatsApp/e-mail, digitando lançamentos manualmente e conciliando “no olho”, graças à extração inteligente de dados e integração nativa com o ERP do cliente (especialmente F360).  
  - O analista passa a atuar majoritariamente como conferente, não como digitador de informação.

- **≥ 95% das tarefas concluídas dentro do prazo de SLA**  
  - Com motor de processos (SOPs) e checklists padronizados por cliente, a equipe deixa de depender de memória individual ou planilhas dispersas.  
  - Ausências pontuais (férias, afastamentos) deixam de paralisar entregas críticas porque o processo está no sistema, não só na cabeça das pessoas.

- **Queda drástica em retrabalho e exceções operacionais**  
  - Redução significativa de erros comuns (dados trocados, duplicidade de pagamentos, lançamentos fora de competência) graças a validações automáticas e menor intervenção manual.  
  - Monitoramento de tickets de correção/retrabalho ao longo do tempo como indicador de maturidade da operação.

**Business Success (Escritório de BPO)**  
- **Clientes ativos por operador (Clientes/Operador)**  
  - KPI de densidade produtiva acompanhando o descolamento da curva de clientes vs. headcount.  
  - Meta: atingir e sustentar o patamar alvo de 8–12 empresas de varejo/franquia por analista, com SLA e qualidade preservados.

- **Margem de rentabilidade líquida por cliente e por carteira**  
  - Margem calculada combinando receita contratual vs. custo-hora apurado via timesheet integrado.  
  - Meta: incremento de **20%–30%** na margem média da carteira em 12 meses, via decisões orientadas por dados.

- **Taxa de churn anual e vida média de contrato**  
  - Acompanhamento de cancelamentos mensais/anuais e da duração média dos contratos.  
  - Meta: redução gradual do churn à medida que app/portal white-label vira o canal padrão de operação e aumenta o custo de troca percebido pelo cliente.
