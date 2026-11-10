"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/components/Header";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-900 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" />
          ) : (
            <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
          )}
        </svg>
      </button>

      {open && (
        <nav
          id="menu-mobile"
          aria-label="Menu móvel"
          className="absolute inset-x-0 top-24 border-b border-brand-100 bg-white px-6 py-6 shadow-lg"
        >
          <ul className="space-y-1">
            {isHome &&
              navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-base font-medium text-brand-900 transition-colors hover:bg-brand-50"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
          </ul>
          <Link
            href="/blog"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-lg px-3 py-2 text-base font-medium text-brand-900 transition-colors hover:bg-brand-50"
          >
            Blog
          </Link>
          <Link
            href="/ebook"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-brand-900 transition-colors hover:bg-brand-50"
          >
            E-book
          </Link>
          <Link
            href="/solicitar-escuta"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Quero ser escutado
          </Link>
        </nav>
      )}
    </div>
  );
}