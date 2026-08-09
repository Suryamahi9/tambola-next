import Link from "next/link";
import { generateTicket } from "@/lib/ticket";

// Real ticket, generated server-side at build time.
const heroTicket = generateTicket();

const stats = [
  { value: "1–90", label: "numbers on the board" },
  { value: "3", label: "caller languages" },
  { value: "15", label: "numbers per ticket" },
  { value: "100%", label: "free, no sign-up" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background art */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600/25 via-fuchsia-600/20 to-amber-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_60%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
            </span>
            Host your next house-party game night
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white">
            The{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 bg-clip-text text-transparent">
              Tambola &amp; Housie
            </span>{" "}
            platform you&apos;ll actually enjoy
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
            A professional number caller that announces in English, हिंदी and
            తెలుగు, a certified ticket generator that follows every official rule,
            and zero setup — works on phones, laptops and the living-room TV.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/game"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110"
            >
              Start the Game
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-sm font-bold text-neutral-800 transition hover:border-violet-500 hover:text-violet-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              Generate Tickets
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="order-2 text-xs text-neutral-500 dark:text-neutral-400">{s.label}</dt>
                <dd className="font-display text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual: floating ticket + board chips */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-3xl border border-neutral-200/80 bg-white/90 p-5 shadow-2xl shadow-violet-900/10 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">🎫 Tambola Ticket</span>
              <span className="font-mono text-[11px] text-neutral-400">#01 / 15</span>
            </div>
            <div className="ticket-grid text-neutral-800 dark:text-neutral-100">
              {heroTicket.flatMap((row, r) =>
                row.map((v, c) => (
                  <div key={`${r}-${c}`} className={v === null ? "bg-transparent text-transparent" : "bg-white dark:bg-neutral-900"}>
                    {v ?? ""}
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[7, 22, 41, 63, 78].map((n) => (
                <span
                  key={n}
                  className="flex h-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white"
                >
                  {n}
                </span>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] font-medium text-neutral-400">
              Live board · auto mode · voice in 3 languages
            </p>
          </div>

          <div className="absolute -left-4 -top-6 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-xs font-semibold text-neutral-500">Last called</p>
            <p className="font-display text-2xl font-bold text-violet-600">56</p>
          </div>
          <div className="absolute -bottom-6 -right-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-xs font-semibold text-neutral-500">🎙️ Speaking</p>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">छप्पन · ఏబై ఆరు</p>
          </div>
        </div>
      </div>
    </section>
  );
}
