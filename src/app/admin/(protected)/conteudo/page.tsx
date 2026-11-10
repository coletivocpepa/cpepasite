import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminConteudoContent, { type Conteudo } from "./AdminConteudoContent";

export default async function AdminConteudoPage() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("conteudo_site")
    .select("*")
    .order("chave", { ascending: true });

  if (error) {
    console.error("[AdminConteudoPage] error:", error);
  }

  return <AdminConteudoContent conteudos={(data ?? []) as unknown as Conteudo[]} />;
}