-- Admin gerencia solicitações (listar, atualizar status, excluir)
drop policy if exists "admin_all_solicitacoes" on public.solicitacoes;
create policy "admin_all_solicitacoes"
on public.solicitacoes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin lê responsáveis (necessário para o join na listagem de solicitações)
drop policy if exists "admin_select_responsaveis" on public.responsaveis;
create policy "admin_select_responsaveis"
on public.responsaveis
for select
to authenticated
using (public.is_admin());