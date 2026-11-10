"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Modalidade, StatusSolicitacao } from "@/lib/supabase/database.types";

const DIAS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const STATUS_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
] as const;

const STATUS_CLASSES: Record<StatusSolicitacao, string> = {
  aberta: "bg-green-100 text-green-800",
  em_andamento: "bg-yellow-100 text-yellow-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-gray-100 text-gray-800",
};

interface Responsavel {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cidade_uf: string | null;
  relacao: string;
}

export interface Solicitacao {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: Modalidade;
  mensagem: string | null;
  status: StatusSolicitacao;
  created_at: string;
  responsavel: Responsavel;
}

interface AdminSolicitacoesContentProps {
  solicitacoes: Solicitacao[];
  count: number;
  currentPage: number;
  perPage: number;
  currentStatus: string;
}

function formatHora(h: string) {
  return h.slice(0, 5);
}

export default function AdminSolicitacoesContent({
  solicitacoes,
  count,
  currentPage,
  perPage,
  currentStatus,
}: AdminSolicitacoesContentProps) {
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  const totalPages = Math.ceil(count / perPage);

  function goToPage(page: number) {
    window.location.href = `/admin/solicitacoes?status=${statusFilter}&page=${page}`;
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    window.location.href = `/admin/solicitacoes?status=${newStatus}&page=1`;
  }

  async function handleStatusChangeAction(solicitacaoId: string, newStatus: StatusSolicitacao) {
    const supabase = createClient();
    const { error } = await supabase
      .from("solicitacoes")
      .update({ status: newStatus })
      .eq("id", solicitacaoId);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
      return;
    }

    window.location.reload();
  }

  async function handleDelete(solicitacaoId: string) {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta solicitação? As indicações vinculadas também serão excluídas. Essa ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("solicitacoes")
      .delete()
      .eq("id", solicitacaoId);

    if (error) {
      alert("Erro ao excluir solicitação: " + error.message);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="container-site mx-auto px-4 max-w-7xl py-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Gerenciamento de Solicitações
          </h1>
          <p className="mt-2 text-brand-900/80">
            Total: {count} solicitação{count !== 1 ? "s" : ""}
          </p>
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

      <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Responsável
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Dia / Horário
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Modalidade
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Data
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {solicitacoes.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-brand-700/70" colSpan={6}>
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            ) : (
              solicitacoes.map((s) => (
                <tr key={s.id} className="hover:bg-brand-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-brand-950">{s.responsavel.nome}</p>
                      <p className="text-xs text-brand-700/70">{s.responsavel.email}</p>
                      <p className="text-xs text-brand-700/70">
                        {s.responsavel.telefone} · {s.responsavel.cidade_uf}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">
                    {DIAS.find((d) => d.value === s.dia_semana)?.label} ·{" "}
                    {formatHora(s.hora_inicio)} – {formatHora(s.hora_fim)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs " +
                        (s.modalidade === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800")
                      }
                    >
                      {s.modalidade === "online" ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Online
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H6a1 1 0 01-1-1v-5a1 1 0 011-1h2a1 1 0 011 1v5z" /></svg>
                          Presencial
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={s.status}
                      onChange={(e) =>
                        handleStatusChangeAction(s.id, e.target.value as StatusSolicitacao)
                      }
                      className={
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " +
                        STATUS_CLASSES[s.status]
                      }
                    >
                      <option value="aberta">Aberta</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">
                    {new Date(s.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          handleStatusChangeAction(
                            s.id,
                            s.status === "aberta" ? "em_andamento" : "aberta",
                          )
                        }
                        className="text-sm text-brand-700 hover:text-brand-950"
                      >
                        {s.status === "aberta" ? "Iniciar" : "Reabrir"}
                      </button>
                      <button
                        onClick={() => handleStatusChangeAction(s.id, "concluida")}
                        className="text-sm text-green-700 hover:text-green-950"
                      >
                        Concluir
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
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