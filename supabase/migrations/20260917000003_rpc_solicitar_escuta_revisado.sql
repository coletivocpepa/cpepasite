-- Revisa o RPC solicitar_escuta: o e-mail só bloqueia se houver solicitação
-- ativa; caso contrário o cadastro do responsável é reutilizado.
-- Alinhado com supabase/functions/solicitar-escuta/index.ts
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
  v_existente uuid;
  v_ativas integer;
begin
  if not p_lgpd_consent then
    return jsonb_build_object('status', 'erro', 'codigo', 'lgpd');
  end if;

  select id into v_existente from public.responsaveis where email = p_email;

  if v_existente is not null then
    select count(*) into v_ativas
      from public.solicitacoes
     where responsavel_id = v_existente
       and status in ('aberta', 'em_andamento');

    if v_ativas > 0 then
      return jsonb_build_object('status', 'erro', 'codigo', 'duplicado');
    end if;

    update public.responsaveis
       set nome = p_nome,
           telefone = nullif(p_telefone, ''),
           cidade_uf = nullif(p_cidade_uf, ''),
           relacao = p_relacao
     where id = v_existente;

    v_responsavel_id := v_existente;
  else
    insert into public.responsaveis
      (nome, email, telefone, cidade_uf, relacao, lgpd_consent, lgpd_consent_at)
    values
      (p_nome, p_email, nullif(p_telefone, ''), nullif(p_cidade_uf, ''), p_relacao, true, now())
    returning id into v_responsavel_id;
  end if;

  insert into public.solicitacoes
    (responsavel_id, dia_semana, hora_inicio, hora_fim, modalidade, mensagem, status)
  values
    (v_responsavel_id, p_dia_semana, p_hora_inicio, p_hora_fim, p_modalidade, nullif(p_mensagem, ''), 'aberta');

  return jsonb_build_object('status', 'ok', 'responsavel_id', v_responsavel_id);
exception
  when others then
    return jsonb_build_object('status', 'erro', 'codigo', 'erro');
end;
$$;

revoke all on function public.solicitar_escuta(text,text,text,text,public.tipo_relacao,boolean,smallint,time,time,public.modalidade,text) from public;
grant execute on function public.solicitar_escuta(text,text,text,text,public.tipo_relacao,boolean,smallint,time,time,public.modalidade,text) to anon, authenticated;