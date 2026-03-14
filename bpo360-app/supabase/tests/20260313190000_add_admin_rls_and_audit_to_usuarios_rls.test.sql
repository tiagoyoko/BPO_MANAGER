begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, auth, extensions;

select plan(9);

select has_column(
  'public',
  'usuarios',
  'criado_por_id',
  'usuarios ganha coluna criado_por_id'
);

select has_column(
  'public',
  'usuarios',
  'atualizado_por_id',
  'usuarios ganha coluna atualizado_por_id'
);

select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'usuarios'
      and policyname = 'usuarios_select_own'
  ),
  1::bigint,
  'migração preserva a policy usuarios_select_own'
);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin-a-rls-test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'operador-a-rls-test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'admin-b-rls-test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'novo-a-rls-test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'authenticated',
    'authenticated',
    'novo-b-rls-test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  );

insert into public.bpos (id, nome)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BPO A - RLS Test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BPO B - RLS Test');

insert into public.usuarios (id, bpo_id, role, nome, email)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin_bpo',
    'Admin A',
    'admin-a-rls-test@example.com'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'operador_bpo',
    'Operador A',
    'operador-a-rls-test@example.com'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'admin_bpo',
    'Admin B',
    'admin-b-rls-test@example.com'
  );

create or replace function public.test_insert_usuario_other_bpo_denied()
returns boolean
language plpgsql
as $$
begin
  insert into public.usuarios (id, bpo_id, role, nome, email)
  values (
    '55555555-5555-5555-5555-555555555555',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'operador_bpo',
    'Novo B',
    'novo-b-rls-test@example.com'
  );

  return false;
exception
  when insufficient_privilege then
    return true;
end;
$$;

set local role authenticated;

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
  (select count(*) from public.usuarios),
  2::bigint,
  'admin do BPO A enxerga todos os usuarios do proprio BPO'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.usuarios),
  1::bigint,
  'operador sem policy administrativa enxerga apenas o proprio registro'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
  (
    with inserted as (
      insert into public.usuarios (id, bpo_id, role, nome, email)
      values (
        '44444444-4444-4444-4444-444444444444',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'operador_bpo',
        'Novo A',
        'novo-a-rls-test@example.com'
      )
      returning id
    )
    select count(*) from inserted
  ),
  1::bigint,
  'admin do BPO A consegue inserir usuario no proprio BPO'
);

select ok(
  public.test_insert_usuario_other_bpo_denied(),
  'admin do BPO A nao consegue inserir usuario em outro BPO'
);

select is(
  (
    with updated as (
      update public.usuarios
      set nome = 'Operador A Atualizado'
      where id = '22222222-2222-2222-2222-222222222222'
      returning id
    )
    select count(*) from updated
  ),
  1::bigint,
  'admin do BPO A consegue atualizar usuario do proprio BPO'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(
  (
    with updated as (
      update public.usuarios
      set nome = 'Tentativa Indevida'
      where id = '22222222-2222-2222-2222-222222222222'
      returning id
    )
    select count(*) from updated
  ),
  0::bigint,
  'admin de outro BPO nao consegue atualizar usuario fora do proprio tenant'
);

select * from finish();
rollback;
