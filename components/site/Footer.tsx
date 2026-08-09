import Link from "next/link";
import { navLinks, siteConfig } from "@/lib/site";
import Logo from "./Logo";

const featureLinks = [
  { href: "/game", label: "Number Caller" },
  { href: "/game", label: "Auto Mode" },
  { href: "/tickets", label: "Ticket Generator" },
  { href: "/tickets", label: "Full Set (1-90)" },
];

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/">
              <Logo />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {siteConfig.tagline}. Free, no sign-up, works on any device — from
              your phone to the living-room TV.
            </p>
            <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
              Caller audio speaks English, हिंदी and తెలుగు.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-600 transition hover:text-violet-600 dark:text-neutral-400 dark:hover:text-violet-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Features
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {featureLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-neutral-600 transition hover:text-violet-600 dark:text-neutral-400 dark:hover:text-violet-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-6 sm:flex-row dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Made for house parties, clubs and community Tambola nights.
          </p>
        </div>
      </div>
    </footer>
  );
}
