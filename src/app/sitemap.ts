import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("slug, publicado_em, atualizado_em")
    .eq("status", "publicado")
    .lte("publicado_em", new Date().toISOString())
    .order("publicado_em", { ascending: false });

  const postsEntries: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.atualizado_em
      ? new Date(post.atualizado_em)
      : post.publicado_em
        ? new Date(post.publicado_em)
        : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/ebook`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/psicanalistas`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...postsEntries,
  ];
}
