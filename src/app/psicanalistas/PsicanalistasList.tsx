"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export async function getPsicanalistas(filters?: {
  modalidade?: string;
  cidade?: string;
}) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("psicanalistas")
    .select("id, nome, bio, modalidades, valor_simbolico")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (filters?.modalidade && filters.modalidade !== "todas") {
    query = query.contains("modalidades", [filters.modalidade]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getPsicanalistas] error:", error);
    return [];
  }

  return (data ?? []) as {
    id: string;
    nome: string;
    bio: string | null;
    modalidades: string[];
    valor_simbolico: string | null;
  }[];
}