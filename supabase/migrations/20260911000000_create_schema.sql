create extension if not exists citext;

create type modalidade as enum ('online', 'presencial');
create type tipo_relacao as enum ('mae', 'pai', 'responsavel');
create type status_solicitacao as enum ('aberta', 'em_andamento', 'concluida', 'cancelada');
create type status_disponibilidade as enum ('disponivel', 'reservada', 'em_pausa');
create type status_indicacao as enum ('pendente', 'aceita', 'recusada', 'realizada', 'cancelada');

create table public.responsaveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email citext not null unique,
  telefone text,
  cidade_uf text,
  relacao tipo_relacao not null,
  lgpd_consent boolean not null default false,
  lgpd_consent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.responsaveis enable row level security;

create policy "responsaveis_insert_anon"
on public.responsaveis
for insert
with check (true);

create table public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  responsavel_id uuid not null references public.responsaveis(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  modalidade modalidade not null,
  mensagem text,
  status status_solicitacao not null default 'aberta',
  created_at timestamptz not null default now()
);

alter table public.solicitacoes enable row level security;

create policy "solicitacoes_insert_anon"
on public.solicitacoes
for insert
with check (true);

create index idx_solicitacoes_responsavel_id
on public.solicitacoes (responsavel_id);

create table public.psicanalistas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  email citext,
  telefone text,
  formacao text,
  bio text,
  modalidades modalidade[] not null default array['online','presencial']::modalidade[],
  valor_simbolico text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.psicanalistas enable row level security;

create unique index psicanalistas_email_uniq
on public.psicanalistas (email)
where email is not null;

create policy "psicanalistas_insert_anon"
on public.psicanalistas
for insert
with check (true);

create policy "psicanalistas_select_active"
on public.psicanalistas
for select
using (ativo = true);

create policy "psicanalistas_update_own"
on public.psicanalistas
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table public.disponibilidades (
  id uuid primary key default gen_random_uuid(),
  psicanalista_id uuid not null references public.psicanalistas(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  modalidade modalidade not null,
  status status_disponibilidade not null default 'disponivel',
  created_at timestamptz not null default now()
);

alter table public.disponibilidades enable row level security;

create index idx_disponibilidades_psicanalista_id
on public.disponibilidades (psicanalista_id);

create index idx_disponibilidades_horario
on public.disponibilidades (dia_semana, modalidade, status);

create policy "disponibilidades_select_own"
on public.disponibilidades
for select
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
);

create policy "disponibilidades_insert_own"
on public.disponibilidades
for insert
with check (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
);

create policy "disponibilidades_update_own"
on public.disponibilidades
for update
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

create policy "disponibilidades_delete_own"
on public.disponibilidades
for delete
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = disponibilidades.psicanalista_id
      and p.user_id = auth.uid()
  )
);

create table public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
  psicanalista_id uuid not null references public.psicanalistas(id) on delete cascade,
  disponibilidade_id uuid references public.disponibilidades(id) on delete set null,
  status status_indicacao not null default 'pendente',
  notificado_psicanalista_at timestamptz,
  notificado_responsavel_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.indicacoes enable row level security;

create index idx_indicacoes_solicitacao_id
on public.indicacoes (solicitacao_id);

create index idx_indicacoes_psicanalista_id
on public.indicacoes (psicanalista_id);

create unique index idx_indicacoes_disponibilidade_reservada
on public.indicacoes (disponibilidade_id)
where status in ('pendente', 'aceita');

create policy "indicacoes_select_own_psicanalista"
on public.indicacoes
for select
using (
  exists (
    select 1 from public.psicanalistas p
    where p.id = indicacoes.psicanalista_id
      and p.user_id = auth.uid()
  )
);

create policy "indicacoes_update_own_psicanalista"
on public.indicacoes
for update
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