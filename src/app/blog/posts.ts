import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export interface PostCard {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  capa_url: string | null;
  tags: string[];
  publicado_em: string | null;
  categoria: { slug: string; nome: string } | null;
}

const POST_CARD_SELECT =
  "id, slug, titulo, resumo, capa_url, tags, publicado_em, categorias ( slug, nome )";

interface RawPostCard {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  capa_url: string | null;
  tags: string[] | null;
  publicado_em: string | null;
  categorias: { slug: string; nome: string } | { slug: string; nome: string }[] | null;
}

function normalizeCategoria(
  categorias: RawPostCard["categorias"],
): { slug: string; nome: string } | null {
  if (!categorias) return null;
  const value = Array.isArray(categorias) ? categorias[0] : categorias;
  return value ?? null;
}

function toPostCard(row: RawPostCard): PostCard {
  return {
    id: row.id,
    slug: row.slug,
    titulo: row.titulo,
    resumo: row.resumo,
    capa_url: row.capa_url,
    tags: row.tags ?? [],
    publicado_em: row.publicado_em,
    categoria: normalizeCategoria(row.categorias),
  };
}

export async function getPostsPublicados(filters?: {
  categoria?: string;
  q?: string;
}): Promise<PostCard[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("status", "publicado")
    .lte("publicado_em", new Date().toISOString())
    .order("publicado_em", { ascending: false });

  if (filters?.categoria) {
    query = query.eq("categorias.slug", filters.categoria);
  }

  if (filters?.q) {
    const termo = filters.q.replace(/[%,()]/g, " ").trim();
    if (termo) {
      query = query.or(
        `titulo.ilike.%${termo}%,resumo.ilike.%${termo}%`,
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getPostsPublicados] error:", error);
    return [];
  }

  return ((data ?? []) as RawPostCard[]).map(toPostCard);
}

export async function getPostBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, titulo, resumo, conteudo_html, capa_url, tags, status, autor, autor_id, publicado_em, atualizado_em, categorias ( slug, nome )",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    tags: data.tags ?? [],
    categoria: normalizeCategoria(data.categorias),
  };
}

export async function getCategoriasComPosts(): Promise<
  { slug: string; nome: string }[]
> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("categorias")
    .select("slug, nome")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[getCategoriasComPosts] error:", error);
    return [];
  }

  return data ?? [];
}

export function formatarDataPublicacao(data: string | null): string {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
