import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/painel");
  }

  return (
    <section className="py-16">
      <div className="container-site mx-auto px-4 max-w-md">
        <header className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Acesso ao Painel
          </h1>
          <p className="mt-3 leading-relaxed text-brand-900/80">
            Área restrita para psicanalistas do CPEPA.
          </p>
        </header>
        <Suspense fallback={<div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm animate-pulse">Carregando...</div>}>
          <LoginForm redirectTo={redirectTo ?? "/painel"} />
        </Suspense>
      </div>
    </section>
  );
}