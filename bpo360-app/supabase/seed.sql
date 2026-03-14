-- Story 8.1: Seed para ambiente local.
-- 1) Criar um usuário no Supabase Dashboard (Authentication → Add user) e copiar o User UID.
-- 2) Substituir <UID_DO_AUTH> abaixo pelo UID e rodar este script (ou executar os INSERTs no SQL Editor).
-- Ver também: README.md seção "BPO360 – Primeiro BPO e usuário admin".

INSERT INTO public.bpos (id, nome) VALUES
  ('00000000-0000-0000-0000-000000000001', 'BPO Demo')
ON CONFLICT (id) DO NOTHING;

-- Descomente e substitua <UID_DO_AUTH> pelo UID do usuário criado no Auth:
-- INSERT INTO public.usuarios (id, bpo_id, role, nome, email) VALUES
--   ('<UID_DO_AUTH>', '00000000-0000-0000-0000-000000000001', 'admin_bpo', 'Admin Demo', 'admin@demo.bpo360.local')
-- ON CONFLICT (id) DO NOTHING;
