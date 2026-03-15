-- Story 3.1: validação da migração solicitacoes (tabela + RLS)
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, auth, extensions;

select plan(7);

select has_table('public', 'solicitacoes', 'existe tabela public.solicitacoes');
select has_column('public', 'solicitacoes', 'bpo_id', 'solicitacoes tem bpo_id');
select has_column('public', 'solicitacoes', 'cliente_id', 'solicitacoes tem cliente_id');
select has_column('public', 'solicitacoes', 'status', 'solicitacoes tem status');
select has_column('public', 'solicitacoes', 'origem', 'solicitacoes tem origem');
select has_column('public', 'solicitacoes', 'criado_por_id', 'solicitacoes tem criado_por_id');

select is(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'solicitacoes'),
  3::bigint,
  'solicitacoes tem 3 policies (select, insert, update)'
);

select * from finish();
rollback;
