import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminDashboardContent from "./AdminDashboardContent";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { count: totalSolicitacoes },
    { count: totalIndicacoes },
    { count: totalPsicanalistas },
    { count: solicitacoesAbertas },
    { count: indicacoesPendentes },
    { count: psicanalistasAtivos },
    { count: totalEbookLeads },
  ] = await Promise.all([
    supabase.from("solicitacoes").select("*", { count: "exact", head: true }),
    supabase.from("indicacoes").select("*", { count: "exact", head: true }),
    supabase.from("psicanalistas").select("*", { count: "exact", head: true }),
    supabase.from("solicitacoes").select("*", { count: "exact", head: true }).eq("status", "aberta"),
    supabase.from("indicacoes").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("psicanalistas").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("ebook_leads").select("*", { count: "exact", head: true }),
  ]);

  const stats = {
    totalSolicitacoes: totalSolicitacoes ?? 0,
    totalIndicacoes: totalIndicacoes ?? 0,
    totalPsicanalistas: totalPsicanalistas ?? 0,
    solicitacoesAbertas: solicitacoesAbertas ?? 0,
    indicacoesPendentes: indicacoesPendentes ?? 0,
    psicanalistasAtivos: psicanalistasAtivos ?? 0,
    totalEbookLeads: totalEbookLeads ?? 0,
  };

  return <AdminDashboardContent stats={stats} />;
}