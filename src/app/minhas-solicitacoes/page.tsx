import { Suspense } from "react";
import MinhasSolicitacoesContent from "./MinhasSolicitacoesContent";

export default async function MinhasSolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ resp?: string }>;
}) {
  const { resp } = await searchParams;

  return (
    <section className="py-16">
      <div className="container-site mx-auto px-4 max-w-4xl">
        <header className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Minhas Solicitações
          </h1>
          <p className="mt-3 leading-relaxed text-brand-900/80">
            Acompanhe o status das suas solicitações de escuta e veja os
            psicanalistas indicados.
          </p>
        </header>
        {resp ? (
          <Suspense fallback={<div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center animate-pulse">Carregando...</div>}>
            <MinhasSolicitacoesContent responsavelId={resp} />
          </Suspense>
        ) : (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
            <p className="text-brand-900/80">
              Para ver suas solicitações, acesse pelo link recebido após o
              envio do formulário.
            </p>
            <a href="/solicitar-escuta" className="btn-secondary mt-6 inline-block">
              Fazer nova solicitação
            </a>
          </div>
        )}
      </div>
    </section>
  );
}