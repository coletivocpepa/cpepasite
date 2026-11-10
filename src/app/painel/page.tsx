import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import PainelContent from "./PainelContent";

export default async function PainelPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/painel");

  const { data: psicanalista } = await supabase
    .from("psicanalistas")
    .select("id, nome, ativo")
    .eq("user_id", user.id)
    .single();

  if (!psicanalista) {
    redirect("/admin");
  }

  const { data: disponibilidades } = await supabase
    .from("disponibilidades")
    .select("*")
    .eq("psicanalista_id", psicanalista.id)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  return <PainelContent psicanalista={psicanalista} disponibilidades={disponibilidades ?? []} />;
}