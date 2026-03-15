-- Story 3.3: Tabela comentarios para timeline de comunicação por cliente
-- Abordagem de status history: Opção B (mínima viável)
-- Eventos de timeline: solicitacao_criada (de solicitacoes.created_at) e comentario.
-- Mudança de status NÃO é evento separado; mostrar status atual no card da solicitação.
-- Documento_anexado: será adicionado na Story 3.4 (anexar documentos).

CREATE TABLE public.comentarios (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id          UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  solicitacao_id  UUID        NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  autor_id        UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  texto           TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comentarios_solicitacao_id ON public.comentarios(solicitacao_id);
CREATE INDEX idx_comentarios_bpo_id ON public.comentarios(bpo_id);
CREATE INDEX idx_comentarios_created_at ON public.comentarios(created_at);

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- SELECT: usuários BPO do mesmo tenant (internos apenas)
CREATE POLICY "comentarios_select_same_bpo"
  ON public.comentarios FOR SELECT
  TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

-- INSERT: usuários BPO do mesmo tenant (internos apenas)
CREATE POLICY "comentarios_insert_same_bpo"
  ON public.comentarios FOR INSERT
  TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND autor_id = auth.uid()
  );

-- UPDATE/DELETE: Intencionalmente omitidos — comentários são imutáveis nesta versão.
-- Adicionar políticas de UPDATE/DELETE apenas se requisito de edição/exclusão for implementado.
