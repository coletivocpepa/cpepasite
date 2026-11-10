-- Leads do e-book: captura nome + WhatsApp mediante consentimento LGPD.
-- Inserção exclusivamente via RPC (security definer). Leitura/exclusão por admin.

create table if not exists public.ebook_leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  lgpd_consent boolean not null default false,
  lgpd_consent_at timestamptz,
  origem text not null default 'ebook-autismo',
  downloads integer not null default 1,
  created_at timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ebook_leads_nome_len
    check (char_length(btrim(nome)) between 2 and 120),
  constraint ebook_leads_whatsapp_formato
    check (whatsapp ~ '^55[1-9][0-9]{9,10}$'),
  constraint ebook_leads_lgpd
    check (lgpd_consent = true)
);

create unique index if not exists ebook_leads_whatsapp_key
  on public.ebook_leads (whatsapp);

create index if not exists ebook_leads_created_at_idx
  on public.ebook_leads (created_at desc);

alter table public.ebook_leads enable row level security;

revoke all on public.ebook_leads from anon;
grant select, delete on public.ebook_leads to authenticated;

drop policy if exists "admin_read_ebook_leads" on public.ebook_leads;
create policy "admin_read_ebook_leads"
on public.ebook_leads
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_delete_ebook_leads" on public.ebook_leads;
create policy "admin_delete_ebook_leads"
on public.ebook_leads
for delete
to authenticated
using (public.is_admin());

create or replace function public.registrar_lead_ebook(
  p_nome text,
  p_whatsapp text,
  p_lgpd_consent boolean,
  p_origem text default 'ebook-autismo'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_whatsapp text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_origem text := left(coalesce(nullif(btrim(p_origem), ''), 'ebook-autismo'), 60);
begin
  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    return jsonb_build_object('status', 'erro', 'codigo', 'nome');
  end if;

  -- Número local (DDD + número): prefixa o código do Brasil.
  if char_length(v_whatsapp) in (10, 11) then
    v_whatsapp := '55' || v_whatsapp;
  end if;

  if v_whatsapp !~ '^55[1-9][0-9]{9,10}$' then
    return jsonb_build_object('status', 'erro', 'codigo', 'whatsapp');
  end if;

  if not coalesce(p_lgpd_consent, false) then
    return jsonb_build_object('status', 'erro', 'codigo', 'lgpd');
  end if;

  insert into public.ebook_leads
    (nome, whatsapp, lgpd_consent, lgpd_consent_at, origem)
  values
    (v_nome, v_whatsapp, true, now(), v_origem)
  on conflict (whatsapp) do update set
    nome = excluded.nome,
    lgpd_consent = true,
    lgpd_consent_at = now(),
    origem = excluded.origem,
    downloads = public.ebook_leads.downloads + 1,
    atualizado_em = now();

  return jsonb_build_object('status', 'ok');
exception
  when others then
    return jsonb_build_object('status', 'erro', 'codigo', 'erro');
end;
$$;

revoke all on function public.registrar_lead_ebook(text, text, boolean, text) from public;
grant execute on function public.registrar_lead_ebook(text, text, boolean, text)
  to anon, authenticated;
