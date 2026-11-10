import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import PublicShell from "@/components/PublicShell";
import { SITE_URL } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas",
    template: "%s — CPEPA",
  },
  description:
    "Escuta psicanalítica para mães, pais e responsáveis por pessoas autistas. Um espaço para falar sobre o que a experiência do autismo produz em suas vidas. Antes de cuidar, é preciso poder falar.",
  openGraph: {
    title: "CPEPA — Coletivo Psicanalítico de Escuta de Pais de Autistas",
    description:
      "Escuta psicanalítica para mães, pais e responsáveis por pessoas autistas. Antes de cuidar, é preciso poder falar.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${sourceSerif.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <PublicShell>
          <main id="conteudo" className="flex-1">
            {children}
          </main>
        </PublicShell>
      </body>
    </html>
  );
}