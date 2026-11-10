import Link from "next/link";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { ADMIN_EMAILS } from "@/lib/admin-emails";
import AdminLogoutButton from "./AdminLogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login?redirectTo=/admin");

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isBlogArea = pathname === "/admin/blog" || pathname.startsWith("/admin/blog/");

  if (!isAdmin && !isBlogArea) {
    redirect("/");
  }

  const navItems = isAdmin
    ? [
        { href: "/admin", label: "Dashboard", icon: "📊" },
        { href: "/admin/analytics", label: "Visitas", icon: "👁️" },
        { href: "/admin/solicitacoes", label: "Solicitações", icon: "📋" },
        { href: "/admin/indicacoes", label: "Indicações", icon: "🔗" },
        { href: "/admin/psicanalistas", label: "Psicanalistas", icon: "👥" },
        { href: "/admin/conteudo", label: "Conteúdo", icon: "📝" },
        { href: "/admin/blog", label: "Blog", icon: "📰" },
        { href: "/admin/ebook", label: "E-book", icon: "▤" },
        { href: "/admin/faq", label: "FAQ", icon: "❓" },
      ]
    : [{ href: "/admin/blog", label: "Meus textos", icon: "📰" }];

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="border-b border-brand-100 bg-white sticky top-0 z-40">
        <div className="container-site mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={isAdmin ? "/admin" : "/admin/blog"}
                className="font-serif text-xl font-semibold text-brand-950"
              >
                {isAdmin ? "CPEPA Admin" : "CPEPA · Área do autor"}
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-brand-700 hover:text-brand-950 flex items-center gap-1"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="py-8">{children}</main>
    </div>
  );
}
