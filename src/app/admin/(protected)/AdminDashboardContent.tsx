"use client";

import Link from "next/link";

interface Stats {
  totalSolicitacoes: number;
  totalIndicacoes: number;
  totalPsicanalistas: number;
  solicitacoesAbertas: number;
  indicacoesPendentes: number;
  psicanalistasAtivos: number;
  totalEbookLeads: number;
}

interface AdminDashboardContentProps {
  stats: Stats;
}

export default function AdminDashboardContent({ stats }: AdminDashboardContentProps) {
  const cards = [
    {
      label: "Total de Solicitações",
      value: stats.totalSolicitacoes,
      href: "/admin/solicitacoes",
      color: "brand",
      icon: "📋",
    },
    {
      label: "Solicitações Abertas",
      value: stats.solicitacoesAbertas,
      href: "/admin/solicitacoes?status=aberta",
      color: "green",
      icon: "📋",
    },
    {
      label: "Total de Indicações",
      value: stats.totalIndicacoes,
      href: "/admin/indicacoes",
      color: "blue",
      icon: "🔗",
    },
    {
      label: "Indicações Pendentes",
      value: stats.indicacoesPendentes,
      href: "/admin/indicacoes?status=pendente",
      color: "yellow",
      icon: "🔗",
    },
    {
      label: "Total de Psicanalistas",
      value: stats.totalPsicanalistas,
      href: "/admin/psicanalistas",
      color: "purple",
      icon: "👥",
    },
    {
      label: "Psicanalistas Ativos",
      value: stats.psicanalistasAtivos,
      href: "/admin/psicanalistas?status=ativo",
      color: "green",
      icon: "👥",
    },
    {
      label: "Leads do E-book",
      value: stats.totalEbookLeads,
      href: "/admin/ebook",
      color: "blue",
      icon: "▤",
    },
  ];

  const cardElements = cards.map(function(card) {
    return (
      <Link
        key={card.label}
        href={card.href}
        className={"rounded-2xl border border-brand-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow " +
          (card.color === "brand"
            ? "border-brand-200"
            : card.color === "green"
            ? "border-green-200"
            : card.color === "blue"
            ? "border-blue-200"
            : card.color === "yellow"
            ? "border-yellow-200"
            : "border-purple-200")}
      >
        <div className="flex items-center gap-4">
          <div
            className={"flex h-12 w-12 items-center justify-center rounded-xl " +
              (card.color === "brand"
                ? "bg-brand-100 text-brand-800"
                : card.color === "green"
                ? "bg-green-100 text-green-800"
                : card.color === "blue"
                ? "bg-blue-100 text-blue-800"
                : card.color === "yellow"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-purple-100 text-purple-800")}
          >
            <span className="text-2xl">{card.icon}</span>
          </div>
          <div>
            <p className="text-sm text-brand-700/70">{card.label}</p>
            <p className="text-2xl font-bold text-brand-950">{card.value}</p>
          </div>
        </div>
      </Link>
    );
  });

  return (
    <div className="container-site mx-auto px-4 max-w-6xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-brand-950">
          Dashboard Administrativo
        </h1>
        <p className="mt-2 text-brand-900/80">
          Visão geral do CPEPA
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {cardElements}
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-semibold text-brand-950 mb-4">
          Ações Rápidas
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/solicitacoes?status=aberta" className="btn-primary">
            Ver solicitações abertas
          </Link>
          <Link href="/admin/indicacoes?status=pendente" className="btn-secondary">
            Ver indicações pendentes
          </Link>
          <Link href="/admin/psicanalistas" className="btn-secondary">
            Gerenciar psicanalistas
          </Link>
          <Link href="/admin/conteudo" className="btn-secondary">
            Editar conteúdo do site
          </Link>
          <Link href="/admin/analytics" className="btn-secondary">
            Ver visitas do site
          </Link>
          <Link href="/admin/ebook" className="btn-secondary">
            Ver leads do e-book
          </Link>
        </div>
      </section>
    </div>
  );
}