-- Story 1.5: Configurar ERP principal por cliente
-- Tabela integracoes_erp com isolamento por bpo_id, RLS e suporte a múltiplos ERPs futuros.
-- Story 1.6: colunas de token F360 já incluídas (nullable) para consistência com o repositório.

CREATE TABLE public.integracoes_erp (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id               UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  cliente_id           UUID        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_erp             TEXT        NOT NULL,
  e_principal          BOOLEAN     NOT NULL DEFAULT true,
  ativo                BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Story 1.6: token F360 criptografado (AES-256-GCM) e metadados de configuração
  token_f360_encrypted TEXT        NULL,
  observacoes          TEXT        NULL,
  token_configurado_em TIMESTAMPTZ NULL,
  CONSTRAINT integracoes_erp_unique_per_cliente_tipo UNIQUE (cliente_id, tipo_erp),
  CONSTRAINT integracoes_erp_tipo_valido CHECK (tipo_erp IN ('F360'))
);

CREATE INDEX idx_integracoes_erp_cliente_id ON public.integracoes_erp(cliente_id);
CREATE INDEX idx_integracoes_erp_bpo_id ON public.integracoes_erp(bpo_id);

CREATE TRIGGER integracoes_erp_set_updated_at
  BEFORE UPDATE ON public.integracoes_erp
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integracoes_erp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integracoes_erp_select_same_bpo"
  ON public.integracoes_erp FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() <> 'cliente_final'
  );

CREATE POLICY "integracoes_erp_insert_gestores"
  ON public.integracoes_erp FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
  );

CREATE POLICY "integracoes_erp_update_gestores"
  ON public.integracoes_erp FOR UPDATE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
  )
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
  );
