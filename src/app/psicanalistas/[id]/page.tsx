import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import PsicanalistaProfile from "./PsicanalistaProfile";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("psicanalistas")
    .select("nome")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (!data) return { title: "Psicanalista não encontrado" };

  return {
    title: `${data.nome} — Psicanalista CPEPA`,
    description: `Perfil do psicanalista ${data.nome} do CPEPA.`,
  };
}

export default async function PsicanalistaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("psicanalistas")
    .select("id, nome, bio, modalidades, valor_simbolico, formacao")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (error || !data) {
    notFound();
  }

  // TypeScript doesn't narrow after notFound(), so we assert
  const psicanalista = data as NonNullable<typeof data>;

  return <PsicanalistaProfile psicanalista={psicanalista} />;
}