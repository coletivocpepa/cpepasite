-- Tabela para FAQ
create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  pergunta text not null,
  resposta text not null,
  categoria text,
  ordem integer default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.faq enable row level security;

create policy "admin_all_faq"
on public.faq
for all
to authenticated
using (true)
with check (true);

create policy "public_read_faq"
on public.faq
for select
to anon, authenticated
using (ativo = true);

create or replace function public.update_faq_atualizado_em()
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

create trigger trigger_update_faq_atualizado_em
before update on public.faq
for each row
execute function public.update_faq_atualizado_em();

insert into public.faq (pergunta, resposta, categoria, ordem) values
('Quem pode solicitar escuta no CPEPA?', 'Mães, pais e responsáveis diretos por pessoas autistas, em qualquer momento da jornada — do diagnóstico à vida adulta.', 'Geral', 1),
('Preciso de encaminhamento médico?', 'Não. O CPEPA acolhe livremente, sem necessidade de encaminhamento médico ou diagnóstico formal.', 'Geral', 2),
('Como funciona a solicitação de escuta?', 'Você preenche o formulário com seus dados e horários disponíveis. O sistema busca psicanalistas com disponibilidade compatível e apresenta as indicações na tela com botão para WhatsApp e link para o perfil do psicanalista.', 'Processo', 1),
('Quanto custa a escuta?', 'O CPEPA pratica valores simbólicos, acordados diretamente entre o psicanalista e o responsável. Não há fins lucrativos.', 'Valores', 1),
('A escuta é online ou presencial?', 'Ambas as modalidades estão disponíveis, conforme a disponibilidade do psicanalista e a preferência do responsável.', 'Modalidade', 1),
('Qual a formação dos psicanalistas?', 'Todos os psicanalistas do CPEPA têm formação em psicanálise e experiência em escuta de pais de pessoas autistas.', 'Psicanalistas', 1),
('Meus dados são sigilosos?', 'Sim. O CPEPA segue a LGPD e o sigilo profissional da psicanálise. Seus dados são usados exclusivamente para viabilizar a escuta.', 'Privacidade', 1),
('Posso escolher o psicanalista?', 'O sistema indica psicanalistas com disponibilidade compatível. Você pode ver o perfil de cada um e escolher com quem entrar em contato.', 'Processo', 2)
on conflict do nothing;