-- Story 8.2: RLS para admin_bpo e campos de auditoria em usuarios
-- Adiciona criado_por_id, atualizado_por_id e políticas para admin_bpo (SELECT/INSERT/UPDATE no mesmo BPO).

-- Colunas de auditoria
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS criado_por_id UUID NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS atualizado_por_id UUID NULL REFERENCES auth.users(id);

-- Admin_bpo vê todos os usuários do mesmo BPO (inclui os próprios)
CREATE POLICY "usuarios_select_same_bpo"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  );

-- Admin_bpo insere usuários no mesmo BPO
CREATE POLICY "usuarios_insert_admin"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  );

-- Admin_bpo atualiza usuários do mesmo BPO
CREATE POLICY "usuarios_update_admin"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  )
  WITH CHECK (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  );
