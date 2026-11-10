"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface EbookLead {
  id: string;
  nome: string;
  whatsapp: string;
  lgpd_consent: boolean;
  lgpd_consent_at: string | null;
  origem: string;
  downloads: number;
  created_at: string;
  atualizado_em: string;
}

interface AdminEbookContentProps {
  leads: EbookLead[];
  count: number;
  currentPage: number;
  perPage: number;
  currentQuery: string;
}

function formatarWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, "");

  if (digitos.length === 13) {
    return `+${digitos.slice(0, 2)} (${digitos.slice(2, 4)}) ${digitos.slice(4, 9)}-${digitos.slice(9)}`;
  }

  if (digitos.length === 12) {
    return `+${digitos.slice(0, 2)} (${digitos.slice(2, 4)}) ${digitos.slice(4, 8)}-${digitos.slice(8)}`;
  }

  return valor;
}

function formatarData(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeCsv(valor: string) {
  return `"${(valor ?? "").replace(/"/g, '""')}"`;
}

export default function AdminEbookContent({
  leads,
  count,
  currentPage,
  perPage,
  currentQuery,
}: AdminEbookContentProps) {
  const [exporting, setExporting] = useState(false);
  const totalPages = Math.ceil(count / perPage);

  function buildHref(page: number) {
    const params = new URLSearchParams();
    if (currentQuery) params.set("q", currentQuery);
    params.set("page", String(page));
    return `/admin/ebook?${params.toString()}`;
  }

  async function handleDelete(id: string, nome: string) {
    if (
      !confirm(
        `Excluir o lead de ${nome}? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("ebook_leads").delete().eq("id", id);

    if (error) {
      alert("Erro ao excluir lead: " + error.message);
      return;
    }

    window.location.reload();
  }

  async function exportarCsv() {
    setExporting(true);

    try {
      const supabase = createClient();
      const pageSize = 1000;
      const rows: EbookLead[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from("ebook_leads")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        rows.push(...(data as EbookLead[]));
        if (data.length < pageSize) break;
        from += pageSize;
      }

      const header = [
        "Nome",
        "WhatsApp",
        "Consentimento LGPD",
        "Data do consentimento",
        "Downloads",
        "Criado em",
        "Atualizado em",
        "Origem",
      ];

      const lines = rows.map((lead) => [
        lead.nome,
        formatarWhatsapp(lead.whatsapp),
        lead.lgpd_consent ? "Sim" : "Não",
        formatarData(lead.lgpd_consent_at),
        String(lead.downloads),
        formatarData(lead.created_at),
        formatarData(lead.atualizado_em),
        lead.origem,
      ]);

      const csv = [header, ...lines]
        .map((cols) => cols.map(escapeCsv).join(";"))
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leads-ebook-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("[AdminEbookContent] export error:", error);
      alert("Não foi possível exportar o CSV.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="container-site mx-auto max-w-6xl px-4">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Leads do E-book
          </h1>
          <p className="mt-2 text-brand-900/80">
            {count} {count === 1 ? "contato captado" : "contatos captados"} na
            landing page do e-book.
          </p>
        </div>

        <button
          type="button"
          onClick={exportarCsv}
          disabled={exporting || count === 0}
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting ? "Exportando…" : "Exportar CSV"}
        </button>
      </header>

      <form
        action="/admin/ebook"
        method="get"
        role="search"
        className="mb-6 flex max-w-xl gap-2"
      >
        <label htmlFor="q" className="sr-only">
          Buscar leads por nome ou WhatsApp
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={currentQuery}
          placeholder="Buscar por nome ou WhatsApp…"
          className="input flex-1"
        />
        <button type="submit" className="btn-primary">
          Buscar
        </button>
      </form>

      {currentQuery && (
        <p className="mb-4 text-sm text-brand-700">
          Resultados para “{currentQuery}”.{" "}
          <Link href="/admin/ebook" className="font-medium underline">
            Limpar busca
          </Link>
        </p>
      )}

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-brand-100 bg-white px-6 py-16 text-center text-brand-900/70">
          {currentQuery
            ? "Nenhum lead encontrado para esta busca."
            : "Nenhum lead captado ainda."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-brand-100 bg-brand-50 text-xs tracking-wide text-brand-700 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">WhatsApp</th>
                  <th className="px-4 py-3 font-semibold">LGPD</th>
                  <th className="px-4 py-3 font-semibold">Downloads</th>
                  <th className="px-4 py-3 font-semibold">Criado em</th>
                  <th className="px-4 py-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-brand-950">
                      {lead.nome}
                    </td>
                    <td className="px-4 py-4 text-brand-900">
                      {formatarWhatsapp(lead.whatsapp)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                        {lead.lgpd_consent ? "Sim" : "Não"}
                      </span>
                      {lead.lgpd_consent_at && (
                        <p className="mt-1 text-xs text-brand-700/70">
                          {formatarData(lead.lgpd_consent_at)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-brand-900">
                      {lead.downloads}
                    </td>
                    <td className="px-4 py-4 text-brand-700">
                      {formatarData(lead.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(lead.id, lead.nome)}
                        className="text-sm font-medium text-red-700 transition-colors hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-brand-700">
              <p>
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link href={buildHref(currentPage - 1)} className="btn-secondary">
                    Anterior
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link href={buildHref(currentPage + 1)} className="btn-secondary">
                    Próxima
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
