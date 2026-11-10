import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminSolicitacoesContent from "./AdminSolicitacoesContent";
import type { StatusSolicitacao } from "@/lib/supabase/database.types";

export default async function AdminSolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const perPage = 20;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("solicitacoes")
    .select(
      `
      id,
      dia_semana,
      hora_inicio,
      hora_fim,
      modalidade,
      mensagem,
      status,
      created_at,
      responsavel:responsaveis!inner (id, nome, email, telefone, cidade_uf, relacao)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * perPage, currentPage * perPage - 1);

  if (status && status !== "todas") {
    query = query.eq("status", status as StatusSolicitacao);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[AdminSolicitacoesPage] error:", error);
  }

  return (
    <AdminSolicitacoesContent
      solicitacoes={data ?? []}
      count={count ?? 0}
      currentPage={currentPage}
      perPage={perPage}
      currentStatus={status ?? "todas"}
    />
  );
}