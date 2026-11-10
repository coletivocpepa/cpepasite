grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
on public.responsaveis, public.solicitacoes, public.psicanalistas,
   public.disponibilidades, public.indicacoes
to anon, authenticated;

alter table public.responsaveis enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.psicanalistas enable row level security;
alter table public.disponibilidades enable row level security;
alter table public.indicacoes enable row level security;

drop policy if exists "responsaveis_insert_anon" on public.responsaveis;
create policy "responsaveis_insert_anon"
on public.responsaveis
for insert
to anon, authenticated
with check (true);

drop policy if exists "solicitacoes_insert_anon" on public.solicitacoes;
create policy "solicitacoes_insert_anon"
on public.solicitacoes
for insert
to anon, authenticated
with check (true);

drop policy if exists "psicanalistas_insert_anon" on public.psicanalistas;
create policy "psicanalistas_insert_anon"
on public.psicanalistas
for insert
to anon, authenticated
with check (true);

drop policy if exists "psicanalistas_select_active" on public.psicanalistas;
create policy "psicanalistas_select_active"
on public.psicanalistas
for select
to anon, authenticated
using (ativo = true);

drop policy if exists "psicanalistas_update_own" on public.psicanalistas;
create policy "psicanalistas_update_own"
on public.psicanalistas
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "disponibilidades_select_own" on public.disponibilidades;
create policy "disponibilidades_select_own"
on public.disponibilidades
for select
to authenticated
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "disponibilidades_insert_own" on public.disponibilidades;
create policy "disponibilidades_insert_own"
on public.disponibilidades
for insert
to authenticated
with check (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "disponibilidades_update_own" on public.disponibilidades;
create policy "disponibilidades_update_own"
on public.disponibilidades
for update
to authenticated
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "disponibilidades_delete_own" on public.disponibilidades;
create policy "disponibilidades_delete_own"
on public.disponibilidades
for delete
to authenticated
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "indicacoes_select_own_psicanalista" on public.indicacoes;
create policy "indicacoes_select_own_psicanalista"
on public.indicacoes
for select
to authenticated
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = indicacoes.psicanalista_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "indicacoes_update_own_psicanalista" on public.indicacoes;
create policy "indicacoes_update_own_psicanalista"
on public.indicacoes
for update
to authenticated
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = indicacoes.psicanalista_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.psicanalistas p
    where p.id = indicacoes.psicanalista_id
      and p.user_id = auth.uid()
  )
);