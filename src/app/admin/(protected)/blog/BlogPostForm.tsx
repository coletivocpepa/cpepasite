"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { salvarPost, type BlogActionState } from "./actions";
import { gerarSlug } from "./slug";
import BlogEditor from "./BlogEditor";

export interface CategoriaOption {
  id: string;
  slug: string;
  nome: string;
}

export interface PostFormData {
  id?: string;
  slug: string;
  titulo: string;
  resumo: string;
  conteudo_html: string;
  capa_url: string;
  categoria_id: string;
  tags: string;
  status: "rascunho" | "publicado";
  autor: string;
}

const EMPTY: PostFormData = {
  slug: "",
  titulo: "",
  resumo: "",
  conteudo_html: "",
  capa_url: "",
  categoria_id: "",
  tags: "",
  status: "rascunho",
  autor: "",
};

export default function BlogPostForm({
  categorias,
  initial,
  isAdmin = true,
}: {
  categorias: CategoriaOption[];
  initial?: PostFormData;
  isAdmin?: boolean;
}) {
  const [form, setForm] = useState<PostFormData>(initial ?? EMPTY);
  const [slugManual, setSlugManual] = useState(Boolean(initial?.slug));

  const [state, formAction, pending] = useActionState<BlogActionState, FormData>(
    salvarPost,
    { status: "idle" },
  );

  function set<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitulo(value: string) {
    setForm((prev) => ({
      ...prev,
      titulo: value,
      slug: slugManual ? prev.slug : gerarSlug(value),
    }));
  }

  return (
    <form action={formAction} className="container-site mx-auto max-w-4xl px-4 py-8">
      {form.id && <input type="hidden" name="id" value={form.id} />}
      <input type="hidden" name="conteudo_html" value={form.conteudo_html} />
      <input type="hidden" name="capa_url" value={form.capa_url} />
      <input type="hidden" name="slug" value={form.slug} />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            {form.id ? "Editar texto" : "Novo texto"}
          </h1>
          <p className="mt-1 text-brand-900/70">
            {form.status === "publicado"
              ? "Este texto está publicado."
              : "Este texto está como rascunho."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/blog" className="btn-secondary">
            Voltar
          </Link>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </header>

      {state.status === "error" && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {state.message}
        </div>
      )}
      {state.status === "success" && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          {state.message}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-brand-100 bg-white p-6">
        <div>
          <label htmlFor="titulo" className="label">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            value={form.titulo}
            onChange={(e) => handleTitulo(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="label">
            Slug (URL)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-700/70">/blog/</span>
            <input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                set("slug", gerarSlug(e.target.value));
              }}
              className="input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="resumo" className="label">
            Resumo
          </label>
          <textarea
            id="resumo"
            name="resumo"
            rows={3}
            value={form.resumo}
            onChange={(e) => set("resumo", e.target.value)}
            className="input resize-y"
            placeholder="Aparece na listagem do blog e nas prévias de compartilhamento."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="categoria_id" className="label">
              Categoria
            </label>
            <select
              id="categoria_id"
              name="categoria_id"
              value={form.categoria_id}
              onChange={(e) => set("categoria_id", e.target.value)}
              className="input"
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="autor" className="label">
              Autor
            </label>
            <input
              id="autor"
              name="autor"
              value={form.autor}
              onChange={(e) => set("autor", e.target.value)}
              className="input"
              placeholder="Ex: Coordenação CPEPA"
              disabled={!isAdmin}
            />
            {!isAdmin && (
              <p className="mt-1 text-xs text-brand-700/70">
                Publicado em seu nome.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="tags" className="label">
              Tags (separadas por vírgula)
            </label>
            <input
              id="tags"
              name="tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className="input"
              placeholder="autismo, escuta, família"
            />
          </div>

          <div>
            <label htmlFor="status" className="label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as PostFormData["status"])
              }
              className="input"
            >
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="capa_url_input" className="label">
            Imagem de capa (link)
          </label>
          <input
            id="capa_url_input"
            type="url"
            value={form.capa_url}
            onChange={(e) => set("capa_url", e.target.value)}
            className="input"
            placeholder="https://exemplo.com/imagem.jpg"
          />
          <p className="mt-1 text-xs text-brand-700/70">
            Cole o link direto de uma imagem da internet.
          </p>
          {form.capa_url && (
            <div className="relative mt-3 aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl border border-brand-100 bg-brand-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.capa_url}
                alt="Prévia da capa"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <span className="label">Conteúdo</span>
          <BlogEditor
            value={form.conteudo_html}
            onChange={(html) => set("conteudo_html", html)}
          />
        </div>
      </div>
    </form>
  );
}
