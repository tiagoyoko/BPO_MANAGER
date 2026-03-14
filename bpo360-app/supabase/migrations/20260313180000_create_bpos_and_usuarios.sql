-- Story 8.1: Autenticação e papéis (Supabase Auth + RLS)
-- Tabelas: bpos (tenant), usuarios (perfil); enum papel_bpo; RLS; funções auxiliares.

-- Enum de papéis
CREATE TYPE public.papel_bpo AS ENUM (
  'admin_bpo',
  'gestor_bpo',
  'operador_bpo',
  'cliente_final'
);

-- Tabela de tenants (um BPO por linha)
CREATE TABLE public.bpos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bpos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bpos_select_authenticated"
  ON public.bpos FOR SELECT
  TO authenticated
  USING (true);

-- Tabela de perfis (uma linha por usuário Auth; id = auth.users.id)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bpo_id UUID NOT NULL REFERENCES public.bpos(id) ON DELETE CASCADE,
  role public.papel_bpo NOT NULL,
  cliente_id UUID NULL,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cliente_final_deve_ter_cliente_id
    CHECK (
      (role <> 'cliente_final') OR
      (role = 'cliente_final' AND cliente_id IS NOT NULL)
    )
);

CREATE INDEX idx_usuarios_bpo_id ON public.usuarios(bpo_id);
CREATE INDEX idx_usuarios_email ON public.usuarios(email);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_own"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Funções auxiliares para RLS (e para o app) – SECURITY DEFINER, search_path = public
CREATE OR REPLACE FUNCTION public.get_my_bpo_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bpo_id FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.papel_bpo
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_cliente_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cliente_id FROM public.usuarios WHERE id = auth.uid();
$$;
