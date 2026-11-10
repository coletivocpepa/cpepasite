-- Administração de disponibilidades e psicanalistas pelo admin
-- (espelha ADMIN_EMAILS em src/lib/admin-emails.ts)

create table if not exists public.admins (
  email citext primary key,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins_select_authenticated" on public.admins;
create policy "admins_select_authenticated"
on public.admins
for select
to anon, authenticated
using (true);

insert into public.admins (email) values
  ('admin@cpepa.org'),
  ('coordenacao@cpepa.org'),
  ('escobarpsiba@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.email = auth.jwt() ->> 'email'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Admin gerencia disponibilidades de qualquer psicanalista
drop policy if exists "admin_all_disponibilidades" on public.disponibilidades;
create policy "admin_all_disponibilidades"
on public.disponibilidades
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin gerencia psicanalistas (editar/toggle ativo), já que as policies atuais
-- exigem user_id = auth.uid() e bloqueiam o admin
drop policy if exists "admin_all_psicanalistas" on public.psicanalistas;
create policy "admin_all_psicanalistas"
on public.psicanalistas
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());