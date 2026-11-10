-- Reparo + diagnóstico de RLS em execução única
-- Rodar NO PROJETO: https://xeglpwjgyyzzfqurdauf.supabase.co
-- Confira o URL no navegador (Dashboard -> SQL Editor) ANTES de executar.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
on public.responsaveis, public.solicitacoes, public.psicanalistas,
   public.disponibilidades, public.indicacoes
to anon, authenticated;

alter table public.responsaveis enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.psicanalistas enable row level security;
alter table public.disponibilidades enable row level security;
alter table public.indicacoes enable row level security;

drop policy if exists "responsaveis_insert_anon" on public.responsaveis;
create policy "responsaveis_insert_anon"
on public.responsaveis
for insert
to anon, authenticated
with check (true);

drop policy if exists "solicitacoes_insert_anon" on public.solicitacoes;
create policy "solicitacoes_insert_anon"
on public.solicitacoes
for insert
to anon, authenticated
with check (true);

-- ============ DIAGNÓSTICO (colar a saída deste bloco abaixo) ============

select 'RLS por tabela' as secao;
select relname as tabela, relrowsecurity as rls_ativado
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('responsaveis','solicitacoes','psicanalistas','disponibilidades','indicacoes')
order by relname;

select 'Policies de responsaveis/solicitacoes' as secao;
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('responsaveis','solicitacoes')
order by tablename, cmd;