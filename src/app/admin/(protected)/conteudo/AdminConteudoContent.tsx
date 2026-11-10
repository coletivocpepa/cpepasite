"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type TipoConteudo = "texto" | "html" | "markdown";

export interface Conteudo {
  id: string;
  chave: string;
  titulo: string;
  conteudo: string;
  tipo: TipoConteudo;
  atualizado_em: string;
}

const TIPOS: { value: TipoConteudo; label: string }[] = [
  { value: "texto", label: "Texto simples" },
  { value: "html", label: "HTML" },
  { value: "markdown", label: "Markdown" },
];

const EMPTY_FORM = {
  chave: "",
  titulo: "",
  conteudo: "",
  tipo: "texto" as TipoConteudo,
};

function formatData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminConteudoContent({
  conteudos: initialConteudos,
}: {
  conteudos: Conteudo[];
}) {
  const [conteudos, setConteudos] = useState<Conteudo[]>(initialConteudos);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const supabase = createClient();

  function openNewForm() {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(true);
    setError(null);
  }

  function startEdit(c: Conteudo) {
    setFormData({
      chave: c.chave,
      titulo: c.titulo,
      conteudo: c.conteudo,
      tipo: c.tipo,
    });
    setEditingId(c.id);
    setIsFormOpen(true);
    setError(null);
  }

  function cancelForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const payload = {
      chave: formData.chave,
      titulo: formData.titulo,
      conteudo: formData.conteudo,
      tipo: formData.tipo,
    };

    const { error: err } = editingId
      ? await supabase.from("conteudo_site").update(payload).eq("id", editingId)
      : await supabase.from("conteudo_site").insert(payload);

    if (err) {
      setError(err.message);
      setIsLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("conteudo_site")
      .select("*")
      .order("chave", { ascending: true });

    if (!fetchError && data) {
      setConteudos(data as unknown as Conteudo[]);
    }

    cancelForm();
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.from("conteudo_site").delete().eq("id", id);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setConteudos((prev) => prev.filter((c) => c.id !== id));
    setIsLoading(false);
  }

  return (
    <div className="container-site mx-auto px-4 max-w-6xl py-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Gerenciamento de Conteúdo
          </h1>
          <p className="mt-2 text-brand-900/80">
            Edite os textos, títulos e conteúdo das páginas institucionais.
          </p>
        </div>
        <button onClick={openNewForm} className="btn-primary">
          + Novo conteúdo
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm space-y-5"
        >
          <h2 className="font-serif text-xl font-semibold text-brand-950">
            {editingId ? "Editar conteúdo" : "Novo conteúdo"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="chave" className="label">
                Chave (identificador único)
              </label>
              <input
                id="chave"
                value={formData.chave}
                onChange={(e) => setFormData({ ...formData, chave: e.target.value })}
                className="input"
                required
                disabled={editingId !== null}
                placeholder="ex: hero.titulo, sobre.missao"
              />
            </div>

            <div>
              <label htmlFor="tipo" className="label">
                Tipo de conteúdo
              </label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoConteudo })}
                className="input"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="titulo" className="label">
                Título
              </label>
              <input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="conteudo" className="label">
                Conteúdo
              </label>
              <textarea
                id="conteudo"
                rows={10}
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                className="input resize-y font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? "Salvando…" : editingId ? "Atualizar" : "Criar"}
            </button>
            <button type="button" onClick={cancelForm} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Chave
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Título
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Atualizado em
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {conteudos.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-brand-700/70" colSpan={5}>
                  Nenhum conteúdo cadastrado. Clique em &ldquo;Novo conteúdo&rdquo; para começar.
                </td>
              </tr>
            ) : (
              conteudos.map((c) => (
                <tr key={c.id} className="hover:bg-brand-50">
                  <td className="px-4 py-4 text-sm font-mono text-brand-950">{c.chave}</td>
                  <td className="px-4 py-4 text-sm text-brand-950">{c.titulo}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-700/70">{formatData(c.atualizado_em)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-sm text-brand-700 hover:text-brand-950"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
      </div>
    </div>
  );
}