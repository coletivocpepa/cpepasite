"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Horario = {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
};

type Psicanalista = {
  id: string;
  nome: string;
  telefone: string | null;
  bio: string | null;
  modalidades: string[];
  valor_simbolico: string | null;
  formacao: string | null;
};

type Match = {
  solicitacao_id: string;
  tipo: "exato" | "proximo";
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  modalidade: string;
  solicitado: Horario;
  psicanalista: Psicanalista;
};

const DIAS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

function formatHora(h: string) {
  return h.slice(0, 5);
}

function labelDia(dia_semana: number) {
  return DIAS.find((d) => d.value === dia_semana)?.label ?? "";
}

function getWhatsAppLink(telefone: string | null) {
  if (!telefone) return null;
  const numeros = telefone.replace(/\D/g, "");
  return `https://wa.me/${numeros}?text=Ol%C3%A1%2C+vim+pelo+CPEPA+e+gostaria+de+agendar+uma+escuta.`;
}

export default function MinhasSolicitacoesContent({ responsavelId }: { responsavelId: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/match-solicitacoes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ responsavel_id: responsavelId }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao buscar matches");
        setMatches(data.matches ?? []);
      } catch (err) {
        setError("Erro ao carregar matches. Tente novamente.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [responsavelId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center animate-pulse">
        Carregando suas indicações...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <p className="text-brand-900/80 mb-4">
          Nenhuma indicação encontrada para suas solicitações no momento.
        </p>
        <p className="text-sm text-brand-700/70">
          Novos psicanalistas podem cadastrar disponibilidades compatíveis a
          qualquer momento. Volte mais tarde.
        </p>
      </div>
    );
  }

  // Agrupa matches por solicitação
  const grouped = matches.reduce(
    (acc, m) => {
      if (!acc[m.solicitacao_id]) acc[m.solicitacao_id] = [];
      acc[m.solicitacao_id].push(m);
      return acc;
    },
    {} as Record<string, Match[]>
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([solicitacaoId, ms]) => {
        const temAlternativa = ms.some((m) => m.tipo === "proximo");
        const solicitado = ms[0].solicitado ?? {
          dia_semana: ms[0].dia_semana,
          hora_inicio: ms[0].hora_inicio,
          hora_fim: ms[0].hora_fim,
        };

        return (
          <section
            key={solicitacaoId}
            className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
          >
            <header className="mb-4 pb-4 border-b border-brand-100 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-brand-900/70">
                Solicitação: {solicitacaoId.slice(0, 8)}...
              </span>
              <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-900 font-medium">
                {labelDia(solicitado.dia_semana)}
              </span>
              <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-900 font-medium">
                {formatHora(solicitado.hora_inicio)} – {formatHora(solicitado.hora_fim)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ms[0].modalidade === "online"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {ms[0].modalidade === "online" ? "Online" : "Presencial"}
              </span>
            </header>

            {temAlternativa && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <p className="text-sm leading-relaxed text-amber-900">
                  O horário que você solicitou ({" "}
                  {labelDia(solicitado.dia_semana)}, {formatHora(solicitado.hora_inicio)} –{" "}
                  {formatHora(solicitado.hora_fim)}) não está disponível no
                  momento. Indicamos abaixo os horários mais próximos
                  disponíveis no CPEPA.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ms.map((m) => (
                <article
                  key={m.psicanalista.id + (m.tipo === "proximo" ? m.hora_inicio : "")}
                  className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <header className="mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-lg font-semibold text-brand-950">
                        {m.psicanalista.nome}
                      </h3>
                      {m.tipo === "proximo" && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Horário alternativo
                        </span>
                      )}
                    </div>
                    {m.tipo === "proximo" ? (
                      <p className="mt-1 text-sm font-medium text-brand-900">
                        {labelDia(m.dia_semana)} · {formatHora(m.hora_inicio)} –{" "}
                        {formatHora(m.hora_fim)}
                        <span className="ml-1 text-xs font-normal text-brand-700/70">
                          (mais próximo do seu pedido)
                        </span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-brand-700/80">
                        {labelDia(m.dia_semana)} · {formatHora(m.hora_inicio)} –{" "}
                        {formatHora(m.hora_fim)}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1 text-xs">
                      {m.psicanalista.modalidades?.map((mod) => (
                        <span
                          key={mod}
                          className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-brand-900/80"
                        >
                          {mod === "online" ? "Online" : "Presencial"}
                        </span>
                      ))}
                    </div>
                  </header>

                  {m.psicanalista.bio && (
                    <p className="mb-3 text-sm text-brand-900/80 line-clamp-2">
                      {m.psicanalista.bio}
                    </p>
                  )}

                  {m.psicanalista.formacao && (
                    <p className="mb-3 text-xs text-brand-700/70">
                      <span className="font-medium">Formação:</span> {m.psicanalista.formacao}
                    </p>
                  )}

                  {m.psicanalista.valor_simbolico && (
                    <p className="mb-3 text-sm font-medium text-brand-900">
                      Valor simbólico: {m.psicanalista.valor_simbolico}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-brand-100">
                    {m.psicanalista.telefone && (
                      <a
                        href={getWhatsAppLink(m.psicanalista.telefone)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex-1 sm:flex-none text-center"
                      >
                        <svg className="inline h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.472.099-.173.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.4.01-.582.02-.198.01-.4.02-.579.02-.173 0-.372-.01-.57-.01l-.964-.964-.974-.974c-.202-.2-.614-.484-1.02-.726C.498 2.015 0 2.09 0 2.333v1.208c0 .15.033.317.123.454.16.275.534.867 1.038 1.427.622.693 1.14 1.303 1.51 1.787.37.48.69 1.023.9 1.5.226.476.332.917.316 1.25-.013.316-.099.624-.232.92-.154.307-.512.923-.892 1.634-.88 1.634-1.654 2.866-1.718 2.963-.034.046-.08.105-.124.147-.102.096-.196.208-.278.31-.184.24-.48.52-.714.704-.492.435-.99.857-1.315 1.16-.279.27-.52.552-.682.756-.303.362-.55.762-.655 1.068-.148.427-.174.798-.158 1.15.01.308.125.666.287.944.215.376.587.726.86 1.078.347.44.798.734 1.08.926.326.23.588.387.815.436.462.09.82.108 1.215.078.683-.053 1.38-.278 2.1-.782.492-.342.97-.82 1.34-1.447.34-.55.55-1.21.54-1.99-.01-.43-.16-.832-.344-1.227-.27-.575-.63-1.195-.977-1.74-.39-.6-.74-1.275-.983-1.83-.24-.56-.39-1.125-.394-1.185-.003-.05-.008-.108-.008-.158 0-.42.26-.84.723-1.194.463-.356.926-.713 1.392-1.078.463-.356.94-.713 1.416-1.088.472-.363.945-.75 1.32-1.125.376-.376.75-.752 1.128-1.138.376-.376.75-.752 1.128-1.138z" />
                        </svg>
                        WhatsApp
                      </a>
                    )}
                    <Link
                      href={`/psicanalistas/${m.psicanalista.id}`}
                      className="btn-secondary flex-1 sm:flex-none text-center"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}