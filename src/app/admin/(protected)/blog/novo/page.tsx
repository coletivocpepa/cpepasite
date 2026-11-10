import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import BlogPostForm from "../BlogPostForm";

export default async function NovoPostPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, slug, nome")
    .order("nome");

  return (
    <BlogPostForm
      categorias={categorias ?? []}
      isAdmin={isAdmin}
    />
  );
}
