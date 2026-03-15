-- Story 3.5: Preferências de notificação por cliente
-- cliente_id, notificar_por_email (boolean, default true).
-- RLS: BPO (admin_bpo, gestor_bpo, operador_bpo) e cliente_final (apenas próprio cliente_id).

CREATE TABLE public.cliente_preferencias (
  cliente_id          UUID    PRIMARY KEY REFERENCES public.clientes(id) ON DELETE CASCADE,
  notificar_por_email BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cliente_preferencias_cliente_id ON public.cliente_preferencias(cliente_id);

CREATE TRIGGER cliente_preferencias_set_updated_at
  BEFORE UPDATE ON public.cliente_preferencias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.cliente_preferencias ENABLE ROW LEVEL SECURITY;

-- SELECT: BPO do mesmo tenant ou cliente_final apenas do próprio cliente
CREATE POLICY "cliente_preferencias_select"
  ON public.cliente_preferencias FOR SELECT
  TO authenticated
  USING (
    (
      public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
      AND cliente_id IN (
        SELECT id FROM public.clientes WHERE bpo_id = public.get_my_bpo_id()
      )
    )
    OR (
      public.get_my_role() = 'cliente_final'
      AND cliente_id = public.get_my_cliente_id()
    )
  );

-- INSERT: BPO do mesmo tenant ou cliente_final no próprio cliente_id (upsert no portal)
CREATE POLICY "cliente_preferencias_insert"
  ON public.cliente_preferencias FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
      AND cliente_id IN (
        SELECT id FROM public.clientes WHERE bpo_id = public.get_my_bpo_id()
      )
    )
    OR (
      public.get_my_role() = 'cliente_final'
      AND cliente_id = public.get_my_cliente_id()
    )
  );

-- UPDATE: BPO do mesmo tenant ou cliente_final apenas do próprio cliente
CREATE POLICY "cliente_preferencias_update"
  ON public.cliente_preferencias FOR UPDATE
  TO authenticated
  USING (
    (
      public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
      AND cliente_id IN (
        SELECT id FROM public.clientes WHERE bpo_id = public.get_my_bpo_id()
      )
    )
    OR (
      public.get_my_role() = 'cliente_final'
      AND cliente_id = public.get_my_cliente_id()
    )
  )
  WITH CHECK (
    (
      public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
      AND cliente_id IN (
        SELECT id FROM public.clientes WHERE bpo_id = public.get_my_bpo_id()
      )
    )
    OR (
      public.get_my_role() = 'cliente_final'
      AND cliente_id = public.get_my_cliente_id()
    )
  );
