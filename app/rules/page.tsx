import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "The official Tambola / Housie rulebook — ticket layout, how numbers are called, win patterns (Early Five, Top Line, Full House) and how our generator follows the rules.",
};

const winPatterns = [
  {
    icon: "🖐️",
    name: "Early Five",
    desc: "The first player to mark any 5 numbers on their ticket.",
  },
  {
    icon: "📏",
    name: "Top Line / Middle Line / Bottom Line",
    desc: "The first player to complete all 5 numbers in one full row.",
  },
  {
    icon: "🏆",
    name: "Full House",
    desc: "The first player to mark all 15 numbers on their ticket. Game over — full house wins!",
  },
];

export default function RulesPage() {
  return (
    <div className="carnival-glow mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-on-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
        Rulebook
      </span>
      <h1 className="gold-text mt-4 font-headline-lg text-headline-lg font-bold tracking-tight">
        How to Play Tambola
      </h1>
      <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
        Tambola (also known as Housie or Bingo) is a game of luck for 2 to 100+
        players. It&apos;s perfect for house parties, family gatherings, clubs and
        community fundraisers.
      </p>
      <div className="marquee-bulbs mt-6" aria-hidden />

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
            1. The Ticket
          </h2>
          <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Each player gets a ticket with a 3×9 grid containing exactly 15 numbers:
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              "Each row has exactly 5 numbers and 4 blank cells.",
              "Each column has 1–3 numbers, and no column is completely empty.",
              "Column 1 holds 1–9, column 2 holds 10–19, and so on up to column 9 holding 80–90.",
              "Numbers are arranged ascending left-to-right in every row and top-to-bottom in every column.",
              "No number ever repeats on a ticket.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-body-sm text-body-sm text-on-surface-variant/70">
            Use our{" "}
            <Link href="/tickets" className="font-semibold text-primary hover:text-primary-fixed hover:underline">
              Ticket Generator
            </Link>{" "}
            to create tickets that satisfy every rule automatically.
          </p>
        </section>

        <div className="stub-divider" aria-hidden />

        <section>
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
            2. Calling Numbers
          </h2>
          <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">
            A host draws numbers one at a time from 1 to 90 and announces them. Each
            player marks the number on their ticket if they have it. The host keeps
            going until someone claims a win. Our{" "}
            <Link href="/game" className="font-semibold text-primary hover:text-primary-fixed hover:underline">
              Number Caller
            </Link>{" "}
            picks numbers at random — nothing can be tampered with.
          </p>
        </section>

        <div className="stub-divider" aria-hidden />

        <section>
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
            3. Win Patterns
          </h2>
          <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">
            Hosts usually play with two or three announced prizes. The most common
            are:
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {winPatterns.map((p) => (
              <div
                key={p.name}
                className="glass rounded-2xl border border-white/10 p-5 shadow-xl shadow-black/40"
              >
                <span className="text-2xl">{p.icon}</span>
                <p className="mt-3 font-label-md text-label-md font-bold text-on-surface">{p.name}</p>
                <p className="mt-1.5 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="stub-divider" aria-hidden />

        <section>
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
            4. House Rules
          </h2>
          <ul className="mt-4 space-y-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            <li className="flex gap-3">
              <span className="font-bold text-primary">01</span>
              When a player calls a win, the game pauses and their ticket is checked
              against the numbers already called.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">02</span>
              A false claim (the pattern isn&apos;t complete) means the player is
              disqualified from that prize.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">03</span>
              Full House must be called before the host draws the next number, or the
              claim is void.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">04</span>
              The host&apos;s decision on all claims is final.
            </li>
          </ul>
        </section>

        <div className="stub-divider" aria-hidden />

        <section>
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
            5. Ready to Play?
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/game"
              className="gold-face gold-sheen relative inline-flex items-center overflow-hidden rounded-full px-6 py-3 font-headline-sm text-headline-sm transition-transform hover:-translate-y-0.5"
            >
              Open the Caller
            </Link>
            <Link
              href="/tickets"
              className="inline-flex items-center rounded-full border border-primary/45 bg-white/[0.02] px-6 py-3 font-headline-sm text-headline-sm text-primary-fixed transition hover:border-primary hover:bg-primary/10"
            >
              Generate Tickets
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
