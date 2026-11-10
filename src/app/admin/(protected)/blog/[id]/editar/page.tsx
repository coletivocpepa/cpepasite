import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import BlogPostForm from "../../BlogPostForm";

export default async function EditarPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  const [{ data: post }, { data: categorias }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("categorias").select("id, slug, nome").order("nome"),
  ]);

  if (!post) notFound();

  return (
    <BlogPostForm
      categorias={categorias ?? []}
      isAdmin={isAdmin}
      initial={{
        id: post.id,
        slug: post.slug,
        titulo: post.titulo,
        resumo: post.resumo ?? "",
        conteudo_html: post.conteudo_html,
        capa_url: post.capa_url ?? "",
        categoria_id: post.categoria_id ?? "",
        tags: (post.tags ?? []).join(", "),
        status: post.status,
        autor: post.autor ?? "",
      }}
    />
  );
}
