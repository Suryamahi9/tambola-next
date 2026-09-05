"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "@/lib/site";
import Logo from "./Logo";
import AuthNav from "./AuthNav";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-6">
        <Link href="/" aria-label="Grand Tambola home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden xl:flex items-center gap-1 bg-surface-container-lowest/60 p-1 rounded-xl">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`px-4 py-2 rounded-lg font-body-md text-body-md transition-all duration-200 ${
                  active
                    ? "bg-surface-container-high text-primary font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-5 py-2.5 font-headline-sm text-headline-sm text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.3)] transition-all hover:shadow-[0_0_32px_rgba(245,158,11,0.5)] active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">stadia_controller</span>
            Play Now
          </Link>
          <AuthNav variant="desktop" />
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <Link
            href="/play"
            className="mr-1 inline-flex items-center rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-4 py-2 font-headline-sm text-headline-sm text-on-primary-container shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            Play
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-on-surface-variant hover:text-on-surface"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-surface/95 backdrop-blur-xl px-4 pb-4 pt-2 xl:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/play"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-5 py-2.5 text-center font-headline-sm text-headline-sm text-on-primary-container"
          >
            Play Now
          </Link>
          <AuthNav variant="mobile" />
        </div>
      )}
    </header>
  );
}