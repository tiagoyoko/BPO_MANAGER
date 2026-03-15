-- Story 3.1: Abrir solicitação para um cliente
-- Tabela solicitacoes com bpo_id, cliente_id, tipo, prioridade, tarefa_id opcional; RLS por bpo_id (admin_bpo, gestor_bpo, operador_bpo).

CREATE TABLE public.solicitacoes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id          UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  cliente_id      UUID        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo          TEXT        NOT NULL,
  descricao       TEXT,
  tipo            TEXT        NOT NULL DEFAULT 'outro',
  prioridade      TEXT        NOT NULL DEFAULT 'media',
  tarefa_id       UUID        REFERENCES public.tarefas(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'aberta',
  origem          TEXT        NOT NULL DEFAULT 'interno',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por_id   UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  CONSTRAINT solicitacoes_tipo_valido CHECK (
    tipo IN ('documento_faltando', 'duvida', 'ajuste', 'outro')
  ),
  CONSTRAINT solicitacoes_prioridade_valida CHECK (
    prioridade IN ('baixa', 'media', 'alta', 'urgente')
  ),
  CONSTRAINT solicitacoes_status_valido CHECK (
    status IN ('aberta', 'em_andamento', 'resolvida', 'fechada')
  ),
  CONSTRAINT solicitacoes_origem_valida CHECK (
    origem IN ('interno', 'cliente')
  )
);

CREATE INDEX idx_solicitacoes_bpo_id ON public.solicitacoes(bpo_id);
CREATE INDEX idx_solicitacoes_cliente_id ON public.solicitacoes(cliente_id);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX idx_solicitacoes_created_at ON public.solicitacoes(created_at);

CREATE TRIGGER solicitacoes_set_updated_at
  BEFORE UPDATE ON public.solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- SELECT: usuários BPO do mesmo tenant
CREATE POLICY "solicitacoes_select_same_bpo"
  ON public.solicitacoes FOR SELECT
  TO authenticated
  USING (
    (
      bpo_id = public.get_my_bpo_id()
      AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    )
    OR (
      public.get_my_role() = 'cliente_final'
      AND origem = 'cliente'
      AND cliente_id = public.get_my_cliente_id()
    )
  );

-- INSERT: usuários BPO do mesmo tenant
CREATE POLICY "solicitacoes_insert_same_bpo"
  ON public.solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

-- UPDATE: usuários BPO do mesmo tenant
CREATE POLICY "solicitacoes_update_same_bpo"
  ON public.solicitacoes FOR UPDATE
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  )
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );
