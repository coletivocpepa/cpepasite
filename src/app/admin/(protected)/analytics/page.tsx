import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminAnalyticsContent from "./AdminAnalyticsContent";

export const dynamic = "force-dynamic";

const PERIODOS = [7, 30, 90];

type Resumo = { total: number; unicos: number; hoje: number; ultimos_7_dias: number };
type DiaVisitas = { dia: string; total: number; unicos: number };
type PaginaVisitas = { path: string; total: number; unicos: number };

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias } = await searchParams;
  const parsed = Number.parseInt(dias ?? "30", 10);
  const periodo = PERIODOS.includes(parsed) ? parsed : 30;

  const supabase = await createServerSupabaseClient();

  // As RPCs de leitura exigem is_admin() (são security definer), então a
  // checagem vem antes: usuário não-admin não chega a disparar a consulta.
  const { data: isAdmin } = await supabase.rpc("is_admin");

  let resumo: Resumo = { total: 0, unicos: 0, hoje: 0, ultimos_7_dias: 0 };
  let porDia: DiaVisitas[] = [];
  let paginas: PaginaVisitas[] = [];

  if (isAdmin === true) {
    const [resumoRes, porDiaRes, paginasRes] = await Promise.all([
      supabase.rpc("resumo_visitas", { p_dias: periodo }),
      supabase.rpc("visitas_por_dia", { p_dias: periodo }),
      supabase.rpc("paginas_mais_vistas", { p_dias: periodo, p_limite: 25 }),
    ]);

    if (resumoRes.error) {
      console.error("[AdminAnalyticsPage] resumo_visitas:", resumoRes.error);
    }
    if (porDiaRes.error) {
      console.error("[AdminAnalyticsPage] visitas_por_dia:", porDiaRes.error);
    }
    if (paginasRes.error) {
      console.error("[AdminAnalyticsPage] paginas_mais_vistas:", paginasRes.error);
    }

    resumo = resumoRes.data?.[0] ?? resumo;
    porDia = porDiaRes.data ?? [];
    paginas = paginasRes.data ?? [];
  }

  return (
    <AdminAnalyticsContent
      periodo={periodo}
      isAdmin={isAdmin === true}
      resumo={resumo}
      porDia={porDia}
      paginas={paginas}
    />
  );
}
