# 7. Modelo de dados (alto nível)

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
