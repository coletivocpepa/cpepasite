"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  publicarPost,
  excluirPost,
  salvarCategoria,
  excluirCategoria,
} from "./actions";

interface PostRow {
  id: string;
  slug: string;
  titulo: string;
  status: "rascunho" | "publicado";
  publicado_em: string | null;
  categoria: string | null;
}

interface CategoriaRow {
  id: string;
  slug: string;
  nome: string;
  total: number;
}

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR");
}

export default function AdminBlogContent({
  posts: initialPosts,
  categorias: initialCategorias,
  isAdmin = true,
}: {
  posts: PostRow[];
  categorias: CategoriaRow[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [categorias, setCategorias] = useState(initialCategorias);
  const [error, setError] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingCat, setEditingCat] = useState<CategoriaRow | null>(null);
  const [catFormKey, setCatFormKey] = useState(0);

  function recarregar() {
    router.refresh();
  }

  function handleCatSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setCatError(null);
    startTransition(async () => {
      const res = await salvarCategoria({ status: "idle" }, formData);
      if (res.status === "error") {
        setCatError(res.message ?? "Erro ao salvar a categoria.");
        return;
      }
      setCategorias((prev) => {
        const nome = String(formData.get("nome") ?? "").trim();
        const slug = String(formData.get("slug") ?? "").trim();
        if (editingCat) {
          return prev.map((c) =>
            c.id === editingCat.id
              ? { ...c, nome, slug: slug || c.slug }
              : c,
          );
        }
        return [
          ...prev,
          { id: res.id ?? crypto.randomUUID(), nome, slug, total: 0 },
        ];
      });
      setEditingCat(null);
      setCatFormKey((k) => k + 1);
      router.refresh();
    });
  }

  function toggleStatus(post: PostRow) {
    const novo = post.status === "publicado" ? "rascunho" : "publicado";
    setError(null);
    startTransition(async () => {
      const res = await publicarPost(post.id, novo);
      if (res.status === "error") {
        setError(res.message ?? "Erro ao alterar status.");
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                status: novo,
                publicado_em:
                  novo === "publicado" ? new Date().toISOString() : null,
              }
            : p,
        ),
      );
    });
  }

  function remover(post: PostRow) {
    if (!confirm(`Excluir o texto "${post.titulo}"?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await excluirPost(post.id);
      if (res.status === "error") {
        setError(res.message ?? "Erro ao excluir.");
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    });
  }

  function removerCategoria(cat: CategoriaRow) {
    if (cat.total > 0) {
      alert(
        `Esta categoria possui ${cat.total} texto(s). Eles ficarão sem categoria.`,
      );
    }
    if (!confirm(`Excluir a categoria "${cat.nome}"?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await excluirCategoria(cat.id);
      if (res.status === "error") {
        setError(res.message ?? "Erro ao excluir categoria.");
        return;
      }
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id));
    });
  }

  return (
    <div className="container-site mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Blog
          </h1>
          <p className="mt-2 text-brand-900/80">
            {isAdmin
              ? "Gerencie os textos e as categorias do blog."
              : "Gerencie os seus textos do blog."}
          </p>
        </div>
        <Link href="/admin/blog/novo" className="btn-primary">
          + Novo texto
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {/* Categorias (somente admin) */}
      {isAdmin && (
      <section className="mb-10 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-serif text-xl font-semibold text-brand-950">
          Categorias
        </h2>

        <form
          key={catFormKey}
          onSubmit={handleCatSubmit}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          {editingCat && <input type="hidden" name="id" value={editingCat.id} />}
          <div className="flex-1">
            <label htmlFor="nome" className="label">
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              defaultValue={editingCat?.nome ?? ""}
              className="input"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="slug" className="label">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={editingCat?.slug ?? ""}
              className="input"
              placeholder="(automático)"
            />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary">
            {editingCat ? "Atualizar" : "Adicionar"}
          </button>
          {editingCat && (
            <button
              type="button"
              onClick={() => {
                setEditingCat(null);
                setCatFormKey((k) => k + 1);
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
          )}
        </form>

        {catError && (
          <p className="mt-3 text-sm text-red-600">{catError}</p>
        )}

        <ul className="mt-5 divide-y divide-brand-100">
          {categorias.length === 0 ? (
            <li className="py-4 text-sm text-brand-700/70">
              Nenhuma categoria cadastrada.
            </li>
          ) : (
            categorias.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-brand-950">
                    {c.nome}
                  </span>
                  <span className="ml-2 text-xs text-brand-700/70">
                    /blog?categoria={c.slug} · {c.total} texto(s)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(c);
                      setCatFormKey((k) => k + 1);
                    }}
                    className="text-sm text-brand-700 hover:text-brand-950"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removerCategoria(c)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
      )}

      {/* Posts */}
      <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
        <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
          <h2 className="font-serif text-xl font-semibold text-brand-950">
            Textos
          </h2>
          <button
            type="button"
            onClick={recarregar}
            className="text-sm text-brand-700 hover:text-brand-950"
          >
            Atualizar
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-brand-700/70 uppercase">
                Título
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-brand-700/70 uppercase">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-brand-700/70 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-brand-700/70 uppercase">
                Publicado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-brand-700/70 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {posts.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-12 text-center text-brand-700/70"
                  colSpan={5}
                >
                  Nenhum texto cadastrado. Clique em &ldquo;Novo texto&rdquo;.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-brand-50">
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-brand-950">
                      {post.titulo}
                    </p>
                    <p className="text-xs text-brand-700/70">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-700/70">
                    {post.categoria ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
                        (post.status === "publicado"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800")
                      }
                    >
                      {post.status === "publicado" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">
                    {formatarData(post.publicado_em)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === "publicado" && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-700 hover:text-brand-950"
                        >
                          Ver
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => toggleStatus(post)}
                        className="text-sm text-brand-700 hover:text-brand-950"
                      >
                        {post.status === "publicado" ? "Despublicar" : "Publicar"}
                      </button>
                      <Link
                        href={`/admin/blog/${post.id}/editar`}
                        className="text-sm text-brand-700 hover:text-brand-950"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => remover(post)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
