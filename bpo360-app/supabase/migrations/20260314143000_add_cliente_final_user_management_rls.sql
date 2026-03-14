-- Story 8.3: gestão de usuários cliente_final por admin_bpo e gestor_bpo
-- Reconfigura políticas de usuarios para separar gestão de usuários internos e de clientes.

DROP POLICY IF EXISTS "usuarios_insert_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_same_bpo" ON public.usuarios;

CREATE POLICY "usuarios_select_same_bpo_admin"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'admin_bpo'
    AND bpo_id = public.get_my_bpo_id()
  );

CREATE POLICY "usuarios_select_cliente_final_same_bpo"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
    AND role = 'cliente_final'
    AND bpo_id = public.get_my_bpo_id()
  );

CREATE POLICY "usuarios_insert_admin_internal"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() = 'admin_bpo'
    AND role <> 'cliente_final'
    AND bpo_id = public.get_my_bpo_id()
  );

CREATE POLICY "usuarios_insert_cliente_final_same_bpo"
  ON public.usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
    AND role = 'cliente_final'
    AND bpo_id = public.get_my_bpo_id()
    AND cliente_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.clientes
      WHERE clientes.id = usuarios.cliente_id
        AND clientes.bpo_id = public.get_my_bpo_id()
    )
  );

CREATE POLICY "usuarios_update_admin_internal"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin_bpo'
    AND role <> 'cliente_final'
    AND bpo_id = public.get_my_bpo_id()
  )
  WITH CHECK (
    public.get_my_role() = 'admin_bpo'
    AND role <> 'cliente_final'
    AND bpo_id = public.get_my_bpo_id()
  );

CREATE POLICY "usuarios_update_cliente_final_same_bpo"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
    AND role = 'cliente_final'
    AND bpo_id = public.get_my_bpo_id()
  )
  WITH CHECK (
    public.get_my_role() IN ('admin_bpo', 'gestor_bpo')
    AND role = 'cliente_final'
    AND bpo_id = public.get_my_bpo_id()
    AND cliente_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.clientes
      WHERE clientes.id = usuarios.cliente_id
        AND clientes.bpo_id = public.get_my_bpo_id()
    )
  );
