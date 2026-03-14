-- Story 1.2: Cadastrar cliente de BPO
-- Tabela clientes com isolamento por bpo_id (multi-tenant), RLS e validação de CNPJ único por tenant.

CREATE TABLE public.clientes (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id                UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  cnpj                  TEXT        NOT NULL,
  razao_social          TEXT        NOT NULL,
  nome_fantasia         TEXT        NOT NULL,
  email                 TEXT        NOT NULL,
  telefone              TEXT,
  responsavel_interno_id UUID       REFERENCES public.usuarios(id) ON DELETE SET NULL,
  receita_estimada      NUMERIC(15, 2),
  status                TEXT        NOT NULL DEFAULT 'Ativo',
  tags                  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- CNPJ único por tenant (bpo_id)
  CONSTRAINT clientes_cnpj_unique_per_bpo UNIQUE (bpo_id, cnpj),
  -- Status restrito a valores conhecidos (extensível via migration futura)
  CONSTRAINT clientes_status_valido CHECK (
    status IN ('Ativo', 'Em implantação', 'Pausado', 'Encerrado')
  )
);

-- Índice em bpo_id para listagens e RLS
CREATE INDEX idx_clientes_bpo_id ON public.clientes(bpo_id);

-- Trigger para atualizar updated_at automaticamente em UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clientes_set_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer usuário do mesmo BPO pode listar clientes
CREATE POLICY "clientes_select_same_bpo"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND (
      public.get_my_role() <> 'cliente_final'
      OR id = public.get_my_cliente_id()
    )
  );

-- INSERT: usuários do mesmo BPO podem cadastrar clientes
CREATE POLICY "clientes_insert_same_bpo"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() <> 'cliente_final'
  );

-- UPDATE: usuários do mesmo BPO podem editar clientes
CREATE POLICY "clientes_update_same_bpo"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() <> 'cliente_final'
  )
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() <> 'cliente_final'
  );
