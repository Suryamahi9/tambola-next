"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/site";
import Logo from "./Logo";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || pathname !== "/";

  return (
    <header
      className={`no-print sticky top-0 z-50 transition-colors duration-500 ${
        solid
          ? "border-b border-primary/25 bg-[#0b0b0b]/85 backdrop-blur-xl shadow-[0_10px_40px_-18px_rgba(0,0,0,0.9)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px gold-rule transition-opacity duration-500 ${
          solid ? "opacity-100" : "opacity-0"
        }`}
      />
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Golden Tambola home" onClick={() => setOpen(false)} className="reveal-in">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 rounded-xl border border-primary/15 bg-white/[0.03] p-1 backdrop-blur-sm xl:flex">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-4 py-2 font-body-md text-body-md transition-colors duration-200 ${
                  active ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {link.label}
                {active && (
                  <span aria-hidden className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 px-4 py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant transition hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">shield_person</span>
            Members
          </Link>
          <Link
            href="/play"
            className="gold-face gold-sheen relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 font-headline-sm text-headline-sm transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-lg">stadia_controller</span>
            Play Now
          </Link>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <Link
            href="/play"
            className="gold-face inline-flex items-center rounded-xl px-3.5 py-2 font-headline-sm text-headline-sm"
          >
            Play
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 text-on-surface transition hover:border-primary/60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Slide-out mobile menu */}
      <div
        className={`fixed inset-0 top-20 z-40 overflow-hidden xl:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute right-0 top-0 h-[calc(100vh-5rem)] w-[82%] max-w-sm overflow-y-auto border-l border-primary/25 bg-[#0d0d0d]/98 px-5 py-6 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <p className="mb-3 font-label-sm text-label-sm uppercase tracking-[0.28em] text-primary/70">Menu</p>
          <div className="flex flex-col">
            {navLinks.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-3 font-body-lg text-body-lg transition ${
                    active ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-primary/25 px-5 py-3 text-center font-headline-sm text-headline-sm text-on-surface transition hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg">shield_person</span>
            Members
          </Link>
          <Link
            href="/play"
            onClick={() => setOpen(false)}
            className="gold-face mt-3 block rounded-xl px-5 py-3 text-center font-headline-sm text-headline-sm"
          >
            Play Now
          </Link>
        </div>
      </div>
    </header>
  );
}
