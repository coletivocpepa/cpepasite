"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const DIAS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const MODALIDADES = [
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
] as const;

type Disponibilidade = {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: "online" | "presencial";
  status: "disponivel" | "reservada" | "em_pausa";
};

interface PainelContentProps {
  psicanalista: {
    id: string;
    nome: string;
    ativo: boolean;
  };
  disponibilidades: Disponibilidade[];
}

export default function PainelContent({
  psicanalista,
  disponibilidades: initialDisponibilidades,
}: PainelContentProps) {
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>(initialDisponibilidades);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dia_semana: 1,
    hora_inicio: "09:00",
    hora_fim: "10:00",
    modalidade: "online" as "online" | "presencial",
    status: "disponivel" as "disponivel" | "reservada" | "em_pausa",
  });

  const supabase = createClient();
  const psicanalistaId = psicanalista.id;

  function resetForm() {
    setFormData({
      dia_semana: 1,
      hora_inicio: "09:00",
      hora_fim: "10:00",
      modalidade: "online",
      status: "disponivel",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(d: Disponibilidade) {
    setFormData({
      dia_semana: d.dia_semana,
      hora_inicio: d.hora_inicio.slice(0, 5),
      hora_fim: d.hora_fim.slice(0, 5),
      modalidade: d.modalidade,
      status: d.status,
    });
    setEditingId(d.id);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const payload = {
      dia_semana: formData.dia_semana,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim,
      modalidade: formData.modalidade,
      status: formData.status,
    };

    let error: Error | null = null;

    if (editingId) {
      const { error: err } = await supabase
        .from("disponibilidades")
        .update(payload)
        .eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("disponibilidades")
        .insert({ ...payload, psicanalista_id: psicanalistaId });
      error = err;
    }

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // Refresh list
    const { data, error: fetchError } = await supabase
      .from("disponibilidades")
      .select("*")
      .eq("psicanalista_id", psicanalistaId)
      .order("dia_semana", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (!fetchError && data) {
      setDisponibilidades(data as Disponibilidade[]);
    }

    resetForm();
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta disponibilidade?")) return;
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.from("disponibilidades").delete().eq("id", id);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setDisponibilidades((prev) => prev.filter((d) => d.id !== id));
    setIsLoading(false);
  }

  return (
    <section className="py-10">
      <div className="container-site mx-auto px-4 max-w-4xl">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-brand-950">
              Painel do Psicanalista
            </h1>
            <p className="mt-2 text-brand-900/80">
              Gerencie suas disponibilidades para escuta
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + Nova disponibilidade
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

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-serif text-xl font-semibold text-brand-950">
              {editingId ? "Editar disponibilidade" : "Nova disponibilidade"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dia_semana" className="label">
                  Dia da semana
                </label>
                <select
                  id="dia_semana"
                  value={formData.dia_semana}
                  onChange={(e) => setFormData({ ...formData, dia_semana: Number(e.target.value) })}
                  className="input"
                >
                  {DIAS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modalidade" className="label">
                  Modalidade
                </label>
                <select
                  id="modalidade"
                  value={formData.modalidade}
                  onChange={(e) => setFormData({ ...formData, modalidade: e.target.value as "online" | "presencial" })}
                  className="input"
                >
                  {MODALIDADES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hora_inicio" className="label">
                  Horário de início
                </label>
                <input
                  id="hora_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="hora_fim" className="label">
                  Horário de término
                </label>
                <input
                  id="hora_fim"
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="status" className="label">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "disponivel" | "reservada" | "em_pausa" })}
                  className="input"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="reservada">Reservada</option>
                  <option value="em_pausa">Em pausa</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? "Salvando…" : editingId ? "Atualizar" : "Criar"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
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
                  Dia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                  Horário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                  Modalidade
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
              {disponibilidades.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-brand-700/70" colSpan={5}>
                    Nenhuma disponibilidade cadastrada. Clique em &ldquo;Nova disponibilidade&rdquo; para começar.
                  </td>
                </tr>
              ) : (
                disponibilidades.map((d) => (
                  <tr key={d.id} className="hover:bg-brand-50">
                    <td className="px-4 py-4 text-sm text-brand-950">
                      {DIAS.find((x) => x.value === d.dia_semana)?.label}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-900/80">
                      {d.hora_inicio.slice(0, 5)} – {d.hora_fim.slice(0, 5)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs">
                        {d.modalidade === "online" ? (
                          <>
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span></span>
                            Online
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5a1 1 0 011-1h2a1 1 0 011 1v5z" /></svg>
                            Presencial
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          d.status === "disponivel"
                            ? "bg-green-100 text-green-800"
                            : d.status === "reservada"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {d.status === "disponivel" ? "Disponível" : d.status === "reservada" ? "Reservada" : "Em pausa"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(d)}
                          className="text-sm text-brand-700 hover:text-brand-950"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={isLoading}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
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
    </section>
  );
}