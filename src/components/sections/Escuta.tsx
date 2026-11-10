import Decor from "@/components/Decor";

const acolhe = [
  "o impacto subjetivo do diagnóstico",
  "angústias e incertezas",
  "conflitos conjugais e familiares",
  "sentimentos de solidão e ambivalência",
  "impasses no exercício da parentalidade",
  "efeitos do excesso de cobranças",
];

const naoOferece = [
  "tratamento do autismo da criança",
  "terapia comportamental",
  "treinamento parental ou manejo de comportamentos",
  "promessa de cura",
  "diagnóstico ou acompanhamento medicamentoso",
  "uma fórmula de como educar os filhos",
];

export default function Escuta() {
  return (
    <section id="a-escuta" className="relative section-padding bg-brand-50/60">
      <Decor variant="section" />
      <div className="container-site relative">
        <div className="max-w-3xl">
          <p className="eyebrow">A escuta</p>
          <h2 className="section-title mt-4">Escutar não é aconselhar</h2>
          <p className="section-lead mt-6">
            A escuta psicanalítica não parte da oferta de respostas prontas
            para os impasses familiares. O sujeito não precisa chegar sabendo
            exatamente o que dizer — a escuta começa justamente onde algo
            precisa ser dito.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-white p-8">
            <h3 className="font-serif text-xl font-semibold text-brand-950">
              O que a escuta pode acolher
            </h3>
            <ul className="mt-6 space-y-3">
              {acolhe.map((item) => (
                <li key={item} className="flex items-start gap-3 text-brand-900">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span className="text-brand-900/90">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-brand-700/80">
              Essa não é uma lista de problemas que o CPEPA promete resolver. É
              apenas uma amostra do que pode encontrar lugar na fala.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-8">
            <h3 className="font-serif text-xl font-semibold text-brand-950">
              O que o CPEPA não oferece
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-700/80">
              Para preservar sua identidade clínica, o coletivo deixa claros
              seus limites.
            </p>
            <ul className="mt-6 space-y-3">
              {naoOferece.map((item) => (
                <li key={item} className="flex items-start gap-3 text-brand-900">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-200"
                  />
                  <span className="text-brand-900/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}