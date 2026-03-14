-- Story 2.5: Histórico de alteração de tarefas (responsavel_id, etc.)
CREATE TABLE public.tarefa_historico (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id       UUID        NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  campo           TEXT        NOT NULL,
  valor_anterior  TEXT,
  valor_novo      TEXT,
  usuario_id      UUID        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tarefa_historico_tarefa_id ON public.tarefa_historico(tarefa_id);
CREATE INDEX idx_tarefa_historico_created_at ON public.tarefa_historico(created_at);

ALTER TABLE public.tarefa_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefa_historico_select_via_tarefa"
  ON public.tarefa_historico FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tarefas t
      WHERE t.id = tarefa_id AND t.bpo_id = public.get_my_bpo_id()
      AND (
        public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
        OR (public.get_my_role() = 'cliente_final' AND t.cliente_id = public.get_my_cliente_id())
      )
    )
  );

CREATE POLICY "tarefa_historico_insert_via_tarefa"
  ON public.tarefa_historico FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.tarefas t
      WHERE t.id = tarefa_id AND t.bpo_id = public.get_my_bpo_id()
    )
  );
