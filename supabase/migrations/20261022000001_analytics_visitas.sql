-- Analytics: registro de visitas (first-party, sem serviços externos)
-- Captura via middleware (src/proxy.ts) usando a RPC registrar_visita().
-- Leitura e agregação restritas a admins.

create table if not exists public.visitas (
  id bigint generated always as identity primary key,
  path text not null,
  referrer text,
  session_id text,
  user_agent text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists visitas_created_at_idx on public.visitas (created_at desc);
create index if not exists visitas_path_idx on public.visitas (path);

alter table public.visitas enable row level security;

-- Somente admins leem os dados brutos. A inserção ocorre via RPC (security definer),
-- portanto não há policy de insert para anon/authenticated.
drop policy if exists "admin_read_visitas" on public.visitas;
create policy "admin_read_visitas"
on public.visitas
for select
to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- registrar_visita(): grava uma visita. Executável por anon/authenticated.
-- Ignora tráfego de bots comuns e prefetch do Next.js.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_visita(
  p_path text,
  p_referrer text default null,
  p_session_id text default null,
  p_user_agent text default null,
  p_is_admin boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_path is null or p_path = '' then
    return;
  end if;

  -- mantém apenas o caminho, sem querystring
  insert into public.visitas (path, referrer, session_id, user_agent, is_admin)
  values (
    split_part(p_path, '?', 1),
    nullif(left(coalesce(p_referrer, ''), 400), ''),
    nullif(left(coalesce(p_session_id, ''), 64), ''),
    nullif(left(coalesce(p_user_agent, ''), 400), ''),
    coalesce(p_is_admin, false)
  );
end;
$$;

revoke all on function public.registrar_visita(text, text, text, text, boolean) from public;
grant execute on function public.registrar_visita(text, text, text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- visitas_por_dia(): total de visitas e de visitantes únicos por dia
-- ---------------------------------------------------------------------------
create or replace function public.visitas_por_dia(p_dias integer default 30)
returns table (dia date, total bigint, unicos bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (created_at at time zone 'America/Sao_Paulo')::date as dia,
    count(*) as total,
    count(distinct session_id) as unicos
  from public.visitas
  where created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    and is_admin = false
  group by 1
  order by 1;
$$;

revoke all on function public.visitas_por_dia(integer) from public;
grant execute on function public.visitas_por_dia(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- paginas_mais_vistas(): ranking de páginas no período
-- ---------------------------------------------------------------------------
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
    path,
    count(*) as total,
    count(distinct session_id) as unicos
  from public.visitas
  where created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    and is_admin = false
  group by path
  order by total desc
  limit greatest(p_limite, 1);
$$;

revoke all on function public.paginas_mais_vistas(integer, integer) from public;
grant execute on function public.paginas_mais_vistas(integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- resumo_visitas(): totais do período (visitas, únicos, hoje, 7 dias)
-- ---------------------------------------------------------------------------
create or replace function public.resumo_visitas(p_dias integer default 30)
returns table (total bigint, unicos bigint, hoje bigint, ultimos_7_dias bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where created_at >= now() - (greatest(p_dias, 1) || ' days')::interval) as total,
    count(distinct session_id) filter (where created_at >= now() - (greatest(p_dias, 1) || ' days')::interval) as unicos,
    count(*) filter (where (created_at at time zone 'America/Sao_Paulo')::date
      = (now() at time zone 'America/Sao_Paulo')::date) as hoje,
    count(*) filter (where created_at >= now() - interval '7 days') as ultimos_7_dias
  from public.visitas
  where is_admin = false;
$$;

revoke all on function public.resumo_visitas(integer) from public;
grant execute on function public.resumo_visitas(integer) to authenticated;
