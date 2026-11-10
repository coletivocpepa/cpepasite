"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface PsicanalistasListProps {
  initialPsicanalistas: {
    id: string;
    nome: string;
    bio: string | null;
    modalidades: string[];
    valor_simbolico: string | null;
  }[];
  modalidade?: string;
  cidade?: string;
}

export default function PsicanalistasList({
  initialPsicanalistas,
  modalidade,
  cidade,
}: PsicanalistasListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentModalidade = searchParams.get("modalidade") ?? modalidade ?? "todas";
  const currentCidade = searchParams.get("cidade") ?? cidade ?? "";

  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todas" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section className="py-16">
      <div className="container-site mx-auto px-4">
        <header className="mb-12 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-brand-950">
            Psicanalistas do CPEPA
          </h1>
          <p className="mt-3 leading-relaxed text-brand-900/80 max-w-2xl mx-auto">
            Profissionais qualificados, com formação em psicanálise, disponíveis para
            escuta online ou presencial. Use os filtros para encontrar quem melhor atende
            sua necessidade.
          </p>
        </header>

        <form className="mb-10 flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex-1 max-w-xs">
            <label htmlFor="modalidade" className="sr-only">
              Modalidade
            </label>
            <select
              id="modalidade"
              value={currentModalidade}
              onChange={(e) => handleFilterChange("modalidade", e.target.value)}
              className="input w-full"
            >
              <option value="todas">Todas as modalidades</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div className="flex-1 max-w-xs">
            <label htmlFor="cidade" className="sr-only">
              Cidade
            </label>
            <input
              id="cidade"
              type="text"
              value={currentCidade}
              onChange={(e) => handleFilterChange("cidade", e.target.value)}
              placeholder="Filtrar por cidade/UF"
              className="input w-full"
            />
          </div>

          {(currentModalidade !== "todas" || currentCidade) && (
            <button
              type="button"
              onClick={() => router.push(pathname)}
              className="btn-secondary self-end"
            >
              Limpar filtros
            </button>
          )}
        </form>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {initialPsicanalistas.length === 0 ? (
            <p className="col-span-full text-center text-brand-900/70">
              Nenhum psicanalista encontrado com esses filtros.
            </p>
          ) : (
            initialPsicanalistas.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-serif text-xl font-semibold text-brand-950">
                  {p.nome}
                </h3>
                {p.bio && (
                  <p className="mt-3 leading-relaxed text-brand-900/80 line-clamp-3">
                    {p.bio}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {p.modalidades?.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-brand-900/80"
                    >
                      {m === "online" ? "Online" : "Presencial"}
                    </span>
                  ))}
                </div>
                {p.valor_simbolico && (
                  <p className="mt-3 text-sm font-medium text-brand-900">
                    Valor simbólico: {p.valor_simbolico}
                  </p>
                )}
                <Link
                  href={`/psicanalistas/${p.id}`}
                  className="mt-4 inline-block btn-secondary text-sm"
                >
                  Ver perfil
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}