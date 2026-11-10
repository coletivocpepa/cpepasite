import Decor from "@/components/Decor";

const passos = [
  {
    titulo: "Solicitar a escuta",
    texto:
      "Você preenche uma solicitação breve, indicando seus horários preferidos e a modalidade — online ou presencial.",
  },
  {
    titulo: "Primeiro contato",
    texto:
      "O coletivo recebe sua solicitação e realiza um acolhimento para compreender seus horários e necessidades.",
  },
  {
    titulo: "Conhecer um psicanalista",
    texto:
      "Com base na sua disponibilidade, o CPEPA indica um psicanalista do coletivo cujo horário de atendimento seja compatível.",
  },
  {
    titulo: "Começar a falar",
    texto:
      "Os encontros acontecem com regularidade, em sessões de escuta com valor simbólico — sem cobranças e sem respostas prontas.",
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="relative section-padding bg-brand-50/60">
      <Decor variant="section" />
      <div className="container-site relative">
        <div className="max-w-2xl">
          <p className="eyebrow">Como funciona</p>
          <h2 className="section-title mt-4">
            Da solicitação ao primeiro encontro
          </h2>
          <p className="section-lead mt-6">
            O caminho até a escuta é simples. A indicação considera o horário
            em que você consegue participar, buscando uma psicanalista ou um
            psicanalista disponível nesse período.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((passo, index) => (
            <li
              key={passo.titulo}
              className="relative rounded-2xl border border-brand-100 bg-white p-7"
            >
              <span className="font-serif text-3xl font-semibold text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-brand-950">
                {passo.titulo}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-900/80">
                {passo.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}