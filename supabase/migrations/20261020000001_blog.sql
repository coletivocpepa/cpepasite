-- Blog: tabelas, RLS, storage e seed
-- Admins: mesma allowlist de src/lib/admin-emails.ts (manter sincronizado!)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Função de autorização de admin (espelho de src/lib/admin-emails.ts)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.email(), '') in (
    'admin@cpepa.org',
    'coordenacao@cpepa.org',
    'escobarpsiba@gmail.com'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Tabela categorias
-- ---------------------------------------------------------------------------
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  criado_em timestamptz not null default now()
);

alter table public.categorias enable row level security;

create policy "public_read_categorias"
on public.categorias
for select
to anon, authenticated
using (true);

create policy "admin_write_categorias"
on public.categorias
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Tabela posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  conteudo_html text not null default '',
  capa_url text,
  categoria_id uuid references public.categorias(id) on delete set null,
  tags text[] not null default '{}',
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  autor text,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists posts_status_publicado_em_idx
  on public.posts (status, publicado_em desc);

create index if not exists posts_tags_idx
  on public.posts using gin (tags);

create index if not exists posts_categoria_id_idx
  on public.posts (categoria_id);

-- Trigger de atualização automática de atualizado_em
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trigger_update_posts_atualizado_em on public.posts;
create trigger trigger_update_posts_atualizado_em
before update on public.posts
for each row
execute function public.touch_updated_at();

-- Garante publicado_em ao publicar
create or replace function public.posts_set_publicado_em()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'publicado' and new.publicado_em is null then
    new.publicado_em := now();
  end if;
  if new.status = 'rascunho' then
    new.publicado_em := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_posts_set_publicado_em on public.posts;
create trigger trigger_posts_set_publicado_em
before insert or update on public.posts
for each row
execute function public.posts_set_publicado_em();

-- ---------------------------------------------------------------------------
-- RLS posts
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;

create policy "public_read_posts_publicados"
on public.posts
for select
to anon, authenticated
using (status = 'publicado' and publicado_em <= now());

create policy "admin_all_posts"
on public.posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket blog (imagens de capa e conteúdo)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

drop policy if exists "public_read_blog_images" on storage.objects;
create policy "public_read_blog_images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'blog');

drop policy if exists "admin_write_blog_images" on storage.objects;
create policy "admin_write_blog_images"
on storage.objects
for all
to authenticated
using (bucket_id = 'blog' and public.is_admin())
with check (bucket_id = 'blog' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed de categorias iniciais
-- ---------------------------------------------------------------------------
insert into public.categorias (slug, nome) values
  ('geral', 'Geral'),
  ('autismo', 'Autismo'),
  ('escuta', 'Escuta'),
  ('familia', 'Família'),
  ('cpepa', 'CPEPA')
on conflict (slug) do nothing;
