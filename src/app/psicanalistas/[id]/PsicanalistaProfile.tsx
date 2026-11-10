"use client";

import Link from "next/link";

interface Psicanalista {
  id: string;
  nome: string;
  bio: string | null;
  modalidades: string[];
  formacao: string | null;
}

interface PsicanalistaProfileProps {
  psicanalista: Psicanalista;
}

export default function PsicanalistaProfile({ psicanalista }: PsicanalistaProfileProps) {
  return (
    <section className="py-16">
      <div className="container-site mx-auto px-4 max-w-3xl">
        <Link href="/psicanalistas" className="inline-flex items-center gap-2 text-sm text-brand-700/80 hover:text-brand-950 mb-8">
          ← Voltar à listagem
        </Link>

        <article className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
          <header className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-brand-950">
              {psicanalista.nome}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {psicanalista.modalidades?.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-brand-900/80"
                >
                  {m === "online" ? "Online" : "Presencial"}
                </span>
              ))}
            </div>
          </header>

          {psicanalista.formacao && (
            <section className="mb-8 pb-8 border-b border-brand-100">
              <h2 className="font-serif text-xl font-semibold text-brand-950 mb-3">
                Formação
              </h2>
              <p className="leading-relaxed text-brand-900/80">{psicanalista.formacao}</p>
            </section>
          )}

          {psicanalista.bio && (
            <section className="mb-8 pb-8 border-b border-brand-100">
              <h2 className="font-serif text-xl font-semibold text-brand-950 mb-3">
                Sobre
              </h2>
              <p className="leading-relaxed text-brand-900/80">{psicanalista.bio}</p>
            </section>
          )}

          <div className="mt-10 pt-8 border-t border-brand-100 text-center">
            <p className="text-sm text-brand-700/70 mb-4">
              Ao entrar em contato, você não assume nenhum compromisso. O primeiro
              contato serve apenas para aproximação — sem cobranças e sem respostas
              prontas.
            </p>
            <Link
              href="/solicitar-escuta"
              className="btn-primary inline-block"
            >
              Solicitar escuta com este psicanalista
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}