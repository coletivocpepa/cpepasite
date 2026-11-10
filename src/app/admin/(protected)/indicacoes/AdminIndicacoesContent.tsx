"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Modalidade, StatusIndicacao } from "@/lib/supabase/database.types";

const STATUS_OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendente" },
  { value: "aceita", label: "Aceita" },
  { value: "recusada", label: "Recusada" },
  { value: "realizada", label: "Realizada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const STATUS_CLASSES: Record<StatusIndicacao, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  aceita: "bg-green-100 text-green-800",
  recusada: "bg-red-100 text-red-800",
  realizada: "bg-green-100 text-green-800",
  cancelada: "bg-gray-100 text-gray-800",
};

interface Responsavel {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
}

interface Psicanalista {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  bio: string | null;
  modalidades: Modalidade[];
  valor_simbolico: string | null;
}

interface SolicitacaoIndicacao {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: Modalidade;
  responsavel: Responsavel;
}

interface Disponibilidade {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: Modalidade;
}

export interface Indicacao {
  id: string;
  status: StatusIndicacao;
  alternativa: boolean;
  created_at: string;
  notificado_psicanalista_at: string | null;
  notificado_responsavel_at: string | null;
  solicitacao: SolicitacaoIndicacao;
  psicanalista: Psicanalista;
  disponibilidade: Disponibilidade;
}

interface AdminIndicacoesContentProps {
  indicacoes: Indicacao[];
  count: number;
  currentPage: number;
  perPage: number;
  currentStatus: string;
}

function formatHora(h: string) {
  return h.slice(0, 5);
}

export default function AdminIndicacoesContent({
  indicacoes,
  count,
  currentPage,
  perPage,
  currentStatus,
}: AdminIndicacoesContentProps) {
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  const totalPages = Math.ceil(count / perPage);

  function goToPage(page: number) {
    window.location.href = `/admin/indicacoes?status=${statusFilter}&page=${page}`;
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    window.location.href = `/admin/indicacoes?status=${newStatus}&page=1`;
  }

  async function handleStatusChangeAction(indicacaoId: string, newStatus: StatusIndicacao) {
    const supabase = createClient();
    const { error } = await supabase
      .from("indicacoes")
      .update({ status: newStatus })
      .eq("id", indicacaoId);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="container-site mx-auto px-4 max-w-7xl py-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Gerenciamento de Indicações
          </h1>
          <p className="mt-2 text-brand-900/80">
            Total: {count} indicação{count !== 1 ? "s" : ""}
          </p>
        </div>
        <select value={statusFilter} onChange={handleStatusChange} className="input w-auto sm:w-48">
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
                Psicanalista
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
                Criada em
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-brand-700/70 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {indicacoes.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-brand-700/70" colSpan={7}>
                  Nenhuma indicação encontrada.
                </td>
              </tr>
            ) : (
              indicacoes.map((ind) => (
                <tr key={ind.id} className="hover:bg-brand-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-brand-950">
                        {ind.solicitacao.responsavel.nome}
                      </p>
                      <p className="text-xs text-brand-700/70">{ind.solicitacao.responsavel.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-brand-950">{ind.psicanalista.nome}</p>
                    <p className="text-xs text-brand-700/70">{ind.psicanalista.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">
                    <div className="flex items-center gap-2">
                      <span>
                        {DIAS[ind.disponibilidade.dia_semana]} ·{" "}
                        {formatHora(ind.disponibilidade.hora_inicio)} –{" "}
                        {formatHora(ind.disponibilidade.hora_fim)}
                      </span>
                      {ind.alternativa && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Alternativa
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs " +
                        (ind.disponibilidade.modalidade === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800")
                      }
                    >
                      {ind.disponibilidade.modalidade === "online" ? (
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
                      value={ind.status}
                      onChange={(e) =>
                        handleStatusChangeAction(ind.id, e.target.value as StatusIndicacao)
                      }
                      className={
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium " +
                        STATUS_CLASSES[ind.status]
                      }
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aceita">Aceita</option>
                      <option value="recusada">Recusada</option>
                      <option value="realizada">Realizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-brand-900/80">
                    {new Date(ind.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStatusChangeAction(ind.id, "aceita")}
                        className="text-sm text-green-700 hover:text-green-950"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleStatusChangeAction(ind.id, "recusada")}
                        className="text-sm text-red-700 hover:text-red-950"
                      >
                        Recusar
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