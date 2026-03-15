-- Story 3.2: Tabela documentos (metadados de anexos) e bucket anexos-solicitacoes.
-- Suporta anexos de solicitações (e futuramente tarefas em 3.4).

CREATE TABLE public.documentos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bpo_id          UUID        NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  cliente_id      UUID        NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  solicitacao_id  UUID        REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  tarefa_id       UUID        REFERENCES public.tarefas(id) ON DELETE SET NULL,
  storage_key     TEXT        NOT NULL,
  nome_arquivo    TEXT        NOT NULL,
  tipo_mime       TEXT        NOT NULL,
  tamanho         BIGINT      NOT NULL,
  criado_por_id   UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documentos_solicitacao_id ON public.documentos(solicitacao_id);
CREATE INDEX idx_documentos_bpo_cliente ON public.documentos(bpo_id, cliente_id);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- SELECT: BPO vê todos do bpo; cliente_final só do próprio cliente
CREATE POLICY "documentos_select_bpo"
  ON public.documentos FOR SELECT TO authenticated
  USING (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "documentos_select_cliente_final"
  ON public.documentos FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'cliente_final'
    AND cliente_id = public.get_my_cliente_id()
  );

-- INSERT: BPO ou cliente_final (cliente só próprio cliente)
CREATE POLICY "documentos_insert_bpo"
  ON public.documentos FOR INSERT TO authenticated
  WITH CHECK (
    bpo_id = public.get_my_bpo_id()
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
  );

CREATE POLICY "documentos_insert_cliente_final"
  ON public.documentos FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_role() = 'cliente_final'
    AND cliente_id = public.get_my_cliente_id()
  );

-- Bucket privado para anexos (acesso via URLs assinadas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos-solicitacoes', 'anexos-solicitacoes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path = bpo_id/cliente_id/solicitacao_id/uuid_nome (name = full path)
CREATE POLICY "anexos_solicitacoes_select_bpo"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'anexos-solicitacoes'
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND (string_to_array(name, '/'))[1] = public.get_my_bpo_id()::text
  );

CREATE POLICY "anexos_solicitacoes_select_cliente_final"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'anexos-solicitacoes'
    AND public.get_my_role() = 'cliente_final'
    AND (string_to_array(name, '/'))[2] = public.get_my_cliente_id()::text
  );

CREATE POLICY "anexos_solicitacoes_insert_bpo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'anexos-solicitacoes'
    AND public.get_my_role() IN ('admin_bpo', 'gestor_bpo', 'operador_bpo')
    AND (string_to_array(name, '/'))[1] = public.get_my_bpo_id()::text
  );

CREATE POLICY "anexos_solicitacoes_insert_cliente_final"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'anexos-solicitacoes'
    AND public.get_my_role() = 'cliente_final'
    AND (string_to_array(name, '/'))[2] = public.get_my_cliente_id()::text
  );
