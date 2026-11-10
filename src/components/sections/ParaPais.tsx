import Decor from "@/components/Decor";

const publico = [
  "mães de pessoas autistas",
  "pais de pessoas autistas",
  "responsáveis diretamente envolvidos com a experiência parental",
  "pais que receberam recentemente um diagnóstico",
  "pais que convivem há anos com o diagnóstico e percebem a necessidade de falar sobre a própria experiência",
];

export default function ParaPais() {
  return (
    <section id="para-pais" className="relative section-padding">
      <Decor variant="section" />
      <div className="container-site relative grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow">Para pais</p>
          <h2 className="section-title mt-4">
            Para os pais, sem culpa e sem respostas prontas
          </h2>
          <div className="section-lead mt-6 space-y-5">
            <p>
              O CPEPA não atribui aos pais a causa do autismo. Ao mesmo tempo,
              não os reduz a vítimas passivas de uma situação sobre a qual nada
              poderiam dizer.
            </p>
            <p>
              A escuta abre espaço para que cada sujeito reconheça sua própria
              posição — seus desejos, seus conflitos e suas escolhas — sem
              transformar isso em acusação.
            </p>
            <p className="font-serif text-xl text-brand-900">
              Não é necessário que exista uma crise específica para procurar a
              escuta.
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
  );
}