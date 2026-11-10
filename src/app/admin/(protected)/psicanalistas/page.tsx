import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminPsicanalistasContent from "./AdminPsicanalistasContent";

export default async function AdminPsicanalistasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const perPage = 20;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("psicanalistas")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * perPage, currentPage * perPage - 1);

  if (status && status !== "todas") {
    query = query.eq("ativo", status === "ativo");
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[AdminPsicanalistasPage] error:", error);
  }

  const psicanalistas = data ?? [];
  const ids = psicanalistas.map((p) => p.id);

  let disponibilidades: {
    id: string;
    psicanalista_id: string;
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
    modalidade: "online" | "presencial";
    status: "disponivel" | "reservada" | "em_pausa";
  }[] = [];

  if (ids.length > 0) {
    const { data: dispData, error: dispError } = await supabase
      .from("disponibilidades")
      .select("id, psicanalista_id, dia_semana, hora_inicio, hora_fim, modalidade, status")
      .in("psicanalista_id", ids);

    if (dispError) {
      console.error("[AdminPsicanalistasPage] disponibilidades error:", dispError);
    } else {
      disponibilidades = dispData ?? [];
    }
  }

  return (
    <AdminPsicanalistasContent
      psicanalistas={psicanalistas}
      disponibilidades={disponibilidades}
      count={count ?? 0}
      currentPage={currentPage}
      perPage={perPage}
      currentStatus={status ?? "todas"}
    />
  );
}