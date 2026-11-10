-- Fluxo de solicitação via RPC (SECURITY DEFINER)
-- Corrige: INSERT ... RETURNING em tabelas RLS sem policy de SELECT p/ anon
-- era barrado ("new row violates row-level security policy").

-- Remove a policy que causava o bloqueio (sem utilidade p/ anon: auth.uid() é NULL)
drop policy if exists responsaveis_select_own on public.responsaveis;

-- Função única para o formulário (valida, insere responsavel + solicitacao e retorna codigo)
create or replace function public.solicitar_escuta(
  p_nome text,
  p_email text,
  p_telefone text,
  p_cidade_uf text,
  p_relacao public.tipo_relacao,
  p_lgpd_consent boolean,
  p_dia_semana smallint,
  p_hora_inicio time,
  p_hora_fim time,
  p_modalidade public.modalidade,
  p_mensagem text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_responsavel_id uuid;
begin
  if not p_lgpd_consent then
    return jsonb_build_object('status', 'erro', 'codigo', 'lgpd');
  end if;

  if exists (select 1 from public.responsaveis where email = p_email) then
    return jsonb_build_object('status', 'erro', 'codigo', 'duplicado');
  end if;

  insert into public.responsaveis
    (nome, email, telefone, cidade_uf, relacao, lgpd_consent, lgpd_consent_at)
  values
    (p_nome, p_email, nullif(p_telefone, ''), nullif(p_cidade_uf, ''), p_relacao, true, now())
  returning id into v_responsavel_id;

  insert into public.solicitacoes
    (responsavel_id, dia_semana, hora_inicio, hora_fim, modalidade, mensagem, status)
  values
    (v_responsavel_id, p_dia_semana, p_hora_inicio, p_hora_fim, p_modalidade, nullif(p_mensagem, ''), 'aberta');

  return jsonb_build_object('status', 'ok');
exception
  when others then
    return jsonb_build_object('status', 'erro', 'codigo', 'erro');
end;
$$;

revoke all on function public.solicitar_escuta(text,text,text,text,public.tipo_relacao,boolean,smallint,time,time,public.modalidade,text) from public;
grant execute on function public.solicitar_escuta(text,text,text,text,public.tipo_relacao,boolean,smallint,time,time,public.modalidade,text) to anon, authenticated;