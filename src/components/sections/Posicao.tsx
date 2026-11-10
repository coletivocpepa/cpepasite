import Decor from "@/components/Decor";

export default function Posicao() {
  return (
    <section id="quem-somos" className="relative section-padding bg-brand-950 text-white">
      <Decor variant="section" />
      <div className="container-site relative">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.25em] text-brand-300 uppercase">
            Quem somos
          </p>
          <h2 className="mt-4 font-serif text-3xl leading-tight font-semibold text-white sm:text-4xl">
            A posição do CPEPA
          </h2>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-3 lg:gap-8">
          <div className="rounded-2xl border border-brand-800 bg-brand-900/40 p-8">
            <h3 className="font-serif text-xl font-semibold text-white">
              A escuta da singularidade
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-brand-200">
              O coletivo sustenta a escuta do sujeito, reconhecendo que cada
              pai e cada mãe responde de maneira própria ao acontecimento do
              autismo na história familiar. Não existe uma experiência parental
              universal.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-800 bg-brand-900/40 p-8">
            <h3 className="font-serif text-xl font-semibold text-white">
              O diagnóstico não explica tudo
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-brand-200">
              O diagnóstico nomeia uma condição clínica, mas não esgota o que
              essa nomeação produz na subjetividade dos pais. O CPEPA busca
              oferecer condições para que esse significado possa aparecer no
              próprio discurso do sujeito.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-800 bg-brand-900/40 p-8">
            <h3 className="font-serif text-xl font-semibold text-white">
              Interdisciplinaridade
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-brand-200">
              Quando houver necessidade de outros acompanhamentos, o
              participante poderá ser orientado a profissionais ou serviços
              adequados — sem que o coletivo deixe de preservar seu campo
              próprio: a escuta do sujeito.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}