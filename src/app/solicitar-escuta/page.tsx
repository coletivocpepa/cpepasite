import type { Metadata } from "next";
import Decor from "@/components/Decor";
import SolicitarEscutaForm from "@/app/solicitar-escuta/SolicitarEscutaForm";

export const metadata: Metadata = {
  title: "Solicitar Escuta",
  description:
    "Solicite uma escuta psicanalítica no CPEPA. Informe seus horários preferidos e a modalidade para começarmos.",
};

const passos = [
  {
    titulo: "Você envia",
    texto:
      "Preenche uma solicitação breve com seus dados e os horários em que conseguiria participar.",
  },
  {
    titulo: "O CPEPA recebe",
    texto:
      "Sua solicitação chega diretamente ao coletivo, com o cuidado e o sigilo que a escuta exige.",
  },
  {
    titulo: "A indicação",
    texto:
      "A partir da sua disponibilidade, o CPEPA indica uma psicanalista ou um psicanalista do coletivo.",
  },
  {
    titulo: "O primeiro encontro",
    texto:
      "Um espaço para começar a falar — sem culpa e sem respostas prontas, com valor simbólico.",
  },
];

export default function SolicitarEscutaPage() {
  return (
    <section className="relative section-padding">
      <Decor variant="section" />
      <div className="container-site relative grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">Solicitar escuta</p>
          <h1 className="section-title mt-4">Quero ser escutado</h1>

          <div className="section-lead mt-6 space-y-5">
            <p>
              Este é o primeiro passo para encontrar um espaço de escuta.
              Informe seus horários preferidos e a modalidade — online ou
              presencial. Nada precisa estar perfeitamente definido.
            </p>
            <p>
              O CPEPA entra em contato a partir da sua solicitação para
              combinar os próximos passos, de forma simples e transparente.
            </p>
          </div>

          <ol className="mt-10 space-y-6">
            {passos.map((passo, index) => (
              <li key={passo.titulo} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 font-serif text-lg font-semibold text-brand-700"
                >
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-brand-950">
                    {passo.titulo}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-brand-900/80">
                    {passo.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <SolicitarEscutaForm />
      </div>
    </section>
  );
}