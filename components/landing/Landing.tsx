import Link from "next/link";
import TambolaSceneLoader from "./TambolaSceneLoader";
import Reveal from "@/components/site/Reveal";
import CursorGlow from "@/components/site/CursorGlow";

const games = [
  {
    id: "party",
    icon: "groups",
    badge: "Multiplayer",
    title: "Party Rooms",
    body: "Create a private room, buy 1–5 tickets each, and play together in real time. The host starts the round once 15 tickets are in.",
    href: "/play",
    cta: "Enter Room",
    accent: "text-primary",
    ring: "group-hover:border-primary/70",
    halo: "bg-primary/10 group-hover:bg-primary/20",
  },
  {
    id: "caller",
    icon: "campaign",
    badge: "Voice Caller",
    title: "Number Caller",
    body: "Run a live Housie session with automatic draws and a natural caller voice in English, Hindi or Telugu.",
    href: "/game",
    cta: "Open Caller",
    accent: "text-secondary",
    ring: "group-hover:border-secondary/70",
    halo: "bg-secondary/10 group-hover:bg-secondary/20",
  },
  {
    id: "tickets",
    icon: "local_activity",
    badge: "Generator",
    title: "Ticket Generator",
    body: "Generate certified 3×9 tickets in 29 designer themes, add your own watermark, and export a clean print-ready PDF.",
    href: "/tickets",
    cta: "Generate Tickets",
    accent: "text-tertiary",
    ring: "group-hover:border-tertiary/70",
    halo: "bg-tertiary/10 group-hover:bg-tertiary/20",
  },
];

const steps = [
  {
    n: "01",
    icon: "group_add",
    title: "Join or create a room",
    body: "Start a private party room and share the code, or jump into the free number caller.",
  },
  {
    n: "02",
    icon: "confirmation_number",
    title: "Get your tickets",
    body: "Every player receives unique tickets — no two tickets in a room share numbers.",
  },
  {
    n: "03",
    icon: "campaign",
    title: "Follow the numbers",
    body: "Numbers are drawn by the server and announced live. Watch your ticket light up.",
  },
  {
    n: "04",
    icon: "emoji_events",
    title: "Claim your prize",
    body: "Complete a pattern and the win is verified automatically — Full House ends the round.",
  },
];

const features = [
  {
    icon: "record_voice_over",
    title: "Multi-language voice caller",
    body: "Natural English, Hindi and Telugu callouts with four voice tones and adjustable pace.",
  },
  {
    icon: "bolt",
    title: "Hands-free auto-call",
    body: "Let the board run on a timer, or call the next number yourself at any moment.",
  },
  {
    icon: "draw",
    title: "Designer print tickets",
    body: "29 themes, 10 layouts, custom watermarks and one-ticket-per-page PDF export.",
  },
  {
    icon: "verified",
    title: "Honest, server-drawn numbers",
    body: "Every number is picked by the server, so the board can never be tampered with.",
  },
  {
    icon: "emoji_events",
    title: "Instant prize checks",
    body: "Full House, all three lines, Four Corners and Early Five — validated the moment they land.",
  },
  {
    icon: "devices",
    title: "Any device, no install",
    body: "Rooms stay in sync and tickets stay readable on a phone, tablet or desktop.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary/85">
      <span className="h-px w-6 bg-primary/60" aria-hidden />
      {children}
    </span>
  );
}

export default function Landing() {
  return (
    <>
      <CursorGlow />
      <TambolaSceneLoader />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative -mt-20 flex min-h-[100svh] items-center overflow-hidden px-5 pb-24 pt-32 sm:px-8 lg:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 canvas-vignette" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#080808]"
        />
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="reveal-up mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/[0.03] px-4 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              <span className="font-label-sm text-label-sm uppercase tracking-[0.24em] text-primary-fixed">
                Online Tambola &amp; Housie
              </span>
            </div>

            <h1 className="font-display-hero text-[2.6rem] font-bold uppercase leading-[1.02] tracking-[0.01em] text-on-surface reveal-up [animation-delay:60ms] sm:text-6xl md:text-[76px] md:leading-[78px]">
              The <span className="gold-text">Golden</span>
              <br />
              Game Night
            </h1>

            <p className="mx-auto mt-6 max-w-xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant reveal-up [animation-delay:120ms] lg:mx-0">
              Experience Housie in a whole new light. Gather your players, claim your tickets, and enjoy
              unforgettable moments in a world of golden excitement.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3.5 reveal-up [animation-delay:180ms] sm:flex-row lg:justify-start sm:justify-center">
              <Link
                href="/play"
                className="gold-face gold-sheen relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl px-8 py-4 font-headline-sm text-headline-sm transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
              >
                <span className="relative z-10 inline-flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-xl">stadia_controller</span>
                  Play Housie
                </span>
              </Link>
              <Link
                href="#games"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-primary/45 bg-white/[0.02] px-8 py-4 font-headline-sm text-headline-sm text-primary-fixed backdrop-blur-sm transition hover:border-primary hover:bg-primary/10 sm:w-auto"
              >
                <span className="material-symbols-outlined text-xl">explore</span>
                Explore Games
              </Link>
            </div>

            <dl className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 reveal-up [animation-delay:240ms] lg:justify-start">
              {[
                { v: "1–90", l: "Server-drawn balls" },
                { v: "3", l: "Caller languages" },
                { v: "50", l: "Tickets per room" },
              ].map((s) => (
                <div key={s.l} className="text-center lg:text-left">
                  <dt className="font-ticket-digit text-2xl font-bold text-primary-fixed">{s.v}</dt>
                  <dd className="font-label-sm text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── FEATURED GAMES ───────────────────────────────── */}
      <section id="games" className="relative scroll-mt-24 border-t border-primary/10 bg-background px-5 py-20 sm:px-8 lg:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 canvas-vignette opacity-60" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Choose your table</Eyebrow>
            <h2 className="mt-4 font-headline-lg text-headline-lg tracking-tight text-on-surface sm:text-[40px] sm:leading-[48px]">
              Three ways to <span className="gold-text">play</span>
            </h2>
            <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
              Free practice, printable tickets, or a paid private room with your friends.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {games.map((g, i) => (
              <Reveal key={g.id} delay={i * 90}>
                <Link
                  href={g.href}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/20 bg-[#0e0e0e]/90 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 ${g.ring}`}
                >
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full blur-3xl transition-all duration-500 ${g.halo}`}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-white/[0.03]">
                      <span className={`material-symbols-outlined text-3xl ${g.accent}`}>{g.icon}</span>
                    </span>
                    <span className="rounded-full border border-primary/20 bg-white/[0.03] px-3 py-1 font-label-sm text-label-sm uppercase tracking-[0.14em] text-on-surface-variant">
                      {g.badge}
                    </span>
                  </div>
                  <h3 className="relative mt-6 font-headline-md text-headline-md text-on-surface">{g.title}</h3>
                  <p className="relative mt-2 flex-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                    {g.body}
                  </p>
                  <span className="relative mt-6 inline-flex items-center gap-2 font-headline-sm text-headline-sm text-primary-fixed">
                    {g.cta}
                    <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO PLAY ──────────────────────────────────── */}
      <section className="relative border-t border-primary/10 bg-[#0a0a0a] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>How to play</Eyebrow>
            <h2 className="mt-4 font-headline-lg text-headline-lg tracking-tight text-on-surface sm:text-[40px] sm:leading-[48px]">
              From lobby to <span className="gold-text">Full House</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="relative h-full rounded-2xl border border-primary/15 bg-[#0e0e0e] p-7 transition-colors duration-300 hover:border-primary/40">
                  <span className="font-display text-4xl font-bold text-primary/25">{s.n}</span>
                  <span className="material-symbols-outlined mt-4 block text-3xl text-primary">{s.icon}</span>
                  <h3 className="mt-4 font-headline-sm text-headline-sm text-on-surface">{s.title}</h3>
                  <p className="mt-2 font-body-md text-body-md leading-relaxed text-on-surface-variant">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="relative border-t border-primary/10 bg-background px-5 py-20 sm:px-8 lg:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 gold-glow opacity-70" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Built for real game nights</Eyebrow>
            <h2 className="mt-4 font-headline-lg text-headline-lg tracking-tight text-on-surface sm:text-[40px] sm:leading-[48px]">
              Polished where it <span className="gold-text">matters</span>
            </h2>
            <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant">
              Everything below is already live in the game — no placeholders.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-primary/15 bg-white/[0.02] p-6 transition-colors duration-300 hover:border-primary/40 hover:bg-primary/[0.04]">
                  <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                    <span className="material-symbols-outlined text-2xl text-primary">{f.icon}</span>
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">{f.title}</h3>
                    <p className="mt-1.5 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                      {f.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative border-t border-primary/10 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="marble relative overflow-hidden rounded-3xl border border-primary/25 p-9 text-center shadow-[0_30px_90px_-40px_rgba(212,175,55,0.5)] sm:p-14">
              <div aria-hidden className="pointer-events-none absolute inset-0 gold-glow" />
              <div className="relative">
                <Eyebrow>Your table is ready</Eyebrow>
                <h2 className="mx-auto mt-5 max-w-2xl font-headline-lg text-headline-lg tracking-tight text-on-surface sm:text-[40px] sm:leading-[48px]">
                  Host a golden round <span className="gold-text">tonight</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
                  Set up a private room in seconds, share the code, and let the caller do the rest.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                  <Link
                    href="/play"
                    className="gold-face gold-sheen relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl px-8 py-4 font-headline-sm text-headline-sm transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                  >
                    <span className="relative z-10 inline-flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-xl">add_circle</span>
                      Create a Room
                    </span>
                  </Link>
                  <Link
                    href="/game"
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-primary/45 bg-white/[0.02] px-8 py-4 font-headline-sm text-headline-sm text-primary-fixed transition hover:border-primary hover:bg-primary/10 sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-xl">play_circle</span>
                    Try the Caller
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
