-- Story 1.6: Adicionar configuração F360 à tabela integracoes_erp
-- A tabela foi criada na story 1.5 (20260314000000_create_integracoes_erp_table.sql)

ALTER TABLE public.integracoes_erp
  ADD COLUMN token_f360_encrypted   TEXT        NULL,
  ADD COLUMN observacoes            TEXT        NULL,
  ADD COLUMN token_configurado_em   TIMESTAMPTZ NULL;

-- NOTA (EP4): Em produção, considerar mover token_f360_encrypted para tabela dedicada
-- (similar ao cofre de segredos - story 8.4) com chave de criptografia por tenant.
-- Para MVP da story 1.6, a coluna inline é suficiente e mantém a complexidade baixa.
