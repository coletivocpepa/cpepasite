-- Tabela para gerenciamento de conteúdo do site (CMS simples)
create table if not exists public.conteudo_site (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  titulo text not null,
  conteudo text not null,
  tipo text not null check (tipo in ('texto', 'html', 'markdown')) default 'texto',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.conteudo_site enable row level security;

-- Admin pode gerenciar tudo
create policy "admin_all_conteudo"
on public.conteudo_site
for all
to authenticated
using (true)
with check (true);

-- Leitura pública para uso no frontend
create policy "public_read_conteudo"
on public.conteudo_site
for select
to anon, authenticated
using (true);

-- Trigger para atualizar atualizado_em
create or replace function public.update_conteudo_atualizado_em()
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

create trigger trigger_update_conteudo_atualizado_em
before update on public.conteudo_site
for each row
execute function public.update_conteudo_atualizado_em();

-- Inserir conteúdos iniciais
insert into public.conteudo_site (chave, titulo, conteudo, tipo) values
('hero.titulo', 'Título do Hero', 'CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas', 'texto'),
('hero.subtitulo', 'Subtítulo do Hero', 'Antes de cuidar, é preciso poder falar.', 'texto'),
('hero.cta', 'Texto do Botão CTA', 'Quero ser escutado', 'texto'),
('sobre.titulo', 'Título da Seção Sobre', 'O que é o CPEPA', 'texto'),
('sobre.texto', 'Texto da Seção Sobre', 'Ser mãe ou pai de uma pessoa autista pode produzir perguntas, angústias, conflitos e transformações que nem sempre encontram espaço para serem ditos. O CPEPA oferece um espaço de escuta psicanalítica para mães e pais que desejam falar sobre aquilo que essa experiência produz em suas vidas.', 'texto'),
('escuta.titulo', 'Título da Seção A Escuta', 'A Escuta', 'texto'),
('escuta.texto', 'Texto da Seção A Escuta', 'A escuta psicanalítica não é aconselhamento, nem orientação, nem psicoeducação. É um espaço onde o sujeito pode falar livremente, ser ouvido sem julgamento e encontrar seus próprios caminhos.', 'texto'),
('para-pais.titulo', 'Título da Seção Para Pais', 'Para Pais', 'texto'),
('para-pais.texto', 'Texto da Seção Para Pais', 'O CPEPA acolhe mães e pais em qualquer momento de sua jornada — desde o diagnóstico até a vida adulta do filho. Não há critério de gravidade, nem necessidade de encaminhamento médico.', 'texto'),
('como-funciona.titulo', 'Título da Seção Como Funciona', 'Como Funciona', 'texto'),
('como-funciona.texto', 'Texto da Seção Como Funciona', '1. Preencha o formulário de solicitação de escuta com seus dados e horários disponíveis. 2. O sistema busca psicanalistas com disponibilidade compatível. 3. A indicação é apresentada na tela com botão para WhatsApp e link para o perfil do psicanalista. 4. O contato é feito diretamente entre as partes.', 'texto'),
('valor.titulo', 'Título da Seção Valor Simbólico', 'Valor Simbólico', 'texto'),
('valor.texto', 'Texto da Seção Valor Simbólico', 'O CPEPA pratica valores simbólicos, acordados diretamente entre o psicanalista e o responsável. Não há fins lucrativos — o valor cobre custos e valoriza o trabalho do psicanalista.', 'texto'),
('quem-somos.titulo', 'Título da Seção Quem Somos', 'Quem Somos', 'texto'),
('quem-somos.texto', 'Texto da Seção Quem Somos', 'O CPEPA é um coletivo de psicanalistas comprometidos com a escuta de pais de pessoas autistas. Nossa ética é a da psicanálise: sigilo, não julgamento e respeito à singularidade de cada sujeito.', 'texto'),
('faq.titulo', 'Título da Seção FAQ', 'Perguntas Frequentes', 'texto')
on conflict (chave) do nothing;