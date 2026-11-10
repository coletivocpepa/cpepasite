import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import AdminBlogContent from "./AdminBlogContent";

export default async function AdminBlogPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? "");

  let postsQuery = supabase
    .from("posts")
    .select("id, slug, titulo, status, publicado_em, categorias ( nome )")
    .order("criado_em", { ascending: false });

  if (!isAdmin && user) {
    postsQuery = postsQuery.eq("autor_id", user.id);
  }

  const [{ data: posts }, { data: categorias }] = await Promise.all([
    postsQuery,
    supabase.from("categorias").select("id, slug, nome").order("nome"),
  ]);

  const rows = (posts ?? []).map((p) => {
    const cat = Array.isArray(p.categorias) ? p.categorias[0] : p.categorias;
    return {
      id: p.id,
      slug: p.slug,
      titulo: p.titulo,
      status: p.status,
      publicado_em: p.publicado_em,
      categoria: cat?.nome ?? null,
    };
  });

  const catRows = (categorias ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    nome: c.nome,
    total: rows.filter((r) => r.categoria === c.nome).length,
  }));

  return <AdminBlogContent posts={rows} categorias={catRows} isAdmin={isAdmin} />;
}
