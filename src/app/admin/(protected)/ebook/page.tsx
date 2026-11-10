import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminEbookContent from "./AdminEbookContent";

export const dynamic = "force-dynamic";

export default async function AdminEbookPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const perPage = 50;
  const currentQuery = (q ?? "").trim();

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("ebook_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * perPage, currentPage * perPage - 1);

  if (currentQuery) {
    const digitos = currentQuery.replace(/\D/g, "");
    const termo = currentQuery.replace(/[,()%]/g, " ").trim();
    const filtros: string[] = [];

    if (termo) filtros.push(`nome.ilike.%${termo}%`);
    if (digitos) filtros.push(`whatsapp.ilike.%${digitos}%`);

    if (filtros.length > 0) {
      query = query.or(filtros.join(","));
    }
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[AdminEbookPage] error:", error);
  }

  return (
    <AdminEbookContent
      leads={data ?? []}
      count={count ?? 0}
      currentPage={currentPage}
      perPage={perPage}
      currentQuery={currentQuery}
    />
  );
}
