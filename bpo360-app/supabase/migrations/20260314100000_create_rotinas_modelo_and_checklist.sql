-- Story 2.1: Modelo de rotina padrão
-- Tabelas rotinas_modelo e rotina_modelo_checklist_itens; RLS por bpo_id (admin_bpo, gestor_bpo, operador_bpo).

CREATE TABLE public.rotinas_modelo (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id         UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  nome           TEXT        NOT NULL,
  descricao      TEXT,
  periodicidade  TEXT        NOT NULL,
  tipo_servico   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT rotinas_modelo_periodicidade_valida CHECK (
    periodicidade IN ('diaria', 'semanal', 'mensal', 'custom')
  )
);

CREATE INDEX idx_rotinas_modelo_bpo_id ON public.rotinas_modelo(bpo_id);

CREATE TRIGGER rotinas_modelo_set_updated_at
  BEFORE UPDATE ON public.rotinas_modelo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS rotinas_modelo
ALTER TABLE public.rotinas_modelo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rotinas_modelo_select_same_bpo"
  ON public.rotinas_modelo FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "rotinas_modelo_insert_same_bpo"
  ON public.rotinas_modelo FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "rotinas_modelo_update_same_bpo"
  ON public.rotinas_modelo FOR UPDATE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  )
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "rotinas_modelo_delete_same_bpo"
  ON public.rotinas_modelo FOR DELETE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

-- Tabela itens do checklist do modelo
CREATE TABLE public.rotina_modelo_checklist_itens (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  rotina_modelo_id  UUID    NOT NULL REFERENCES public.rotinas_modelo(id) ON DELETE CASCADE,
  titulo            TEXT    NOT NULL,
  descricao         TEXT,
  obrigatorio       BOOLEAN NOT NULL DEFAULT true,
  ordem             INT     NOT NULL,
  CONSTRAINT rotina_modelo_checklist_itens_ordem_non_neg CHECK (ordem >= 0)
);

CREATE INDEX idx_rotina_modelo_checklist_itens_rotina_modelo_id
  ON public.rotina_modelo_checklist_itens(rotina_modelo_id);

-- RLS itens: acesso via modelo do mesmo bpo_id
ALTER TABLE public.rotina_modelo_checklist_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rotina_modelo_checklist_itens_select_via_modelo"
  ON public.rotina_modelo_checklist_itens FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.rotinas_modelo m
      WHERE m.id = rotina_modelo_id AND m.bpo_id = public.get_my_bpo_id()
    )
  );

CREATE POLICY "rotina_modelo_checklist_itens_insert_via_modelo"
  ON public.rotina_modelo_checklist_itens FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.rotinas_modelo m
      WHERE m.id = rotina_modelo_id AND m.bpo_id = public.get_my_bpo_id()
    )
  );

CREATE POLICY "rotina_modelo_checklist_itens_update_via_modelo"
  ON public.rotina_modelo_checklist_itens FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.rotinas_modelo m
      WHERE m.id = rotina_modelo_id AND m.bpo_id = public.get_my_bpo_id()
    )
  )
  WITH CHECK (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.rotinas_modelo m
      WHERE m.id = rotina_modelo_id AND m.bpo_id = public.get_my_bpo_id()
    )
  );

CREATE POLICY "rotina_modelo_checklist_itens_delete_via_modelo"
  ON public.rotina_modelo_checklist_itens FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.rotinas_modelo m
      WHERE m.id = rotina_modelo_id AND m.bpo_id = public.get_my_bpo_id()
    )
  );
