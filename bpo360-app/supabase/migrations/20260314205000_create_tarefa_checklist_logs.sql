-- Story 2.4: histórico de marcação/desmarcação do checklist da tarefa.

CREATE TABLE public.tarefa_checklist_logs (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id                  UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  tarefa_id               UUID        NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  tarefa_checklist_item_id UUID       NOT NULL REFERENCES public.tarefa_checklist_itens(id) ON DELETE CASCADE,
  acao                    TEXT        NOT NULL,
  usuario_id              UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ocorrido_em             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tarefa_checklist_logs_acao_valida CHECK (acao IN ('marcar', 'desmarcar'))
);

CREATE INDEX idx_tarefa_checklist_logs_tarefa_id ON public.tarefa_checklist_logs(tarefa_id);
CREATE INDEX idx_tarefa_checklist_logs_item_id ON public.tarefa_checklist_logs(tarefa_checklist_item_id);
CREATE INDEX idx_tarefa_checklist_logs_bpo_id ON public.tarefa_checklist_logs(bpo_id);

ALTER TABLE public.tarefa_checklist_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefa_checklist_logs_select_same_bpo"
  ON public.tarefa_checklist_logs FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "tarefa_checklist_logs_insert_same_bpo"
  ON public.tarefa_checklist_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );
