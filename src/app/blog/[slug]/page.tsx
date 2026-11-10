import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import { SITE_URL } from "@/lib/site-url";
import {
  getPostBySlug,
  formatarDataPublicacao,
  getPostsPublicados,
} from "../posts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function podeVerRascunho(autorId: string | null): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email ?? "")) return true;
  return autorId != null && autorId === user.id;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "publicado") {
    return { title: "Texto não encontrado" };
  }

  return {
    title: post.titulo,
    description: post.resumo ?? undefined,
    openGraph: {
      title: post.titulo,
      description: post.resumo ?? undefined,
      type: "article",
      publishedTime: post.publicado_em ?? undefined,
      images: post.capa_url ? [{ url: post.capa_url }] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const ehRascunho = post.status !== "publicado";
  if (ehRascunho && !(await podeVerRascunho(post.autor_id))) {
    notFound();
  }

  const relacionados = (await getPostsPublicados())
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.resumo ?? undefined,
    image: post.capa_url ?? undefined,
    datePublished: post.publicado_em ?? undefined,
    dateModified: post.atualizado_em ?? undefined,
    author: {
      "@type": "Organization",
      name: post.autor || "CPEPA",
    },
    publisher: {
      "@type": "Organization",
      name: "CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
  };

  return (
    <article className="section-padding">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-site max-w-3xl">
        <Link
          href="/blog"
          className="text-sm font-medium text-brand-700 hover:text-brand-950"
        >
          &larr; Voltar ao blog
        </Link>

        {ehRascunho && (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Pré-visualização de rascunho — este texto ainda não está publicado.
          </p>
        )}

        <header className="mt-6">
          {post.categoria && <p className="eyebrow">{post.categoria.nome}</p>}
          <h1 className="mt-3 font-serif text-3xl leading-tight font-semibold text-brand-950 sm:text-4xl">
            {post.titulo}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 text-sm text-brand-700/70">
            {post.autor && <span>{post.autor}</span>}
            {post.autor && post.publicado_em && <span aria-hidden="true">·</span>}
            {post.publicado_em && (
              <time dateTime={post.publicado_em}>
                {formatarDataPublicacao(post.publicado_em)}
              </time>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-0.5 text-xs text-brand-900/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.capa_url && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
            <Image
              src={post.capa_url}
              alt={post.titulo}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover"
            />
          </div>
        )}

        <div
          className="blog-conteudo mt-10"
          dangerouslySetInnerHTML={{ __html: post.conteudo_html }}
        />
      </div>

      {relacionados.length > 0 && (
        <div className="container-site mt-20 max-w-3xl border-t border-brand-100 pt-12">
          <h2 className="font-serif text-2xl font-semibold text-brand-950">
            Continue lendo
          </h2>
          <ul className="mt-6 space-y-4">
            {relacionados.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="font-medium text-brand-800 hover:text-brand-600"
                >
                  {p.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
