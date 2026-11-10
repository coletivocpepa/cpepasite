-- Acesso de publicação de blog para psicanalistas (autores)
-- Substitui a versão hardcoded de is_admin() pela tabela public.admins
-- e adiciona suporte a autores de blog (psicanalistas com acesso_blog).

-- ---------------------------------------------------------------------------
-- garante que a tabela admins existe e está populada (fonte única do is_admin)
-- ---------------------------------------------------------------------------
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

-- is_admin(): agora consulta a tabela admins (por e-mail do JWT)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.email = (auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Colunas de acesso ao blog na tabela psicanalistas
-- ---------------------------------------------------------------------------
alter table public.psicanalistas
  add column if not exists acesso_blog boolean not null default false,
  add column if not exists deve_trocar_senha boolean not null default true,
  add column if not exists acesso_criado_em timestamptz;

-- ---------------------------------------------------------------------------
-- posts: autoria
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists autor_id uuid references auth.users(id) on delete set null;

create index if not exists posts_autor_id_idx on public.posts (autor_id);

-- ---------------------------------------------------------------------------
-- pode_postar(): autor habilitado a publicar no blog
-- ---------------------------------------------------------------------------
create or replace function public.pode_postar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.psicanalistas p
    where p.user_id = auth.uid()
      and p.acesso_blog = true
      and p.ativo = true
  );
$$;

revoke all on function public.pode_postar() from public;
grant execute on function public.pode_postar() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS posts: admin gerencia tudo; autor gerencia os próprios posts
-- ---------------------------------------------------------------------------
drop policy if exists "admin_all_posts" on public.posts;

create policy "admin_all_posts"
on public.posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- autor: lê os próprios rascunhos (publicados já são públicos)
create policy "autor_select_own_posts"
on public.posts
for select
to authenticated
using (autor_id = auth.uid() and public.pode_postar());

-- autor: cria posts (sempre como ele mesmo)
create policy "autor_insert_own_posts"
on public.posts
for insert
to authenticated
with check (autor_id = auth.uid() and public.pode_postar());

-- autor: atualiza os próprios posts
create policy "autor_update_own_posts"
on public.posts
for update
to authenticated
using (autor_id = auth.uid() and public.pode_postar())
with check (autor_id = auth.uid() and public.pode_postar());

-- autor: exclui os próprios posts
create policy "autor_delete_own_posts"
on public.posts
for delete
to authenticated
using (autor_id = auth.uid() and public.pode_postar());

-- ---------------------------------------------------------------------------
-- Storage blog: autor também pode enviar/gerenciar imagens
-- ---------------------------------------------------------------------------
drop policy if exists "admin_write_blog_images" on storage.objects;
create policy "admin_write_blog_images"
on storage.objects
for all
to authenticated
using (bucket_id = 'blog' and (public.is_admin() or public.pode_postar()))
with check (bucket_id = 'blog' and (public.is_admin() or public.pode_postar()));
