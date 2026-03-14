-- Story 1.7: Corrige o default de ativo em integracoes_erp.
-- Contexto: migration 20260314000000 (story 1.5) criou DEFAULT true.
-- A integração só é marcada ativa=true pela story 4.1 (EP4) após teste bem-sucedido de conexão F360.
-- Resetar registros existentes (apenas dev; sem dados de produção neste ponto).

ALTER TABLE public.integracoes_erp
  ALTER COLUMN ativo SET DEFAULT false;

UPDATE public.integracoes_erp
SET ativo = false
WHERE ativo = true;
