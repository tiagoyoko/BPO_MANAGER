-- Story 2.2: Aplicar modelo de rotina a um cliente
-- Tabelas: rotinas_cliente, tarefas, tarefa_checklist_itens; RLS por bpo_id (admin_bpo, gestor_bpo, operador_bpo).

-- rotinas_cliente: configuração "este cliente usa este modelo a partir desta data"
CREATE TABLE public.rotinas_cliente (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id                 UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  cliente_id             UUID        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  rotina_modelo_id       UUID        NOT NULL REFERENCES public.rotinas_modelo(id) ON DELETE CASCADE,
  data_inicio            DATE        NOT NULL,
  frequencia             TEXT        NOT NULL,
  responsavel_padrao_id  UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  prioridade             TEXT        NOT NULL DEFAULT 'media',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rotinas_cliente_frequencia_valida CHECK (
    frequencia IN ('diaria', 'semanal', 'mensal', 'custom')
  ),
  CONSTRAINT rotinas_cliente_prioridade_valida CHECK (
    prioridade IN ('baixa', 'media', 'alta', 'urgente')
  )
);

CREATE INDEX idx_rotinas_cliente_bpo_id ON public.rotinas_cliente(bpo_id);
CREATE INDEX idx_rotinas_cliente_cliente_id ON public.rotinas_cliente(cliente_id);
CREATE INDEX idx_rotinas_cliente_rotina_modelo_id ON public.rotinas_cliente(rotina_modelo_id);

CREATE TRIGGER rotinas_cliente_set_updated_at
  BEFORE UPDATE ON public.rotinas_cliente
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rotinas_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rotinas_cliente_select_same_bpo"
  ON public.rotinas_cliente FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "rotinas_cliente_insert_same_bpo"
  ON public.rotinas_cliente FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "rotinas_cliente_update_same_bpo"
  ON public.rotinas_cliente FOR UPDATE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  )
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "rotinas_cliente_delete_same_bpo"
  ON public.rotinas_cliente FOR DELETE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

-- tarefas: ocorrências concretas (uma por dia/semana/mês)
CREATE TABLE public.tarefas (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id             UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  cliente_id         UUID        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  rotina_cliente_id  UUID        REFERENCES public.rotinas_cliente(id) ON DELETE SET NULL,
  titulo             TEXT        NOT NULL,
  data_vencimento    DATE        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'a_fazer',
  prioridade         TEXT        NOT NULL DEFAULT 'media',
  responsavel_id     UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tarefas_status_valido CHECK (
    status IN ('a_fazer', 'em_andamento', 'concluida', 'atrasada', 'bloqueada')
  ),
  CONSTRAINT tarefas_prioridade_valida CHECK (
    prioridade IN ('baixa', 'media', 'alta', 'urgente')
  )
);

CREATE INDEX idx_tarefas_bpo_id ON public.tarefas(bpo_id);
CREATE INDEX idx_tarefas_cliente_id ON public.tarefas(cliente_id);
CREATE INDEX idx_tarefas_rotina_cliente_id ON public.tarefas(rotina_cliente_id);
CREATE INDEX idx_tarefas_data_vencimento ON public.tarefas(data_vencimento);

CREATE TRIGGER tarefas_set_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefas_select_same_bpo"
  ON public.tarefas FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND (
      public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
      OR (public.get_my_role() = 'cliente_final' AND cliente_id = public.get_my_cliente_id())
    )
  );

CREATE POLICY "tarefas_insert_same_bpo"
  ON public.tarefas FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "tarefas_update_same_bpo"
  ON public.tarefas FOR UPDATE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND (
      public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
      OR (public.get_my_role() = 'cliente_final' AND cliente_id = public.get_my_cliente_id())
    )
  )
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
  );

CREATE POLICY "tarefas_delete_same_bpo"
  ON public.tarefas FOR DELETE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

-- tarefa_checklist_itens: cópia dos itens do modelo no momento da geração
CREATE TABLE public.tarefa_checklist_itens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id       UUID        NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  titulo          TEXT        NOT NULL,
  descricao       TEXT,
  obrigatorio     BOOLEAN     NOT NULL DEFAULT true,
  ordem           INT         NOT NULL,
  concluido       BOOLEAN     NOT NULL DEFAULT false,
  concluido_por_id UUID       REFERENCES public.usuarios(id) ON DELETE SET NULL,
  concluido_em   TIMESTAMPTZ,
  CONSTRAINT tarefa_checklist_itens_ordem_non_neg CHECK (ordem >= 0)
);

CREATE INDEX idx_tarefa_checklist_itens_tarefa_id ON public.tarefa_checklist_itens(tarefa_id);

ALTER TABLE public.tarefa_checklist_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefa_checklist_itens_select_via_tarefa"
  ON public.tarefa_checklist_itens FOR SELECT
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

CREATE POLICY "tarefa_checklist_itens_insert_via_tarefa"
  ON public.tarefa_checklist_itens FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.tarefas t
      WHERE t.id = tarefa_id AND t.bpo_id = public.get_my_bpo_id()
    )
  );

CREATE POLICY "tarefa_checklist_itens_update_via_tarefa"
  ON public.tarefa_checklist_itens FOR UPDATE
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
  )
  WITH CHECK (true);

CREATE POLICY "tarefa_checklist_itens_delete_via_tarefa"
  ON public.tarefa_checklist_itens FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND EXISTS (
      SELECT 1 FROM public.tarefas t
      WHERE t.id = tarefa_id AND t.bpo_id = public.get_my_bpo_id()
    )
  );
