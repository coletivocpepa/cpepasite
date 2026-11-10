import { Metadata } from "next";
import { getPsicanalistas } from "./PsicanalistasList";
import PsicanalistasListClient from "./PsicanalistasListClient";

export const metadata: Metadata = {
  title: "Psicanalistas — CPEPA",
  description: "Encontre psicanalistas do CPEPA disponíveis para escuta online ou presencial.",
};

export default async function PsicanalistasPage({
  searchParams,
}: {
  searchParams: Promise<{ modalidade?: string; cidade?: string }>;
}) {
  const { modalidade, cidade } = await searchParams;
  const psicanalistas = await getPsicanalistas({ modalidade, cidade });
  return <PsicanalistasListClient initialPsicanalistas={psicanalistas} modalidade={modalidade} cidade={cidade} />;
}