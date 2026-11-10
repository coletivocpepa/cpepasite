import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminIndicacoesContent from "./AdminIndicacoesContent";
import type { StatusIndicacao } from "@/lib/supabase/database.types";

export default async function AdminIndicacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const perPage = 20;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("indicacoes")
    .select(
      `
      id,
      status,
      alternativa,
      created_at,
      notificado_psicanalista_at,
      notificado_responsavel_at,
      solicitacao:solicitacoes!inner (
        id,
        dia_semana,
        hora_inicio,
        hora_fim,
        modalidade,
        responsavel:responsaveis!inner (id, nome, email, telefone)
      ),
      psicanalista:psicanalistas!inner (
        id,
        nome,
        email,
        telefone,
        bio,
        modalidades,
        valor_simbolico
      ),
      disponibilidade:disponibilidades!inner (
        id,
        dia_semana,
        hora_inicio,
        hora_fim,
        modalidade
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * perPage, currentPage * perPage - 1);

  if (status && status !== "todas") {
    query = query.eq("status", status as StatusIndicacao);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[AdminIndicacoesPage] error:", error);
  }

  return (
    <AdminIndicacoesContent
      indicacoes={data ?? []}
      count={count ?? 0}
      currentPage={currentPage}
      perPage={perPage}
      currentStatus={status ?? "todas"}
    />
  );
}