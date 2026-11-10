import Image from "next/image";
import Link from "next/link";
import Decor from "@/components/Decor";

export default function EbookBanner() {
  return (
    <section id="ebook" className="relative section-padding bg-brand-50/60">
      <Decor variant="section" />
      <div className="container-site relative">
        <div className="grid items-center gap-8 rounded-3xl border border-brand-100 bg-white p-8 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:gap-12">
          <Image
            src="/ebook/capa.jpg"
            alt="Capa do e-book Autismo: O Que Não Contarão Às Famílias"
            width={800}
            height={1067}
            unoptimized
            className="mx-auto h-48 w-auto rounded-lg shadow-lg sm:h-56 lg:h-64"
          />

          <div>
            <p className="eyebrow">E-book gratuito</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-brand-950 sm:text-3xl">
              Autismo: O Que Não Contarão Às Famílias
            </h2>
            <p className="mt-3 leading-relaxed text-brand-900/80">
              Um material para famílias que querem mais do que uma única
              narrativa sobre o autismo.
            </p>
          </div>

          <Link
            href="/ebook"
            className="btn-primary justify-self-start lg:justify-self-end"
          >
            Baixar o e-book
          </Link>
        </div>
      </div>
    </section>
  );
}
