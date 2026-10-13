import Link from "next/link";
import Logo from "./Logo";

const footerLinks = [
  { href: "/play", label: "Play Housie" },
  { href: "/game", label: "Number Caller" },
  { href: "/tickets", label: "Ticket Generator" },
  { href: "/rules", label: "Rules & Patterns" },
  { href: "/history", label: "My Games" },
  { href: "/dashboard", label: "Members" },
];

export default function Footer() {
  return (
    <footer className="no-print relative mt-auto w-full overflow-hidden border-t border-primary/20 bg-[#060606]">
      <div aria-hidden className="pointer-events-none absolute inset-0 canvas-vignette opacity-70" />
      <div className="marquee-bulbs mx-auto mb-10 max-w-6xl px-4 sm:px-6 lg:px-8" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-10 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Online Tambola &amp; Housie with a professional voice caller, auto-call mode, and a certified
            3&times;9 ticket generator. Create a private room and play with your friends in real time.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden />
            <span className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-on-surface-variant">
              Play responsibly · 18+
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-[0.28em] text-primary/80">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body-md text-body-md text-on-surface-variant transition hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-[0.28em] text-primary/80">Play</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/play" className="font-body-md text-body-md text-on-surface-variant transition hover:text-primary">
                  Create a room
                </Link>
              </li>
              <li>
                <Link href="/rules" className="font-body-md text-body-md text-on-surface-variant transition hover:text-primary">
                  How to play
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative border-t border-primary/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-label-md text-label-md text-on-surface-variant">
            © {new Date().getFullYear()} Golden Tambola · Built for house parties everywhere.
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-[0.22em] text-on-surface-variant/80">
            Made for players, not spectators
          </span>
        </div>
      </div>
    </footer>
  );
}
