"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Modalidade } from "@/lib/supabase/database.types";

const STATUS_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
] as const;

const DIAS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const MODALIDADES: ReadonlyArray<{ value: Modalidade; label: string }> = [
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
];

export interface Psicanalista {
  id: string;
  user_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  formacao: string | null;
  bio: string | null;
  modalidades: Modalidade[];
  valor_simbolico: string | null;
  ativo: boolean;
  acesso_blog: boolean;
  deve_trocar_senha: boolean;
  created_at: string;
}

export interface Disponibilidade {
  id: string;
  psicanalista_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: Modalidade;
  status: "disponivel" | "reservada" | "em_pausa";
}

type DisponibilidadeSlot = {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: Modalidade;
};

interface PsicanalistaFormData {
  nome: string;
  email: string;
  telefone: string;
  formacao: string;
  bio: string;
  modalidades: Modalidade[];
  valor_simbolico: string;
  ativo: boolean;
  disponibilidades: DisponibilidadeSlot[];
}

const EMPTY_SLOT: DisponibilidadeSlot = {
  dia_semana: 1,
  hora_inicio: "09:00",
  hora_fim: "10:00",
  modalidade: "online",
};

const EMPTY_FORM: PsicanalistaFormData = {
  nome: "",
  email: "",
  telefone: "",
  formacao: "",
  bio: "",
  modalidades: ["online", "presencial"],
  valor_simbolico: "",
  ativo: true,
  disponibilidades: [],
};

interface AdminPsicanalistasContentProps {
  psicanalistas: Psicanalista[];
  disponibilidades: Disponibilidade[];
  count: number;
  currentPage: number;
  perPage: number;
  currentStatus: string;
}

function formatData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminPsicanalistasContent({
  psicanalistas,
  disponibilidades: allDisponibilidades,
  count,
  currentPage,
  perPage,
  currentStatus,
}: AdminPsicanalistasContentProps) {
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PsicanalistaFormData>(EMPTY_FORM);

  const supabase = createClient();

  const totalPages = Math.ceil(count / perPage);

  function openNewForm() {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(true);
    setError(null);
  }

  function startEdit(p: Psicanalista) {
    setFormData({
      nome: p.nome,
      email: p.email || "",
      telefone: p.telefone || "",
      formacao: p.formacao || "",
      bio: p.bio || "",
      modalidades: p.modalidades || ["online", "presencial"],
      valor_simbolico: p.valor_simbolico || "",
      ativo: p.ativo,
      disponibilidades: allDisponibilidades
        .filter((d) => d.psicanalista_id === p.id)
        .map((d) => ({
          dia_semana: d.dia_semana,
          hora_inicio: d.hora_inicio.slice(0, 5),
          hora_fim: d.hora_fim.slice(0, 5),
          modalidade: d.modalidade,
        })),
    });
    setEditingId(p.id);
    setIsFormOpen(true);
    setError(null);
  }

  function cancelForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError(null);
  }

  function addSlot() {
    setFormData((prev) => ({
      ...prev,
      disponibilidades: [...prev.disponibilidades, { ...EMPTY_SLOT }],
    }));
  }

  function removeSlot(index: number) {
    setFormData((prev) => ({
      ...prev,
      disponibilidades: prev.disponibilidades.filter((_, i) => i !== index),
    }));
  }

  function updateSlot(index: number, patch: Partial<DisponibilidadeSlot>) {
    setFormData((prev) => ({
      ...prev,
      disponibilidades: prev.disponibilidades.map((s, i) =>
        i === index ? { ...s, ...patch } : s
      ),
    }));
  }

  function agendaCount(p: Psicanalista) {
    return allDisponibilidades.filter((d) => d.psicanalista_id === p.id).length;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const slots = formData.disponibilidades;
    const invalidSlot = slots.find(
      (s) => !s.hora_inicio || !s.hora_fim || s.hora_fim <= s.hora_inicio
    );

    if (invalidSlot) {
      setError("Cada horário deve ter término posterior ao início.");
      setIsLoading(false);
      return;
    }

    const payload = {
      nome: formData.nome,
      email: formData.email || null,
      telefone: formData.telefone || null,
      formacao: formData.formacao || null,
      bio: formData.bio || null,
      modalidades: formData.modalidades,
      valor_simbolico: formData.valor_simbolico || null,
      ativo: formData.ativo,
    };

    let psicanalistaId: string | null = editingId;

    if (editingId) {
      const { error: err } = await supabase
        .from("psicanalistas")
        .update(payload)
        .eq("id", editingId);

      if (err) {
        setError(err.message);
        setIsLoading(false);
        return;
      }

      const { error: deleteErr } = await supabase
        .from("disponibilidades")
        .delete()
        .eq("psicanalista_id", editingId);

      if (deleteErr) {
        setError(deleteErr.message);
        setIsLoading(false);
        return;
      }
    } else {
      const { data, error: err } = await supabase
        .from("psicanalistas")
        .insert(payload)
        .select("id")
        .single();

      if (err) {
        setError(err.message);
        setIsLoading(false);
        return;
      }

      psicanalistaId = data?.id ?? null;
    }

    if (psicanalistaId && slots.length > 0) {
      const pid = psicanalistaId;
      const { error: err } = await supabase.from("disponibilidades").insert(
        slots.map((s) => ({
          psicanalista_id: pid,
          dia_semana: s.dia_semana,
          hora_inicio: s.hora_inicio,
          hora_fim: s.hora_fim,
          modalidade: s.modalidade,
          status: "disponivel" as const,
        }))
      );

      if (err) {
        setError(err.message);
        setIsLoading(false);
        return;
      }
    }

    window.location.reload();
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    const { error } = await supabase
      .from("psicanalistas")
      .update({ ativo: !ativo })
      .eq("id", id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    window.location.reload();
  }

  async function handleDelete(id: string, nome: string) {
    if (
      !confirm(
        `Tem certeza que deseja excluir o psicanalista "${nome}"? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase.from("psicanalistas").delete().eq("id", id);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    window.location.reload();
  }

  async function handleAcessoBlog(p: Psicanalista, acao: "criar" | "resetar") {
    if (!p.email) {
      setError("Este psicanalista não possui e-mail cadastrado.");
      return;
    }

    const mensagem =
      acao === "criar"
        ? `Criar acesso de blog para "${p.nome}" (${p.email})?\n\nA senha inicial será "123mudar" e deverá ser trocada no primeiro acesso.`
        : `Resetar a senha de "${p.nome}" para "123mudar"?\n\nO usuário deverá trocá-la no próximo acesso.`;

    if (!confirm(mensagem)) return;

    setIsLoading(true);
    setError(null);

    const { error: fnError } = await supabase.functions.invoke("criar-acesso-blog", {
      body: { psicanalista_id: p.id, acao },
    });

    if (fnError) {
      let detalhe = fnError.message;
      const ctx = (fnError as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const body = await ctx.clone().json();
          if (body?.codigo) detalhe = `${detalhe} (${body.codigo})`;
          if (body?.detalhe) detalhe = `${detalhe}: ${body.detalhe}`;
        } catch {
          // ignora corpo não-JSON
        }
      }
      setError(
        acao === "criar"
          ? "Erro ao criar acesso: " + detalhe
          : "Erro ao resetar senha: " + detalhe,
      );
      setIsLoading(false);
      return;
    }

    window.location.reload();
  }

  async function handleRevogarAcesso(p: Psicanalista) {
    if (
      !confirm(
        `Revogar o acesso de blog de "${p.nome}"?\n\nOs posts já publicados por ele permanecerão publicados.`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase
      .from("psicanalistas")
      .update({ acesso_blog: false })
      .eq("id", p.id);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    window.location.reload();
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    window.location.href = `/admin/psicanalistas?status=${newStatus}&page=1`;
  }

  function goToPage(page: number) {
    window.location.href = `/admin/psicanalistas?status=${statusFilter}&page=${page}`;
  }

  return (
    <div className="container-site mx-auto px-4 max-w-7xl py-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Gerenciamento de Psicanalistas
          </h1>
          <p className="mt-2 text-brand-900/80">Total: {count}</p>
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="input w-auto sm:w-48"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      <button onClick={openNewForm} className="btn-primary mb-6">
        + Novo psicanalista
      </button>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm space-y-5"
        >
          <h2 className="font-serif text-xl font-semibold text-brand-950">
            {editingId ? "Editar psicanalista" : "Novo psicanalista"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nome" className="label">
                Nome
              </label>
              <input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="telefone" className="label">
                Telefone
              </label>
              <input
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="valor_simbolico" className="label">
                Valor simbólico
              </label>
              <input
                id="valor_simbolico"
                value={formData.valor_simbolico}
                onChange={(e) => setFormData({ ...formData, valor_simbolico: e.target.value })}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="formacao" className="label">
                Formação
              </label>
              <input
                id="formacao"
                value={formData.formacao}
                onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bio" className="label">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input resize-y"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Modalidades</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.modalidades.includes("online")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        modalidades: e.target.checked
                          ? [...formData.modalidades, "online"]
                          : formData.modalidades.filter((m) => m !== "online"),
                      })
                    }
                    className="h-4 w-4 rounded border-brand-300 accent-brand-800"
                  />
                  Online
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.modalidades.includes("presencial")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        modalidades: e.target.checked
                          ? [...formData.modalidades, "presencial"]
                          : formData.modalidades.filter((m) => m !== "presencial"),
                      })
                    }
                    className="h-4 w-4 rounded border-brand-300 accent-brand-800"
                  />
                  Presencial
                </label>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Horários disponíveis</label>
              <div className="space-y-3">
                {formData.disponibilidades.length === 0 ? (
                  <p className="text-sm text-brand-700/70">
                    Nenhum horário cadastrado. Adicione os dias e horários
                    disponíveis para a escuta.
                  </p>
                ) : (
                  formData.disponibilidades.map((slot, i) => (
                    <div
                      key={i}
                      className="grid gap-3 sm:grid-cols-12 items-center rounded-lg border border-brand-100 bg-brand-50/50 p-3"
                    >
                      <div className="sm:col-span-3">
                        <select
                          aria-label={`Dia da semana ${i + 1}`}
                          value={slot.dia_semana}
                          onChange={(e) =>
                            updateSlot(i, { dia_semana: Number(e.target.value) })
                          }
                          className="input"
                        >
                          {DIAS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="time"
                          aria-label={`Horário de início ${i + 1}`}
                          value={slot.hora_inicio}
                          onChange={(e) =>
                            updateSlot(i, { hora_inicio: e.target.value })
                          }
                          className="input"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="time"
                          aria-label={`Horário de término ${i + 1}`}
                          value={slot.hora_fim}
                          onChange={(e) =>
                            updateSlot(i, { hora_fim: e.target.value })
                          }
                          className="input"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          aria-label={`Modalidade ${i + 1}`}
                          value={slot.modalidade}
                          onChange={(e) =>
                            updateSlot(i, { modalidade: e.target.value as Modalidade })
                          }
                          className="input"
                        >
                          {MODALIDADES.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeSlot(i)}
                          aria-label={`Remover horário ${i + 1}`}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={addSlot}
                  className="btn-secondary"
                >
                  + Adicionar horário
                </button>
              </div>
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
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                E-mail
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Modalidades
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Agenda
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Acesso blog
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Cadastro
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {psicanalistas.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-brand-700/70" colSpan={9}>
                  Nenhum psicanalista encontrado.
                </td>
              </tr>
            ) : (
              psicanalistas.map((p) => (
                <tr key={p.id} className="hover:bg-brand-50">
                  <td className="px-4 py-4 text-sm font-medium text-brand-950">{p.nome}</td>
                  <td className="px-4 py-4 text-sm text-brand-700/70">{p.email || "—"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(p.modalidades || []).map((m) => (
                        <span
                          key={m}
                          className={
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs " +
                            (m === "online"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800")
                          }
                        >
                          {m === "online" ? "Online" : "Presencial"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">{p.valor_simbolico || "—"}</td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">
                    {agendaCount(p) > 0 ? `${agendaCount(p)} horário(s)` : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " +
                        (p.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")
                      }
                      onClick={() => handleToggleAtivo(p.id, p.ativo)}
                      style={{ cursor: "pointer" }}
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {p.acesso_blog ? (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {p.deve_trocar_senha ? "Senha pendente" : "Habilitado"}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcessoBlog(p, "resetar")}
                              disabled={isLoading}
                              className="text-xs text-brand-700 hover:text-brand-950 disabled:opacity-50"
                            >
                              Resetar senha
                            </button>
                            <button
                              onClick={() => handleRevogarAcesso(p)}
                              disabled={isLoading}
                              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              Revogar
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAcessoBlog(p, "criar")}
                          disabled={isLoading || !p.email}
                          className="text-xs text-brand-700 hover:text-brand-950 disabled:opacity-50"
                        >
                          Criar acesso
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-700/70">{formatData(p.created_at)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="text-sm text-brand-700 hover:text-brand-950"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.nome)}
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 text-sm text-brand-700/80">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}