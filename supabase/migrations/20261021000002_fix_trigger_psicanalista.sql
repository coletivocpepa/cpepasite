-- Corrige o trigger handle_new_psicanalista.
-- Antes: a cada novo usuário em auth.users ele INSERIA uma linha nova em
-- psicanalistas com id = new.id. Isso quebrava a criação de usuários cujo
-- e-mail já existia na tabela (índice único psicanalistas_email_uniq),
-- causando "Database error creating new user" (usado por criar-acesso-blog).
--
-- Agora: se já existe psicanalista com esse e-mail, apenas vincula user_id
-- (não duplica o cadastro feito pelo admin). Caso contrário, cria o perfil.

create or replace function public.handle_new_psicanalista()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- já existe cadastro com este e-mail (criado pelo admin): vincula o user
  select id into v_id
    from public.psicanalistas
   where email = new.email
   limit 1;

  if v_id is not null then
    update public.psicanalistas
       set user_id = new.id
     where id = v_id
       and (user_id is null or user_id = new.id);
    return new;
  end if;

  -- sem cadastro prévio: cria o perfil normalmente
  insert into public.psicanalistas (id, user_id, nome, email, ativo)
  values (new.id, new.id, new.raw_user_meta_data->>'nome', new.email, false)
  on conflict (id) do nothing;

  return new;
end;
$$;
