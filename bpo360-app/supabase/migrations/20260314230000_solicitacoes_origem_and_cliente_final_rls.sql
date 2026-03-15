-- Story 3.2: origem na solicitacao (auditoria) e RLS para cliente_final (portal).
-- cliente_final: SELECT/INSERT apenas onde cliente_id = get_my_cliente_id().

ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'interno'
  CONSTRAINT solicitacoes_origem_valido CHECK (origem IN ('interno', 'cliente'));

-- SELECT: cliente_final só vê solicitações do próprio cliente
CREATE POLICY "solicitacoes_select_cliente_final_own"
  ON public.solicitacoes FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'cliente_final'
    AND cliente_id = public.get_my_cliente_id()
  );

-- INSERT: cliente_final só insere para o próprio cliente (origem 'cliente' via app)
CREATE POLICY "solicitacoes_insert_cliente_final_own"
  ON public.solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'cliente_final'
    AND cliente_id = public.get_my_cliente_id()
  );
