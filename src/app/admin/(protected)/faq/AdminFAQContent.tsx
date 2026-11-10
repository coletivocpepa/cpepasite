"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FAQ {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string | null;
  ordem: number;
  ativo: boolean;
  criado_em: string;
}

const EMPTY_FORM = {
  pergunta: "",
  resposta: "",
  categoria: "",
  ordem: 0,
  ativo: true,
};

export default function AdminFAQContent({
  faqs: initialFaqs,
}: {
  faqs: FAQ[];
}) {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
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

  function startEdit(f: FAQ) {
    setFormData({
      pergunta: f.pergunta,
      resposta: f.resposta,
      categoria: f.categoria || "",
      ordem: f.ordem,
      ativo: f.ativo,
    });
    setEditingId(f.id);
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
      pergunta: formData.pergunta,
      resposta: formData.resposta,
      categoria: formData.categoria || null,
      ordem: formData.ordem,
      ativo: formData.ativo,
    };

    const { error: err } = editingId
      ? await supabase.from("faq").update(payload).eq("id", editingId)
      : await supabase.from("faq").insert(payload);

    if (err) {
      setError(err.message);
      setIsLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("faq")
      .select("*")
      .order("ordem", { ascending: true });

    if (!fetchError && data) {
      setFaqs(data as FAQ[]);
    }

    cancelForm();
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta pergunta?")) return;
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.from("faq").delete().eq("id", id);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setIsLoading(false);
  }

  return (
    <div className="container-site mx-auto px-4 max-w-4xl py-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Gerenciamento de FAQ
          </h1>
          <p className="mt-2 text-brand-900/80">
            Perguntas frequentes exibidas no site.
          </p>
        </div>
        <button onClick={openNewForm} className="btn-primary">
          + Nova pergunta
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
            {editingId ? "Editar pergunta" : "Nova pergunta"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="pergunta" className="label">
                Pergunta
              </label>
              <input
                id="pergunta"
                value={formData.pergunta}
                onChange={(e) => setFormData({ ...formData, pergunta: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="resposta" className="label">
                Resposta
              </label>
              <textarea
                id="resposta"
                rows={5}
                value={formData.resposta}
                onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
                className="input resize-y"
                required
              />
            </div>

            <div>
              <label htmlFor="categoria" className="label">
                Categoria
              </label>
              <input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="input"
                placeholder="Ex: Geral, Processo, Valores"
              />
            </div>

            <div>
              <label htmlFor="ordem" className="label">
                Ordem de exibição
              </label>
              <input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: Number(e.target.value) })}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="ativo" className="label">
                Ativo
              </label>
              <select
                id="ativo"
                value={formData.ativo.toString()}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.value === "true" })}
                className="input"
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
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
                Pergunta
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Ordem
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {faqs.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-brand-700/70" colSpan={5}>
                  Nenhuma pergunta cadastrada. Clique em &ldquo;Nova pergunta&rdquo; para começar.
                </td>
              </tr>
            ) : (
              faqs.map((f) => (
                <tr key={f.id} className="hover:bg-brand-50">
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-brand-950 line-clamp-1">{f.pergunta}</p>
                    <p className="text-xs text-brand-700/70 line-clamp-1">{f.resposta}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-700/70">{f.categoria || "—"}</td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">{f.ordem}</td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " +
                        (f.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")
                      }
                    >
                      {f.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(f)}
                        className="text-sm text-brand-700 hover:text-brand-950"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
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