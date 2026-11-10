import Image from "next/image";
import Link from "next/link";
import Decor from "@/components/Decor";
import heroImage from "@/assets/images/imagemsite.png";

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-brand-950 text-white"
    >
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
            Coletivo Psicanalítico de{" "}
            <span className="text-accent">Escuta</span> de Pais de Autistas
          </p>

          <h1 className="mt-6 font-serif text-4xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Antes de cuidar, é preciso poder falar.
          </h1>

          <p className="mt-8 text-lg leading-relaxed text-brand-100/90">
            Ser mãe ou pai de uma pessoa autista pode produzir perguntas,
            angústias, conflitos e transformações que nem sempre encontram espaço
            para serem ditos. O CPEPA oferece um espaço de escuta psicanalítica
            para mães e pais que desejam falar sobre aquilo que essa experiência
            produz em suas vidas.
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:w-auto sm:flex-row lg:mx-0">
            <Link
              href="/solicitar-escuta"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Quero ser escutado
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-full border border-brand-300/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-brand-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Como funciona
            </a>
          </div>

          <p className="mt-12 font-serif text-xl italic text-brand-200/80">
            Quando todos perguntam pela criança, quem pergunta pelos pais?
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-3xl bg-brand-500/25 blur-2xl"
          />
          <Image
            src={heroImage}
            alt="Acolhimento e escuta no CPEPA"
            priority
            unoptimized
            className="relative w-full rounded-2xl ring-1 shadow-2xl ring-white/15 h-auto"
          />
        </div>
      </div>
    </section>
  );
}