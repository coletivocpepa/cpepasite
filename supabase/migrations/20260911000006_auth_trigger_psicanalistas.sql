-- Trigger de auth para criar perfil de psicanalista automaticamente
-- e colunas adicionais para o painel

-- Adicionar coluna para armazenar o hash da senha temporária (opcional, para convite)
alter table public.psicanalistas
add column if not exists convite_token text unique,
add column if not exists convite_expira timestamptz;

-- Função trigger: cria perfil ao confirmar signup
create or replace function public.handle_new_psicanalista()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.psicanalistas (id, user_id, nome, email, ativo)
  values (new.id, new.id, new.raw_user_meta_data->>'nome', new.email, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger no auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_psicanalista();

-- Policy para psicanalista gerenciar seu próprio perfil
drop policy if exists "psicanalista_manage_own" on public.psicanalistas;
create policy "psicanalista_manage_own"
on public.psicanalistas
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Policy para leitura pública de psicanalistas ativos
drop policy if exists "psicanalistas_select_active" on public.psicanalistas;
create policy "psicanalistas_select_active"
on public.psicanalistas
for select
to anon, authenticated
using (ativo = true);

-- Grants para o trigger funcionar
grant usage on schema public to supabase_auth_admin;
grant insert on public.psicanalistas to supabase_auth_admin;