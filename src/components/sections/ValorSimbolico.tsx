import Decor from "@/components/Decor";

export default function ValorSimbolico() {
  return (
    <section id="valor-simbolico" className="relative section-padding">
      <Decor variant="section" />
      <div className="container-site relative grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow">Valor simbólico</p>
          <h2 className="section-title mt-4">
            Um valor{" "}
            <span className="text-accent">simbólico</span> para que a escuta
            possa chegar a quem precisa ser escutado
          </h2>
        </div>

        <div className="section-lead space-y-5">
          <p>
            O CPEPA nasce com uma finalidade de ampliação do acesso à escuta
            psicanalítica. Por isso, os atendimentos são oferecidos mediante um
            valor simbólico, definido segundo as condições e os critérios
            estabelecidos pelo coletivo.
          </p>
          <p>
            O conceito de valor simbólico é preferível à ideia de um serviço
            simplesmente &ldquo;barato&rdquo; ou &ldquo;gratuito&rdquo;: ele preserva a dimensão
            clínica da contribuição e evita apresentar a escuta como um
            serviço sem valor.
          </p>
          <p>
            O valor e as condições de atendimento são apresentados de maneira
            transparente, evitando constrangimentos ou exposição da situação
            financeira de quem participa. Ao mesmo tempo, acesso não significa
            precarização do trabalho clínico: o coletivo busca equilíbrio entre
            acesso, dignidade, responsabilidade clínica e sustentabilidade
            institucional.
          </p>
        </div>
      </div>
    </section>
  );
}