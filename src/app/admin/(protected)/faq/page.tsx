import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import AdminFAQContent from "./AdminFAQContent";

export default async function AdminFAQPage() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("faq")
    .select("*")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("[AdminFAQPage] error:", error);
  }

  return <AdminFAQContent faqs={data ?? []} />;
}