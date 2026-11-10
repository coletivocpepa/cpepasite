-- Analytics: endurecimento das RPCs e limpeza do ruído de scanner
--
-- Contexto:
-- - As RPCs de leitura são SECURITY DEFINER, ou seja, ignoram a RLS da
--   tabela `visitas` (a policy só libera leitura para admin). A chave `anon`
--   é pública (vai no bundle do site), então elas precisam checar is_admin()
--   no corpo e perder o EXECUTE do papel `anon`.
-- - registrar_visita() precisa continuar acessível ao `anon` (o middleware
--   roda no Worker e só tem a chave anon), mas passa a descartar paths de
--   varredura de vulnerabilidade (.env, phpinfo.php, dumps, etc.).
-- - A limpeza final remove os registros de scanner/bot já gravados: só
--   permanecem as páginas reais do site.

-- ---------------------------------------------------------------------------
-- 1) registrar_visita(): descarta paths de scanner de vulnerabilidade
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
declare
  v_path text;
begin
  if p_path is null or p_path = '' then
    return;
  end if;

  -- mantém apenas o caminho, sem querystring
  v_path := split_part(p_path, '?', 1);

  if v_path !~ '^/' or length(v_path) > 300 then
    return;
  end if;

  -- dotfiles: .env, .env.swp, .git/config, .htaccess, .env.local...
  if v_path ~ '(^|/)\.' then
    return;
  end if;

  -- .env em qualquer posição: /k8s/.env, /config.env
  if v_path ilike '%\.env%' then
    return;
  end if;

  -- arquivos de servidor/backups/dumps: phpinfo.php, wp-login.php, dump.sql...
  if v_path ~* '\.(php[0-9]?|phtml|phar|asp|aspx|jsp|cgi|pl|sql|bak|old|orig|save|swp|swo|log|ini|conf|cfg|yaml|yml|toml|lock|key|pem|tar|tgz|zip|rar|7z)$' then
    return;
  end if;

  -- sondas conhecidas de CMS/infra: phpmyadmin, wp-admin, cgi-bin, _environment...
  if v_path ~* '/(phpinfo|php-info|_phpinfo|_environment|info|pi|pinfo|debug|phpversion|server-info|server-status|test|shell|cmd|cgi-bin|phpmyadmin|pma|adminer|wp-admin|wp-content|wp-includes|xmlrpc|readme|license|changelog|version|composer|package-lock|dockerfile|web\.config|htaccess|htpasswd|id_rsa|authorized_keys|known_hosts|crossdomain\.xml|elmah|trace|solr|jenkins|gitlab|bitbucket)([./]|$)' then
    return;
  end if;

  insert into public.visitas (path, referrer, session_id, user_agent, is_admin)
  values (
    v_path,
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
-- 2) RPCs de leitura: exigem is_admin() e não são mais acessíveis por anon
-- ---------------------------------------------------------------------------
create or replace function public.resumo_visitas(p_dias integer default 30)
returns table (total bigint, unicos bigint, hoje bigint, ultimos_7_dias bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado: somente administradores podem ler as visitas'
      using errcode = '42501';
  end if;

  return query
  select
    count(*) filter (
      where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    ),
    count(distinct v.session_id) filter (
      where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    ),
    count(*) filter (
      where (v.created_at at time zone 'America/Sao_Paulo')::date
        = (now() at time zone 'America/Sao_Paulo')::date
    ),
    count(*) filter (where v.created_at >= now() - interval '7 days')
  from public.visitas v
  where v.is_admin = false;
end;
$$;

revoke all on function public.resumo_visitas(integer) from public;
revoke all on function public.resumo_visitas(integer) from anon;
grant execute on function public.resumo_visitas(integer) to authenticated;

create or replace function public.visitas_por_dia(p_dias integer default 30)
returns table (dia date, total bigint, unicos bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado: somente administradores podem ler as visitas'
      using errcode = '42501';
  end if;

  return query
  select
    (v.created_at at time zone 'America/Sao_Paulo')::date as dia,
    count(*)::bigint as total,
    count(distinct v.session_id)::bigint as unicos
  from public.visitas v
  where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    and v.is_admin = false
  group by 1
  order by 1;
end;
$$;

revoke all on function public.visitas_por_dia(integer) from public;
revoke all on function public.visitas_por_dia(integer) from anon;
grant execute on function public.visitas_por_dia(integer) to authenticated;

create or replace function public.paginas_mais_vistas(
  p_dias integer default 30,
  p_limite integer default 20
)
returns table (path text, total bigint, unicos bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado: somente administradores podem ler as visitas'
      using errcode = '42501';
  end if;

  return query
  select
    v.path as path,
    count(*)::bigint as total,
    count(distinct v.session_id)::bigint as unicos
  from public.visitas v
  where v.created_at >= now() - (greatest(p_dias, 1) || ' days')::interval
    and v.is_admin = false
  group by v.path
  order by count(*) desc
  limit greatest(p_limite, 1);
end;
$$;

revoke all on function public.paginas_mais_vistas(integer, integer) from public;
revoke all on function public.paginas_mais_vistas(integer, integer) from anon;
grant execute on function public.paginas_mais_vistas(integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Limpeza: remove tudo que não é página real do site
--
-- O middleware agora só registra as rotas públicas listadas abaixo (mesma
-- lista em src/proxy.ts). Qualquer outro registro é scanner ou 404.
-- Ao criar uma rota pública nova, atualize as duas listas.
-- ---------------------------------------------------------------------------
delete from public.visitas v
where not (
  v.path = '/'
  or v.path ~ '^/solicitar-escuta/?$'
  or v.path ~ '^/minhas-solicitacoes/?$'
  or v.path ~ '^/blog/?$'
  or v.path ~ '^/blog/[^/]+/?$'
  or v.path ~ '^/psicanalistas/?$'
  or v.path ~ '^/psicanalistas/[^/]+/?$'
);
