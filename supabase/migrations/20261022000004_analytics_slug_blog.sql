-- Analytics: /blog/<slug> só é registrado se o post existir e estiver publicado
--
-- A allowlist do middleware aceita qualquer /blog/<slug>; isso é necessário
-- porque os slugs são dinâmicos. Mas um scanner que acerta /blog/qualquer-coisa
-- (404) ainda entrava no ranking. Aqui a própria RPC valida o slug contra os
-- posts publicados. Admin (previsão de rascunho) continua sendo registrado.

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

  -- /blog/<slug>: só entra se o post existir e estiver publicado
  if v_path ~ '^/blog/[^/]+' and not coalesce(p_is_admin, false) then
    if not exists (
      select 1
      from public.posts p
      where p.slug = regexp_replace(split_part(v_path, '/', 3), '/+$', '')
        and p.status = 'publicado'
    ) then
      return;
    end if;
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
