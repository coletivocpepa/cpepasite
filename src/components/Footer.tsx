import Image from "next/image";
import Link from "next/link";
import { navItems } from "@/components/Header";
import cpepaLogo from "@/assets/logos/CPEPA_LOGO_Trans.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-accent bg-brand-950 text-brand-100">
      <div className="container-site grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Image
            src={cpepaLogo}
            alt="CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas"
            unoptimized
            className="h-12 w-auto"
          />
          <p className="mt-2 text-sm leading-relaxed text-brand-200">
            Coletivo Psicanalítico de Escuta de Pais de Autistas
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-300">
            Escuta psicanalítica para mães e pais de autistas. Um espaço para
            quem também precisa ser escutado.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
            Navegação
          </p>
          <ul className="mt-4 space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-brand-200 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/blog"
                className="text-sm text-brand-200 transition-colors hover:text-white"
              >
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/ebook"
                className="text-sm text-brand-200 transition-colors hover:text-white"
              >
                E-book
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase">
            Escuta
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                href="/solicitar-escuta"
                className="text-sm text-brand-200 transition-colors hover:text-white"
              >
                Solicitar escuta
              </Link>
            </li>
            <li>
              <a
                href="#como-funciona"
                className="text-sm text-brand-200 transition-colors hover:text-white"
              >
                Como funciona
              </a>
            </li>
            <li>
              <a
                href="#valor-simbolico"
                className="text-sm text-brand-200 transition-colors hover:text-white"
              >
                Valor simbólico
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brand-900">
        <div className="container-site flex flex-col gap-3 py-6 text-xs leading-relaxed text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} CPEPA — Coletivo Psicanalítico de Escuta de Pais de
            Autistas
          </p>
          <p>
            Respeito ao sigilo e à ética clínica. Este site não faz promessas
            de cura.
          </p>
        </div>
      </div>
    </footer>
  );
}