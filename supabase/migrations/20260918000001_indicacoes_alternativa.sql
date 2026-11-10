-- Marca indicações criadas pelo fallback de "horário mais próximo"
-- (quando o horário solicitado pela pessoa não estava disponível).
alter table public.indicacoes
  add column if not exists alternativa boolean not null default false;

comment on column public.indicacoes.alternativa is
  'true quando a indicação foi gerada pelo fallback de horário mais próximo';