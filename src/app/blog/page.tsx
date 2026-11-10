import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Decor from "@/components/Decor";
import {
  getCategoriasComPosts,
  getPostsPublicados,
  formatarDataPublicacao,
  type PostCard,
} from "./posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Reflexões sobre escuta psicanalítica, autismo e a experiência de ser mãe, pai ou responsável por uma pessoa autista.",
  openGraph: {
    title: "Blog — CPEPA",
    description:
      "Reflexões sobre escuta psicanalítica, autismo e a experiência de pais de autistas.",
    type: "website",
  },
};

export const revalidate = 300;

function PostCardItem({ post }: { post: PostCard }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {post.capa_url ? (
        <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9]">
          <Image
            src={post.capa_url}
            alt={post.titulo}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </Link>
      ) : (
        <Link
          href={`/blog/${post.slug}`}
          className="block aspect-[16/9] bg-gradient-to-br from-brand-100 to-brand-200"
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col p-6">
        {post.categoria && (
          <span className="eyebrow">{post.categoria.nome}</span>
        )}
        <h2 className="mt-2 font-serif text-xl font-semibold text-brand-950">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand-700">
            {post.titulo}
          </Link>
        </h2>
        {post.resumo && (
          <p className="mt-3 line-clamp-3 leading-relaxed text-brand-900/80">
            {post.resumo}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4 text-sm text-brand-700/70">
          <time dateTime={post.publicado_em ?? undefined}>
            {formatarDataPublicacao(post.publicado_em)}
          </time>
          <Link
            href={`/blog/${post.slug}`}
            className="font-medium text-brand-700 hover:text-brand-950"
          >
            Ler mais
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { categoria, q } = await searchParams;
  const [posts, categorias] = await Promise.all([
    getPostsPublicados({ categoria, q }),
    getCategoriasComPosts(),
  ]);

  return (
    <section className="relative section-padding">
      <Decor variant="section" />
      <div className="container-site relative">
        <header className="mb-12 max-w-3xl">
          <p className="eyebrow">Blog</p>
          <h1 className="section-title mt-3">
            Escuta, autismo e a experiência de ser{" "}
            <span className="text-accent">pai e mãe</span>
          </h1>
          <p className="section-lead mt-4">
            Textos do CPEPA sobre escuta psicanalítica, a experiência da parentalidade
            atípica e o cuidado de quem cuida.
          </p>
        </header>

        <form
          action="/blog"
          method="get"
          role="search"
          className="mb-8 flex max-w-xl gap-2"
        >
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
          <label htmlFor="q" className="sr-only">
            Buscar no blog
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Buscar por título ou resumo…"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary">
            Buscar
          </button>
        </form>

        {categorias.length > 0 && (
          <nav
            aria-label="Filtrar por categoria"
            className="mb-10 flex flex-wrap gap-2"
          >
            <Link
              href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"}
              className={
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                (!categoria
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-brand-200 text-brand-800 hover:border-brand-400 hover:bg-brand-50")
              }
            >
              Todas
            </Link>
            {categorias.map((c) => {
              const params = new URLSearchParams({ categoria: c.slug });
              if (q) params.set("q", q);
              return (
                <Link
                  key={c.slug}
                  href={`/blog?${params.toString()}`}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                    (categoria === c.slug
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-brand-200 text-brand-800 hover:border-brand-400 hover:bg-brand-50")
                  }
                >
                  {c.nome}
                </Link>
              );
            })}
          </nav>
        )}

        {posts.length === 0 ? (
          <p className="rounded-2xl border border-brand-100 bg-brand-50 px-6 py-16 text-center text-brand-900/70">
            {q
              ? `Nenhum texto encontrado para “${q}”.`
              : categoria
                ? "Nenhum texto publicado nesta categoria ainda."
                : "Nenhum texto publicado ainda. Volte em breve."}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCardItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
