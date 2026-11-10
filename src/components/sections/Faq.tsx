import Decor from "@/components/Decor";

const perguntas = [
  {
    pergunta: "Quem pode solicitar a escuta?",
    resposta:
      "Mães, pais e responsáveis diretamente envolvidos com a experiência de ter uma pessoa autista na família.",
  },
  {
    pergunta: "Preciso estar em crise para procurar a escuta?",
    resposta:
      "Não. Não é necessário que exista uma crise específica. A proposta contempla diferentes momentos da trajetória familiar.",
  },
  {
    pergunta: "O CPEPA atende crianças?",
    resposta:
      "Não. O CPEPA trata da escuta dos pais e responsáveis. A criança pode estar presente no discurso parental, mas não constitui o objeto direto da intervenção.",
  },
  {
    pergunta: "A escuta ensina como educar meu filho?",
    resposta:
      "Não. O analista não ocupa o lugar daquele que sabe como os pais devem agir. O CPEPA não oferece treinamento parental nem manejo de comportamentos.",
  },
  {
    pergunta: "Como funciona o valor simbólico?",
    resposta:
      "Os atendimentos são oferecidos mediante um valor simbólico, definido segundo os critérios do coletivo e apresentado de forma transparente, sem exposição da situação financeira de quem participa.",
  },
  {
    pergunta: "A escuta é presencial ou online?",
    resposta:
      "As duas modalidades podem estar disponíveis. Na solicitação, você indica sua preferência e os horários em que consegue participar; a indicação considera essa informação.",
  },
];

export default function Faq() {
  return (
    <section id="perguntas-frequentes" className="relative section-padding">
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
  );
}