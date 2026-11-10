import type { Metadata } from "next";
import Image from "next/image";
import Decor from "@/components/Decor";
import { SITE_URL } from "@/lib/site-url";
import EbookLeadForm from "./EbookLeadForm";

export const metadata: Metadata = {
  title: "E-book: Autismo — O Que Não Contarão Às Famílias",
  description:
    "Baixe gratuitamente o e-book de Lucio Escobar sobre o que costuma ficar de fora quando uma família recebe o diagnóstico de autismo: limites das pesquisas, conflitos de interesse, efeitos das intervenções intensivas e a escuta dos próprios autistas.",
  alternates: {
    canonical: "/ebook",
  },
  openGraph: {
    title: "E-book: Autismo — O Que Não Contarão Às Famílias",
    description:
      "Informação ampla, honesta e contextualizada para famílias que querem mais do que uma única narrativa sobre o autismo.",
    type: "article",
    locale: "pt_BR",
    images: [
      {
        url: "/ebook/og.jpg",
        width: 1200,
        height: 630,
        alt: "Capa do e-book Autismo: O Que Não Contarão Às Famílias",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "E-book: Autismo — O Que Não Contarão Às Famílias",
    description:
      "Informação ampla, honesta e contextualizada para famílias que querem mais do que uma única narrativa sobre o autismo.",
    images: ["/ebook/og.jpg"],
  },
};

const proposta = [
  {
    titulo: "Perguntas, não slogans",
    texto:
      "Ciência verdadeira também exige dúvida, comparação, revisão, crítica, transparência e reconhecimento dos limites.",
  },
  {
    titulo: "O que está sendo recomendado",
    texto:
      "Saber por quê, com base em quais estudos, com quais limites, custos, riscos e efeitos possíveis sobre a vida da criança.",
  },
  {
    titulo: "A criança como sujeito",
    texto:
      "Uma criança autista não é um conjunto de comportamentos a serem corrigidos. Ela tem corpo, linguagem, recusas e modos próprios de estar no mundo.",
  },
];

const conteudo = [
  "Os limites das pesquisas e as fragilidades metodológicas.",
  "Os conflitos de interesse que atravessam recomendações.",
  "Os efeitos subjetivos das intervenções intensivas.",
  "A escuta dos próprios autistas.",
  "O sofrimento das famílias submetidas à lógica da urgência permanente.",
  "O que está sendo recomendado, com quais limites, custos e riscos.",
];

const publico = [
  "Mães, pais e responsáveis que receberam um diagnóstico recente.",
  "Famílias que convivem há anos com o diagnóstico e sentem falta de contexto.",
  "Quem foi colocado diante de uma única narrativa e quer entender o que está sendo silenciado.",
  "Pessoas que acompanham famílias autistas e desejam ampliar a escuta.",
];

const perguntas = [
  {
    pergunta: "O e-book é gratuito?",
    resposta:
      "Sim. Basta preencher seu nome e WhatsApp para liberar o download do arquivo em PDF.",
  },
  {
    pergunta: "Preciso ter um diagnóstico para baixar?",
    resposta:
      "Não. O material é para famílias e pessoas interessadas em compreender melhor o debate sobre autismo, inclusive quem acompanha essas famílias.",
  },
  {
    pergunta: "O e-book substitui acompanhamento profissional?",
    resposta:
      "Não. É um material informativo e não substitui avaliação, acompanhamento ou decisão clínica individual.",
  },
  {
    pergunta: "Como recebo o arquivo?",
    resposta:
      "O download é liberado imediatamente após o preenchimento do formulário. Se o navegador bloquear o início automático, use o botão que aparece na tela.",
  },
  {
    pergunta: "Meus dados serão usados para quê?",
    resposta:
      "Para liberar o material e registrar seu interesse no e-book. Os dados não são compartilhados com terceiros.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Book",
  name: "Autismo: O Que Não Contarão Às Famílias",
  description:
    "E-book sobre o que costuma ficar de fora quando uma família recebe o diagnóstico de autismo: limites das pesquisas, conflitos de interesse, efeitos das intervenções intensivas e a escuta dos próprios autistas.",
  image: `${SITE_URL}/ebook/og.jpg`,
  inLanguage: "pt-BR",
  bookFormat: "https://schema.org/EBook",
  author: {
    "@type": "Person",
    name: "Lucio Escobar",
    jobTitle: "Doutor em psicanálise",
  },
  publisher: {
    "@type": "Organization",
    name: "CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
  },
};

export default function EbookPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(69,115,179,0.2),transparent_50%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(230,0,126,0.18),transparent_55%)]"
        />
        <Decor variant="hero" className="opacity-90" />

        <div className="container-site relative grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold tracking-[0.25em] text-brand-300 uppercase">
              E-book gratuito · CPEPA
            </p>

            <h1 className="mt-6 font-serif text-4xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Autismo: O Que Não Contarão Às Famílias
            </h1>

            <p className="mt-8 text-lg leading-relaxed text-brand-100/90">
              Quando uma família recebe o diagnóstico, não recebe apenas uma
              informação clínica. Ela entra em um sistema de orientações,
              promessas, advertências e urgências. Este e-book abre espaço para
              as perguntas que costumam ficar de fora.
            </p>

            <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:w-auto sm:flex-row lg:mx-0">
              <a
                href="#baixar"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Quero baixar o e-book
              </a>
              <a
                href="#conteudo"
                className="inline-flex items-center justify-center rounded-full border border-brand-300/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-brand-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                O que vou encontrar
              </a>
            </div>

            <p className="mt-12 font-serif text-xl italic text-brand-200/80">
              O problema não é buscar tratamento. O problema começa quando a
              família é colocada diante de uma única narrativa.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-3xl bg-brand-500/25 blur-2xl"
            />
            <Image
              src="/ebook/capa.jpg"
              alt="Capa do e-book Autismo: O Que Não Contarão Às Famílias"
              width={800}
              height={1067}
              priority
              unoptimized
              className="relative h-auto w-full rounded-2xl ring-1 shadow-2xl ring-white/15"
            />
          </div>
        </div>
      </section>

      <section id="proposta" className="relative section-padding">
        <Decor variant="section" />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <p className="eyebrow">A proposta</p>
            <h2 className="section-title mt-4">
              Informação ampla, honesta e contextualizada
            </h2>
            <div className="section-lead mt-6 space-y-5">
              <p>
                Este e-book nasce para abrir espaço para as perguntas das
                famílias. Não se trata de substituir um dogma por outro, nem de
                dizer que toda terapia é ruim ou que determinada abordagem nunca
                pode ajudar.
              </p>
              <p>
                O que será questionado é a maneira como certas informações sobre
                o autismo são privilegiadas, repetidas e transformadas em verdade
                absoluta, enquanto outras — muitas vezes fundamentais —
                permanecem silenciadas.
              </p>
              <p className="font-serif text-xl text-brand-900">
                Este livro não é contra a ciência. Ele é contra o uso
                simplificado da ciência como instrumento de convencimento das
                famílias.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {proposta.map((item, index) => (
              <article
                key={item.titulo}
                className="rounded-2xl border border-brand-100 bg-white p-7"
              >
                <span className="font-serif text-3xl font-semibold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-lg font-semibold text-brand-950">
                  {item.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-900/80">
                  {item.texto}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="conteudo"
        className="relative section-padding bg-brand-50/60"
      >
        <Decor variant="section" />
        <div className="container-site relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow">No e-book</p>
            <h2 className="section-title mt-4">
              As informações que costumam ficar de fora
            </h2>
            <p className="section-lead mt-6">
              Entre as informações silenciadas estão os limites das pesquisas, os
              conflitos de interesse, as fragilidades metodológicas, os efeitos
              subjetivos das intervenções intensivas, a escuta dos próprios
              autistas e o sofrimento das famílias submetidas à lógica da
              urgência permanente.
            </p>
            <p className="mt-6 font-serif text-xl text-brand-900">
              Não é um receituário. É um material para pensar com mais contexto.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {conteudo.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-white p-5"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                />
                <span className="text-sm leading-relaxed text-brand-900">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="para-quem" className="relative section-padding">
        <Decor variant="section" />
        <div className="container-site relative grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Para quem é</p>
            <h2 className="section-title mt-4">
              Para famílias que querem mais do que uma única narrativa
            </h2>
            <div className="section-lead mt-6 space-y-5">
              <p>
                A mãe de uma criança autista não precisa ser conduzida pelo medo.
                Ela precisa de informação ampla, honesta e contextualizada.
              </p>
              <p>
                Precisa saber o que está sendo recomendado, por que está sendo
                recomendado, com base em quais estudos, com quais limites, com
                quais custos, com quais riscos e com quais efeitos possíveis
                sobre a vida da criança.
              </p>
              <p className="font-serif text-xl text-brand-900">
                A dúvida não é ignorância. A prudência não é atraso. A pergunta
                não é ameaça.
              </p>
            </div>
          </div>

          <aside className="relative rounded-2xl border border-accent/20 bg-accent/5 p-8">
            <Decor variant="aside" />
            <p className="relative eyebrow">A quem se destina</p>
            <ul className="relative mt-6 space-y-4">
              {publico.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span className="text-brand-900">{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.06),transparent_55%)]"
        />
        <Decor variant="cta" />
        <div className="container-site relative py-20 sm:py-24">
          <blockquote className="mx-auto max-w-4xl text-center">
            <p className="font-serif text-2xl leading-relaxed text-balance sm:text-3xl">
              Uma criança autista não é um conjunto de comportamentos a serem
              corrigidos. Ela é um sujeito. Tem corpo, linguagem, sensibilidade,
              recusas, invenções, medos, modos próprios de estar no mundo e
              formas singulares de laço. E nenhuma decisão terapêutica deveria
              apagar isso.
            </p>
            <footer className="mt-8 text-xs font-semibold tracking-[0.25em] text-brand-300 uppercase">
              Do e-book
            </footer>
          </blockquote>
        </div>
      </section>

      <section id="autoria" className="relative section-padding bg-brand-50/60">
        <Decor variant="section" />
        <div className="container-site relative max-w-4xl">
          <p className="eyebrow">Sobre a autoria</p>
          <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
            <div
              aria-hidden="true"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-800 font-serif text-2xl font-semibold text-white"
            >
              LE
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-brand-950">
                Lucio Escobar
              </h2>
              <p className="mt-1 text-sm font-semibold tracking-wide text-brand-600 uppercase">
                Doutor em psicanálise
              </p>
              <p className="mt-4 leading-relaxed text-brand-900/80">
                Psicanalista, Filósofo, Professor e Escritor. Doutor pela Logos
                University na França, Coordenador do CPEPA, e Coordenador de
                Formação em Psicanálise e Autismo da Sociedade Psicanalítica
                online - SPO.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-brand-700/70">
                Publicação do CPEPA — Coletivo Psicanalítico de Escuta de Pais de
                Autistas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="duvidas" className="relative section-padding">
        <Decor variant="section" />
        <div className="container-site relative max-w-3xl">
          <p className="eyebrow text-center">Dúvidas</p>
          <h2 className="section-title mt-4 text-center">
            Perguntas frequentes
          </h2>

          <div className="mt-12 space-y-3">
            {perguntas.map((item) => (
              <details
                key={item.pergunta}
                className="group rounded-2xl border border-brand-100 bg-white transition-colors open:border-brand-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 font-medium text-brand-950 transition-colors hover:text-brand-700 [&::-webkit-details-marker]:hidden">
                  {item.pergunta}
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl font-light text-accent transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-brand-900/80">
                  {item.resposta}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="baixar" className="relative section-padding">
        <Decor variant="section" />
        <div className="container-site relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
          <div>
            <p className="eyebrow">Download gratuito</p>
            <h2 className="section-title mt-4">Baixe o e-book completo</h2>
            <p className="section-lead mt-6">
              Preencha seu nome e WhatsApp para liberar o arquivo. O download é
              imediato e gratuito.
            </p>

            <div className="mt-8 flex items-center gap-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
              <Image
                src="/ebook/capa.jpg"
                alt=""
                width={800}
                height={1067}
                unoptimized
                className="h-28 w-auto rounded-lg shadow"
              />
              <div>
                <p className="font-serif text-lg font-semibold text-brand-950">
                  Autismo: O Que Não Contarão Às Famílias
                </p>
                <p className="mt-1 text-sm text-brand-900/70">
                  PDF · Lucio Escobar
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-brand-900/70">
              Seus dados são usados apenas para liberar o material e registrar
              seu interesse no e-book. Não há cobrança e não compartilhamos seus
              dados com terceiros.
            </p>
          </div>

          <EbookLeadForm />
        </div>
      </section>
    </>
  );
}
