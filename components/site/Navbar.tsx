"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "@/lib/site";
import Logo from "./Logo";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-50 border-b border-neutral-200/70 bg-white/80 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Tambola Zone home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="mx-2 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <Link
            href="/game"
            className="ml-1 inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-600/40 transition hover:brightness-110"
          >
            Play Now
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden dark:border-neutral-800 dark:bg-neutral-950">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/game"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Play Now
          </Link>
        </div>
      )}
    </header>
  );
}
