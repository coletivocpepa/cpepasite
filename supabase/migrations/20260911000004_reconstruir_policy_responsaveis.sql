-- Reconstrói a policy de insert do responsaveis e inspeciona a definição real
drop policy if exists "responsaveis_insert_anon" on public.responsaveis;
create policy "responsaveis_insert_anon"
on public.responsaveis
for insert
to anon, authenticated
with check (true);

-- Definição REAL das policies da tabela responsaveis (inclui qual/with_check/permissive)
select policyname, permissive, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'responsaveis'
order by cmd, policyname;

-- Confere se não existe uma segunda tabela 'responsaveis' em outro schema
select schemaname, tablename
from pg_tables
where tablename in ('responsaveis', 'solicitacoes', 'psicanalistas')
order by tablename, schemaname;

-- Confere o RLS e o owner da tabela
select relname, relrowsecurity, relrowsecurityforced, pg_get_userbyid(relowner) as owner
from pg_class
where relnamespace = 'public'::regnamespace and relname = 'responsaveis';