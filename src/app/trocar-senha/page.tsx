import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import TrocarSenhaForm from "./TrocarSenhaForm";

export const metadata = {
  title: "Defina sua nova senha",
  robots: { index: false, follow: false },
};

export default async function TrocarSenhaPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login?redirectTo=/trocar-senha");

  return (
    <section className="py-16">
      <div className="container-site mx-auto px-4 max-w-md">
        <header className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-semibold text-brand-950">
            Defina sua nova senha
          </h1>
          <p className="mt-3 leading-relaxed text-brand-900/80">
            Por segurança, você precisa trocar a senha inicial antes de continuar.
          </p>
        </header>
        <TrocarSenhaForm />
      </div>
    </section>
  );
}
