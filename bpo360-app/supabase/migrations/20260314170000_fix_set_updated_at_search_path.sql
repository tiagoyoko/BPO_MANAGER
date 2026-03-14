-- Corrige lint de segurança: function_search_path_mutable
-- Garante search_path fixo na função utilitária usada pelos triggers de updated_at.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
