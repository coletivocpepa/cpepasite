-- Analytics: reescreve as RPCs de leitura como `language sql`
--
-- A migration anterior (20261022000002) reescreveu as funções em PL/pgSQL com
-- `return query`. Em PL/pgSQL os parâmetros de saída (path, total, unicos,
-- dia...) têm o mesmo nome das colunas consultadas, o que deixa a consulta
-- sujeita a conflito de nomes ("column reference is ambiguous") em tempo de
-- execução. Aqui as funções voltam a ser SQL puro (mesma estrutura da versão
-- original, que já funcionava em produção) e a trava de acesso vira uma
-- condição no WHERE: quem não for admin não enxerga nenhuma linha.
--
-- As permissões (revoke de anon/public) da migration 20261022000002 permanecem.

grant execute on function public.is_admin() to postgres;

create or replace function public.resumo_visitas(p_dias integer default 30)
returns table (total bigint, unicos bigint, hoje bigint, ultimos_7_dias bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval),
    count(distinct v.session_id) filter (where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval),
    count(*) filter (where (v.created_at at time zone 'America/Sao_Paulo')::date
      = (now() at time zone 'America/Sao_Paulo')::date),
    count(*) filter (where v.created_at >= now() - interval '7 days')
  from public.visitas v
  where v.is_admin = false
    and public.is_admin();
$$;

revoke all on function public.resumo_visitas(integer) from public;
revoke all on function public.resumo_visitas(integer) from anon;
grant execute on function public.resumo_visitas(integer) to authenticated;

create or replace function public.visitas_por_dia(p_dias integer default 30)
returns table (dia date, total bigint, unicos bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (v.created_at at time zone 'America/Sao_Paulo')::date as dia,
    count(*)::bigint as total,
    count(distinct v.session_id)::bigint as unicos
  from public.visitas v
  where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    and v.is_admin = false
    and public.is_admin()
  group by 1
  order by 1;
$$;

revoke all on function public.visitas_por_dia(integer) from public;
revoke all on function public.visitas_por_dia(integer) from anon;
grant execute on function public.visitas_por_dia(integer) to authenticated;

create or replace function public.paginas_mais_vistas(
  p_dias integer default 30,
  p_limite integer default 20
)
returns table (path text, total bigint, unicos bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.path as path,
    count(*)::bigint as total,
    count(distinct v.session_id)::bigint as unicos
  from public.visitas v
  where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    and v.is_admin = false
    and public.is_admin()
  group by v.path
  order by count(*) desc
  limit greatest(p_limite, 1);
$$;

revoke all on function public.paginas_mais_vistas(integer, integer) from public;
revoke all on function public.paginas_mais_vistas(integer, integer) from anon;
grant execute on function public.paginas_mais_vistas(integer, integer) to authenticated;
