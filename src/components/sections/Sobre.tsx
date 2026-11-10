import Decor from "@/components/Decor";

const principios = [
  "O foco da escuta são os pais",
  "Escutar não é aconselhar",
  "Ausência de culpabilização",
  "Singularidade de cada sujeito",
  "Sigilo e ética clínica",
];

export default function Sobre() {
  return (
    <section id="o-cpepa" className="relative section-padding">
      <Decor variant="section" />
      <div className="container-site relative grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow">O CPEPA</p>
          <h2 className="section-title mt-4">Um coletivo para quem cuida</h2>

          <div className="section-lead mt-6 space-y-5">
            <p>
              O CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas —
              é uma iniciativa de caráter clínico, social e psicanalítico
              destinada a oferecer escuta a mães, pais e responsáveis por
              pessoas autistas.
            </p>
            <p>
              Grande parte das redes de atenção ao autismo está organizada em
              torno da criança. Nesse contexto, mães e pais frequentemente
              aparecem como acompanhantes do tratamento, enquanto seu próprio
              sofrimento permanece em segundo plano.
            </p>
            <p className="font-serif text-xl text-brand-900 not-italic">
              O CPEPA propõe um deslocamento dessa perspectiva. Se a criança é
              frequentemente objeto de cuidado, quem escuta aqueles que cuidam?
            </p>
          </div>
        </div>

        <aside className="relative rounded-2xl border border-brand-100 bg-brand-50 p-8 lg:self-start">
          <Decor variant="aside" />
          <p className="relative eyebrow">Princípios</p>
          <ul className="relative mt-6 space-y-4">
            {principios.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                />
                <span className="font-medium text-brand-900">{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}