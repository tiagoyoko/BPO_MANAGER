---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-core-experience
  - step-04-emotional-response
  - step-05-inspiration
  - step-06-design-system
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-BPO_MANAGER-2026-03-13.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
  - _bmad-output/planning-artifacts/bpo360-information-architecture.md
---

# UX Design Specification BPO_MANAGER

**Author:** Tiago  
**Date:** 2026-03-13

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

O BPO360 (BPO_MANAGER) é a plataforma operacional do BPO financeiro, desenhada para substituir o mosaico atual de planilhas, WhatsApp, e-mails e ERPs genéricos por um fluxo único e opinado. A visão de produto é ser o “sistema nervoso” do escritório: concentrar tarefas, rotinas, comunicação, documentos e indicadores financeiros em uma experiência web única, fortemente integrada ao F360, permitindo que gestores acompanhem saúde da carteira e rentabilidade por cliente enquanto operadores executam o dia a dia com menos atrito e mais foco.

### Target Users

- **Gestor de operação de BPO financeiro**: precisa acompanhar rapidamente saúde da carteira (tarefas, risco, integrações, margem) e agir em cima de clientes críticos. Usa principalmente as visões de dashboard geral, lista de clientes e Cliente 360 para decidir onde intervir.
- **Operador/analista de BPO**: responsável por executar rotinas diárias (lançamentos, conciliações, cobranças, fechamento). Busca um painel “Hoje” claro e um modo foco que reduza alternância entre clientes e consolide checklist, dados F360 e timesheet em uma única tela.
- **Sócio/dono do escritório** (secundário): não opera no dia a dia, mas é impactado por relatórios de produtividade e rentabilidade, e pela percepção de organização e segurança na operação.
- **Cliente final (lojista / responsável financeiro)**: usa o portal para enviar documentos, acompanhar pendências e responder solicitações, saindo do fluxo fragmentado em WhatsApp/e-mail para um canal único com status visível.

### Key Design Challenges

- **Orquestrar muita informação em poucas superfícies críticas** (Home, Cliente 360, Modo Foco) sem gerar sobrecarga cognitiva, mantendo clara a hierarquia entre indicadores, tarefas e próximos passos.
- **Atender papéis muito distintos dentro do mesmo produto web**, garantindo que cada perfil veja primeiro o que importa para seu trabalho (gestor vs operador vs cliente vs admin) sem confusão de navegação.
- **Representar estados da integração F360 e da “frescura” dos dados** de forma compreensível para usuários de negócio, traduzindo erros técnicos e defasagem de sync em mensagens e padrões visuais claros.
- **Fazer do modo foco uma experiência realmente melhor que o fluxo atual**, incentivando uso consistente e reduzindo alternância improdutiva entre clientes.

### Design Opportunities

- **Transformar a Home e a visão Cliente 360 em painéis de decisão de alta clareza**, com foco em risco, prioridade e ações rápidas, em vez de apenas dashboards informativos.
- **Usar o modo foco como diferencial de produtividade**, com layout enxuto, microinterações e atalhos que façam o operador sentir que “trabalha mais rápido e com menos cansaço” dentro do BPO360.
- **Explorar a timeline unificada e a central de solicitações/documentos como memória viva do cliente**, facilitando onboarding de novos analistas e reduzindo dependência de conhecimento tácito.
- **Trabalhar cuidadosamente microcopy e estados visuais relacionados à integração F360**, transformando um ponto potencialmente frágil (integração) em uma sensação de confiabilidade e transparência para gestores.

## Core User Experience

### Defining Experience

O coração do BPO360 é o operador começando o dia no painel **Hoje**, escolhendo um cliente e entrando em **modo foco** para executar e concluir as tarefas daquela empresa com o mínimo de alternância possível. O valor do produto aparece quando o operador sente que consegue “varrer o dia” de um cliente em uma só tela — checklist, dados financeiros do F360 e registro de tempo — sem precisar pular entre múltiplos sistemas e abas. Em paralelo, para o gestor, a experiência central é abrir a Home / carteira de clientes e, em poucos segundos, identificar quais CNPJs exigem atenção (risco operacional, financeiro ou de margem) e entrar no detalhe do Cliente 360 para decidir o que fazer.

### Platform Strategy

O BPO360 é um **web app desktop-first**, pensado para uso intenso em ambiente de trabalho com mouse e teclado. As principais telas (Home, Clientes, Cliente 360, Hoje, Modo Foco, Integrações, Timesheet, Monitoramento) são otimizadas para monitores ≥ 1024px, com responsividade suficiente para tablets, mas sem foco em experiências mobile “on the go” neste estágio. Interações de alta frequência (navegação de listas, mudança de cliente, marcar checklist, iniciar/parar tempo) devem ser confortáveis com mouse, mas também com atalhos de teclado onde fizer sentido para operadores power users.

### Effortless Interactions

Algumas interações precisam ser praticamente sem esforço: o operador deve bater o olho no painel Hoje e entender imediatamente “qual cliente e qual tarefa fazer agora”; entrar e sair do modo foco deve ser rápido e previsível; marcar passos de checklist e registrar tempo não pode exigir mais do que poucos cliques ou atalhos diretos. Para o gestor, filtrar a carteira por risco ou margem e localizar clientes problemáticos precisa ser tão simples quanto aplicar 1–2 filtros intuitivos. Estados da integração F360 (atualizado, desatualizado, com erro) devem ser comunicados com rótulos e cores claras, evitando jargão técnico.

### Critical Success Moments

Momentos-chave que definem a experiência incluem: a primeira sessão de modo foco em que o operador percebe que não precisa mais alternar entre ERP, planilhas e WhatsApp para concluir o dia de um cliente; a primeira reunião de gestão em que a Home / Clientes expõe de forma óbvia quais contratos estão em risco ou rendendo abaixo da margem alvo; e situações em que a integração com o F360 falha ou está atrasada, mas o usuário entende rapidamente a causa e as ações possíveis, sem sensação de “sistema quebrado”. O onboarding desses fluxos — primeiras vezes — precisa ser guiado o suficiente para garantir sucesso logo nas primeiras sessões.

### Experience Principles

- **Foco guiado, um cliente por vez**: a UI ajuda o operador a manter contexto de um único cliente e suas tarefas até conclusão ou pausa explícita, reduzindo alternância desnecessária.
- **Estado sempre visível e interpretável**: tarefas, tempo, risco, saúde da integração e rentabilidade devem ter estados visuais e textos que qualquer usuário de negócio compreenda.
- **Fluxos opinados com próxima melhor ação**: em vez de apenas listar dados, as telas principais apontam o que o usuário deve fazer em seguida (próxima tarefa, próximo cliente em risco, próxima ação em caso de erro de integração).
- **Baixa fricção em ações repetitivas**: tudo o que é executado dezenas de vezes por dia (checklists, timesheet, navegação entre clientes e filtros) deve ser projetado para mínimo de passos e boa ergonomia de mouse/teclado.

## Desired Emotional Response

### Primary Emotional Goals

O BPO360 deve fazer operadores e gestores se sentirem **no controle, calmos e produtivos**, com a sensação de que “finalmente a operação está organizada em um lugar só”. Para o operador em modo foco, o objetivo é chegar em um **quase estado de fluxo**: ritmo estável de execução, baixa carga mental e satisfação de ir concluindo tarefas de um cliente por vez. Para o gestor, o produto deve transmitir **alerta e urgência controlada** — enxergar riscos com clareza, mas em um painel que passa confiança de que é possível agir sem pânico.

### Emotional Journey Mapping

- **Primeiro contato**: curiosidade e alívio inicial ao perceber que tarefas, clientes, integrações e indicadores não estão mais espalhados em planilhas e WhatsApp.
- **Durante o uso diário (operador)**: sensação crescente de foco e fluidez — o usuário entra em modo foco e sente que consegue “varrer o dia” de um cliente em um fluxo contínuo, sem se perder.
- **Durante o uso diário (gestor)**: percepção de cockpit organizado — ver rapidamente clientes em risco, margens apertadas e status de integrações, com a tranquilidade de que há caminhos claros de ação.
- **Ao concluir tarefas / fechar o dia**: sentimento de **accomplishment** (“entreguei o que precisava”) mais forte que cansaço ou frustração.
- **Quando algo dá errado (integração, erro de sistema)**: o sistema deve amortecer ansiedade, comunicando o problema com clareza, explicando impacto e próximo passo, sem gerar sensação de caos.
- **Retorno recorrente ao produto**: expectativa positiva de eficiência (“sei que aqui eu consigo tocar a operação”) em vez de peso ou resistência.

### Micro-Emotions

- **Confiança > Ceticismo**: confiança de que dados de tarefas, tempo e F360 são atuais e interpretáveis; o usuário não sente necessidade de “conferir tudo duas vezes” em outro lugar.
- **Calma focada > Ansiedade**: no modo foco e na visão de carteira, o layout e os estados visuais devem reduzir ruído e evitar sobrecarga, apoiando decisões sem pressa artificial.
- **Accomplishment > Frustração**: cada tarefa concluída, checklist fechado ou cliente “limpo” no dia reforça a sensação de progresso real, não de roda-viva.
- **Previsibilidade > Surpresa negativa**: o produto deve se comportar de forma consistente — mudanças de estado, filtros, navegação e feedback não pegam o usuário de surpresa.
- **Emoção a evitar (explícita)**: **ansiedade** — principalmente em dashboards muito carregados, mensagens de erro técnicas ou comportamentos inesperados.

### Design Implications

- Para suportar **estado de fluxo do operador**, o modo foco deve ter visual limpo, poucas distrações, atalhos claros (teclado/mouse) e feedback imediato em cada ação (concluir subitem, registrar tempo, avançar para próxima tarefa).
- Para entregar **alerta e urgência controlada ao gestor**, os dashboards devem priorizar poucos sinais fortes (clientes em risco, integrações problemáticas, margens baixas), com cores e hierarquias visuais que chamem atenção sem poluição.
- Para reduzir **ansiedade em erros e integrações**, mensagens devem explicar o que aconteceu, impacto nos dados e próximos passos em linguagem de negócio, com componentes visuais que indiquem severidade sem dramatização.
- Para reforçar **confiança**, estados de sincronização, datas de última atualização, filtros ativos e escopos (qual cliente, qual período, qual carteira) precisam estar sempre visíveis e inequívocos.
- Para promover **accomplishment**, microinterações (animações sutis, confirmações claras, mudanças de estado visuais) ao concluir tarefas ou “zerar” o dia de um cliente devem ser perceptíveis, mas não barulhentas.

### Emotional Design Principles

- **Nenhuma decisão no escuro**: sempre mostrar contexto suficiente (estado, escopo, impacto) para que o usuário não precise adivinhar o que está acontecendo.
- **Alertas que convidam à ação, não ao pânico**: todo estado de risco ou erro vem acompanhado de um caminho de ação claro e textual.
- **Fluxo acima de urgência artificial**: o produto prioriza ritmo constante e previsível de trabalho em vez de sons, pop-ups ou notificações que quebrem o foco.
- **Clareza visual contra ansiedade**: uso disciplinado de cor, tipografia e densidade de informação para evitar dashboards que “gritam” ou confundem.
- **Erros como parte do fluxo, não como colapso**: qualquer falha (integração, validação, exceção) é tratada com mensagens calmas, opções claras e possibilidade de recuperação.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

- **Linear (Gestão de Tarefas e Projetos)**  
  Linear mostra como uma interface **minimalista e ultra-rápida**, com forte suporte a **atalhos de teclado**, pode transformar gestão de tarefas em uma experiência quase de “linha de comando visual”. A navegação é previsível, o foco é sempre na lista atual e criar/concluir tarefas exige pouquíssimos passos, o que reduz drasticamente fricção para usuários de alto volume.

- **Pennylane (Sistema Financeiro e Contábil)**  
  A Pennylane consegue unificar **finanças e contabilidade em um único ambiente**, com navegação muito clara entre módulos e visão compartilhada entre escritório e cliente. O design é limpo, consistente e transmite confiança, tornando mais fácil entender onde estou, que contexto estou vendo (empresa, período, tipo de dado) e como colaborar em tempo quase real sem se perder.

- **Karbon (Gestão para Escritórios Contábeis)**  
  O Karbon se destaca pela visão de **“Triagem” (Triage)**, que organiza a comunicação caótica com clientes ao transformar e-mails e solicitações em **tarefas acionáveis** de forma fluida. A UX foca em tirar o usuário da caixa de e-mail e levá-lo para uma fila clara de trabalho, conectando mensagens a responsáveis, prazos e workflows.

### Transferable UX Patterns

- **Navigation Patterns**
  - **Layout tipo app de produtividade (Linear)**: barra lateral para áreas principais + conteúdo focado à direita, adequado para o shell `/app` do BPO360 (Home, Clientes, Hoje, Integrações, Timesheet, Admin).
  - **Contexto sempre explícito (Pennylane)**: destacar claramente qual cliente, período e tipo de visão está ativa, aplicado às telas de Cliente 360, Financeiro (F360) e Timesheet.
  - **Fila de trabalho triada (Karbon)**: visão estilo “inbox/triagem” para solicitações e painel Hoje, onde mensagens/inputs viram tarefas organizadas.

- **Interaction Patterns**
  - **Atalhos de teclado para power users (Linear)**: criar tarefa, mudar status, navegar entre clientes e entrar em modo foco com poucos atalhos consistentes.
  - **Transformar comunicação em trabalho (Karbon)**: ações rápidas em cima de solicitações (converter em tarefa, atribuir, definir prazo) diretamente na interface de triagem.
  - **Drill-down suave a partir de cards financeiros (Pennylane)**: clicar em cards/resumos de indicadores F360 levando para listas filtradas relacionadas, sem quebrar o contexto.

- **Visual Patterns**
  - **Minimalismo orientado a conteúdo (Linear)**: remover elementos decorativos e priorizar listas, estados e hierarquia tipográfica, algo crítico para o modo foco e o painel Hoje.
  - **Design contábil que transmite confiança (Pennylane)**: uso disciplinado de cor, espaços, tipografia e iconografia para reduzir ansiedade em telas financeiras e de integração.
  - **Status e prioridades claramente codificados (Karbon/Linear)**: uso consistente de cores/labels para prioridade, risco e status de tarefas/solicitações.

### Anti-Patterns to Avoid

- **Sobrecarregar dashboards com widgets demais**: telas iniciais que tentam mostrar “tudo ao mesmo tempo”, gerando ansiedade e fazendo o usuário ignorar a maioria dos blocos.
- **Comunicação e tarefas desconectadas**: permitir que solicitações fiquem isoladas da fila de trabalho, forçando o usuário a gerenciar e-mail/chat e tarefas em silos.
- **Navegação ambígua entre clientes e contextos**: mudar de empresa, período ou filtro sem deixar isso extremamente visível, causando erros operacionais em dados financeiros.
- **Atalhos obscuros sem suporte visual**: exigir uso pesado de teclado sem affordances (tooltips, menus de ajuda rápida), o que afasta usuários menos avançados.

### Design Inspiration Strategy

- **What to Adopt**
  - Do **Linear**, adotar a ideia de uma interface rápida, focada e previsível para listas de trabalho (Hoje, Modo Foco, Tarefas por cliente), com suporte consistente a atalhos.
  - Do **Pennylane**, adotar a clareza de navegação entre módulos e a forma como contexto financeiro/contábil é apresentado de forma legível e confiável.
  - Do **Karbon**, adotar uma visão clara de **triagem** que transforma comunicação com clientes em tarefas rastreáveis na operação.

- **What to Adapt**
  - Adaptar o minimalismo radical do Linear ao contexto de BPO financeiro, garantindo que, mesmo limpo, o layout ainda exiba estados críticos (riscos, integrações, prazos) de forma visível.
  - Adaptar o modelo de inbox/triagem do Karbon para contemplar não só e-mails, mas também solicitações, documentos e alertas de integração vindos do F360.

- **What to Avoid**
  - Evitar copiar complexidade visual de ERPs tradicionais que misturam muitos conceitos na mesma tela, indo contra os objetivos de calma e foco.
  - Evitar padrões que reforcem ansiedade (dashboards poluídos, mensagens de erro agressivas, mudanças de estado pouco previsíveis), mesmo que comuns em ferramentas financeiras.
  
## Design System Foundation

### 1.1 Design System Choice

O BPO360 terá um **Design System 100% custom**, criado especificamente para operação de BPO financeiro, inspirado em padrões modernos de produtividade (Linear), confiança financeira (Pennylane) e gestão de escritórios (Karbon), mas sem depender visualmente de nenhum sistema existente como Material ou Ant. A base serão tokens próprios de marca e um conjunto de componentes desenhados sob medida para painéis de carteira, modo foco, finanças F360 e triagem de comunicação.

### Rationale for Selection

- **Identidade forte e defensável**: como produto estratégico para operação interna e futura oferta SaaS, um design system próprio evita “cara de ERP genérico” e reforça o posicionamento premium do BPO360.
- **Ajuste fino ao domínio**: telas densas (clientes, tarefas, financeiro, timesheet) exigem decisões específicas de densidade, hierarquia e uso de cor que nem sempre se encaixam bem em sistemas genéricos.
- **Escalabilidade futura**: um DS custom permite crescer para novos módulos (mobile, white-label cliente final, múltiplos ERPs) mantendo consistência visual e de interação sem ficar preso a limitações de terceiros.
- **Liberdade para combinar referências**: podemos trazer o foco e velocidade do Linear, a linguagem de confiança da Pennylane e o modelo de triagem do Karbon sem “herdar” decisões de UI que não façam sentido aqui.

### Implementation Approach

- **Tokens de design proprietários**:
  - **Cores**: paleta primária do BPO360 (ex.: tons de azul/teal para confiança e ação), paleta de suporte (sucesso, aviso, erro, info) e escala de cinzas para estruturar dashboards sem ruído.
  - **Tipografia**: escolha de 1–2 famílias (sans-serif moderna) com mapa claro de hierarquias (Título de página, seção, cards, labels, números financeiros).
  - **Espaçamentos e grid**: sistema de espaçamento (4/8/12/16 px) e grid responsivo focado em desktop, garantindo consistência entre listas, tabelas, cards e formulários complexos.
  - **Raios, bordas e sombras**: definição de um “visual language” consistente (quão arredondado, quando usar sombra vs. borda, profundidade entre níveis de informação).
- **Biblioteca de componentes base**:
  - **Shell de app**: header fixo com contexto (cliente/período/usuário), side-nav com seções principais e área central modular.
  - **Listas/tabelas densas**: componentes otimizados para alto volume (Clientes, Tarefas, Timesheet, Logs), com estados (loading, vazio, erro, selecionado) padronizados.
  - **Cards de indicadores**: cards financeiros e de risco com hierarquia numérica clara e affordances de drill-down.
  - **Filtros e chips**: filtros persistentes e chips de estado/prioridade reutilizáveis em clientes, tarefas, integrações e relatórios.
  - **Form inputs e diálogos**: padrões únicos para campos, validações, modais e side panels (ex.: configuração F360, edição em massa).
  - **Feedback**: toasts, banners e mensagens inline definidas por severidade e alinhadas aos objetivos emocionais (sem pânico).
- **Documentação em Figma desde o início**:
  - Criação de um arquivo de **Design System BPO360** com páginas para tokens, componentes, padrões de layout e exemplos de telas (Home, Hoje, Modo Foco, Cliente 360, Integrações).

### Customization Strategy

- **Refinamento progressivo guiado pelos fluxos principais**:
  - Primeiro, desenhar em Figma componentes e tokens necessários para: Home gestor, Painel Hoje, Modo Foco, Cliente 360 e Integrações F360.
  - Em seguida, expandir o DS para módulos de comunicação (solicitações, documentos), timesheet e monitoramento.
- **Linguagem visual orientada a calma e foco**:
  - Uso de cor principalmente para estados e ações importantes; estruturas e fundos em neutros para evitar ansiedade em dashboards.
  - Destaque visual muito claro para “o que fazer agora” (próximas tarefas, clientes em risco, erros de integração) sem poluir o resto da interface.
- **Preparação para implementação tecnológica**:
  - Definir tokens em formato que possa ser traduzido facilmente para `design tokens` (JSON/YAML) consumidos por frontend.
  - Documentar variações de densidade (normal vs. compacta) para componentes críticos, pensando em operadores que passam o dia na ferramenta.

