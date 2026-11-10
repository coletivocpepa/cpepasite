"use client";

import Link from "next/link";

interface Resumo {
  total: number;
  unicos: number;
  hoje: number;
  ultimos_7_dias: number;
}

interface DiaVisitas {
  dia: string;
  total: number;
  unicos: number;
}

interface PaginaVisitas {
  path: string;
  total: number;
  unicos: number;
}

interface AdminAnalyticsContentProps {
  periodo: number;
  isAdmin: boolean;
  resumo: Resumo;
  porDia: DiaVisitas[];
  paginas: PaginaVisitas[];
}

const PERIODOS = [7, 30, 90];

function formatarDia(dia: string) {
  const [, mes, diaNum] = dia.split("-");
  return `${diaNum}/${mes}`;
}

function rotuloPagina(path: string) {
  if (path === "/") return "Home";
  return path;
}

function BarChart({ dados }: { dados: DiaVisitas[] }) {
  if (dados.length === 0) {
    return (
      <p className="rounded-xl border border-brand-100 bg-brand-50 px-6 py-12 text-center text-sm text-brand-700/70">
        Ainda não há visitas registradas neste período.
      </p>
    );
  }

  const max = Math.max(...dados.map((d) => d.total), 1);
  const labelStep = Math.ceil(dados.length / 12);

  return (
    <div className="flex h-64 items-end gap-1 overflow-x-auto">
      {dados.map((d, i) => {
        const altura = Math.max((d.total / max) * 100, 2);
        const mostraLabel = i % labelStep === 0 || i === dados.length - 1;
        return (
          <div
            key={d.dia}
            className="group flex h-full min-w-[14px] flex-1 flex-col items-center justify-end"
            title={`${formatarDia(d.dia)}: ${d.total} visitas · ${d.unicos} únicos`}
          >
            <span className="mb-1 hidden text-[10px] font-medium text-brand-700 group-hover:block">
              {d.total}
            </span>
            <div
              className="w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
              style={{ height: `${altura}%` }}
            />
            <span className="mt-1 h-4 text-[10px] text-brand-700/60">
              {mostraLabel ? formatarDia(d.dia) : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsContent({
  periodo,
  isAdmin,
  resumo,
  porDia,
  paginas,
}: AdminAnalyticsContentProps) {
  const cards = [
    { label: "Visitas no período", value: resumo.total, icon: "👁️" },
    { label: "Visitantes únicos", value: resumo.unicos, icon: "👤" },
    { label: "Hoje", value: resumo.hoje, icon: "📅" },
    { label: "Últimos 7 dias", value: resumo.ultimos_7_dias, icon: "📈" },
  ];

  if (!isAdmin) {
    return (
      <div className="container-site mx-auto max-w-6xl px-4">
        <p className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-brand-900/80">
          Apenas administradores podem ver as estatísticas de visitas.
        </p>
      </div>
    );
  }

  return (
    <div className="container-site mx-auto max-w-6xl px-4">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Visitas no site
          </h1>
          <p className="mt-2 text-brand-900/80">
            Acessos ao site público nos últimos {periodo} dias.
          </p>
        </div>
        <nav className="flex gap-2" aria-label="Período">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={`/admin/analytics?dias=${p}`}
              className={
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                (p === periodo
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-brand-200 text-brand-800 hover:border-brand-400 hover:bg-brand-50")
              }
            >
              {p} dias
            </Link>
          ))}
        </nav>
      </header>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-brand-700/70">{card.label}</p>
                <p className="text-2xl font-bold text-brand-950">
                  {card.value.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mb-10 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-serif text-xl font-semibold text-brand-950">
          Visitas por dia
        </h2>
        <BarChart dados={porDia} />
      </section>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-serif text-xl font-semibold text-brand-950">
          Páginas mais vistas
        </h2>
        {paginas.length === 0 ? (
          <p className="rounded-xl border border-brand-100 bg-brand-50 px-6 py-12 text-center text-sm text-brand-700/70">
            Ainda não há dados de páginas neste período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-brand-700/70">
                  <th className="pb-3 pr-4 font-medium">Página</th>
                  <th className="pb-3 pr-4 text-right font-medium">Visitas</th>
                  <th className="pb-3 text-right font-medium">Únicos</th>
                </tr>
              </thead>
              <tbody>
                {paginas.map((p) => (
                  <tr key={p.path} className="border-b border-brand-50 last:border-0">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-brand-900">
                        {rotuloPagina(p.path)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-brand-950">
                      {p.total.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 text-right text-brand-900/70">
                      {p.unicos.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
