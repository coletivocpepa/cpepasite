import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import cpepaLogo from "@/assets/logos/CPEPA_LOGO_AZUL.png";

export const navItems = [
  { href: "#o-cpepa", label: "O CPEPA" },
  { href: "#a-escuta", label: "A Escuta" },
  { href: "#para-pais", label: "Para Pais" },
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#valor-simbolico", label: "Valor Simbólico" },
  { href: "#quem-somos", label: "Quem Somos" },
  { href: "#perguntas-frequentes", label: "Dúvidas" },
];

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/90 backdrop-blur">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
      />
      <div className="container-site flex h-24 items-center justify-between gap-4">
        <Link
          href={isHome ? "#inicio" : "/#inicio"}
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
        >
          <Image
            src={cpepaLogo}
            alt="CPEPA — Escuta de Pais de Autistas"
            priority
            unoptimized
            className="h-[65px] w-auto sm:h-[72px]"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {isHome &&
            navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-brand-800 transition-colors hover:text-brand-600"
              >
                {item.label}
              </a>
            ))}
          <Link
            href="/blog"
            className="text-sm font-medium text-brand-800 transition-colors hover:text-brand-600"
          >
            Blog
          </Link>
          <Link
            href="/ebook"
            className="text-sm font-medium text-brand-800 transition-colors hover:text-brand-600"
          >
            E-book
          </Link>
          <Link
            href="/solicitar-escuta"
            className="inline-flex items-center justify-center rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Quero ser escutado
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
