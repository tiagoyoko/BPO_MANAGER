# 8. Requisitos não funcionais

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
