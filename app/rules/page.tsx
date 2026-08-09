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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
        Rulebook
      </span>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
        How to Play Tambola
      </h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        Tambola (also known as Housie or Bingo) is a game of luck for 2 to 100+
        players. It&apos;s perfect for house parties, family gatherings, clubs and
        community fundraisers.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
            1. The Ticket
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-600 dark:text-neutral-400">
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
              <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Use our{" "}
            <Link href="/tickets" className="font-semibold text-violet-600 hover:underline dark:text-violet-300">
              Ticket Generator
            </Link>{" "}
            to create tickets that satisfy every rule automatically.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
            2. Calling Numbers
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-600 dark:text-neutral-400">
            A host draws numbers one at a time from 1 to 90 and announces them. Each
            player marks the number on their ticket if they have it. The host keeps
            going until someone claims a win. Our{" "}
            <Link href="/game" className="font-semibold text-violet-600 hover:underline dark:text-violet-300">
              Number Caller
            </Link>{" "}
            picks numbers at random — nothing can be tampered with.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
            3. Win Patterns
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-600 dark:text-neutral-400">
            Hosts usually play with two or three announced prizes. The most common
            are:
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {winPatterns.map((p) => (
              <div
                key={p.name}
                className="glass rounded-2xl border border-white/10 p-5"
              >
                <span className="text-2xl">{p.icon}</span>
                <p className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">{p.name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
            4. House Rules
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <li className="flex gap-3">
              <span className="font-bold text-violet-500">01</span>
              When a player calls a win, the game pauses and their ticket is checked
              against the numbers already called.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-violet-500">02</span>
              A false claim (the pattern isn&apos;t complete) means the player is
              disqualified from that prize.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-violet-500">03</span>
              Full House must be called before the host draws the next number, or the
              claim is void.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-violet-500">04</span>
              The host&apos;s decision on all claims is final.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
            5. Ready to Play?
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/game"
              className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-600/40 transition hover:brightness-110"
            >
              Open the Caller
            </Link>
            <Link
              href="/tickets"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-neutral-100 transition hover:border-violet-400 hover:text-violet-200"
            >
              Generate Tickets
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
