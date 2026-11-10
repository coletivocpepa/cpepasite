import Link from "next/link";
import Decor from "@/components/Decor";

export default function CtaFinal() {
  return (
    <section id="solicitar-escuta" className="relative overflow-hidden bg-brand-800 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.06),transparent_55%)]"
      />
      <Decor variant="cta" />
      <div className="container-site relative flex flex-col items-center py-20 text-center sm:py-24">
        <h2 className="max-w-2xl font-serif text-3xl leading-tight font-semibold text-balance sm:text-4xl">
          Um espaço para quem também precisa ser escutado
        </h2>
        <p className="mt-5 max-w-xl text-brand-100/90">
          Fale sobre o que a experiência de cuidar produz em sua vida. Sem
          culpa, sem respostas prontas.
        </p>
        <Link
          href="/solicitar-escuta"
          className="mt-9 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Quero ser escutado
        </Link>
      </div>
    </section>
  );
}