import Link from "next/link";

const features = [
  {
    icon: "🎙️",
    title: "Voice in 3 Languages",
    desc: "Announcements in English, हिंदी and తెలుగు. Hindi & Telugu use bundled recordings; English uses your device voice.",
  },
  {
    icon: "⚡",
    title: "Auto-Call Mode",
    desc: "Set a pace from 2.5s to 8s and let the host run the entire game hands-free — perfect for projecting on a TV.",
  },
  {
    icon: "🎫",
    title: "Certified Ticket Generator",
    desc: "Every ticket passes the full 3×9 rule check: 15 numbers, 5 per row, 1–3 per column, ascending, no repeats.",
  },
  {
    icon: "📚",
    title: "Full Set (1–90) Books",
    desc: "Generate an official 6-ticket book where every number 1 to 90 appears exactly once across the set.",
  },
  {
    icon: "📊",
    title: "Live Reports",
    desc: "Export the night's game as a .txt or a styled PDF report, or copy the called numbers in one tap.",
  },
  {
    icon: "💾",
    title: "Auto-Save & Resume",
    desc: "Progress persists in your browser. Close the tab, come back later — the board is exactly where you left it.",
  },
];

const steps = [
  {
    num: "01",
    title: "Generate tickets",
    desc: "Pick random tickets for your players or a full 1–90 set, and print or share them in seconds.",
  },
  {
    num: "02",
    title: "Open the caller",
    desc: "Choose English, Hindi or Telugu voice, then call numbers manually or let auto mode run the show.",
  },
  {
    num: "03",
    title: "Declare the winners",
    desc: "Early Five, lines and Full House — pause, verify, and hand out the prizes.",
  },
];

const plans = [
  {
    name: "Family Night",
    tag: "Perfect for home",
    highlight: false,
    desc: "A quick game for friends and family on a single device.",
    cta: "Start Playing",
    href: "/game",
  },
  {
    name: "Party Host",
    tag: "Most popular",
    highlight: true,
    desc: "Project the caller on a big screen and run a full evening with multiple sets.",
    cta: "Open the Caller",
    href: "/game",
  },
  {
    name: "Community / Club",
    tag: "Fundraisers & events",
    highlight: false,
    desc: "Organize ticket sales, print batches, and host 100+ player nights with ease.",
    cta: "Generate Tickets",
    href: "/tickets",
  },
];

const testimonials = [
  {
    quote:
      "We host Tambola every Diwali for 60+ neighbours. The Telugu voice is a game-changer — everyone hears the number clearly.",
    name: "Sandeep R.",
    role: "Community host, Hyderabad",
  },
  {
    quote:
      "The ticket generator is the first one that actually follows the rules. Columns sorted, 5 per row, nothing messed up.",
    name: "Priya M.",
    role: "School fundraiser organizer",
  },
  {
    quote:
      "Plugged a laptop into the TV, hit auto mode, and ran a 90-number game without touching anything. Brilliant.",
    name: "Arjun K.",
    role: "House-party host, Bengaluru",
  },
];

function SectionHeading({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
        {kicker}
      </span>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
        {title}
      </h2>
      {sub && <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">{sub}</p>}
    </div>
  );
}

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        kicker="Features"
        title="Everything a host needs, nothing they don't"
        sub="Built for real Tambola nights — from quick family games to 100+ player community events."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass group rounded-2xl border border-white/10 p-6 transition hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-900/20"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/10 text-xl transition group-hover:bg-violet-600 group-hover:text-white">
              {f.icon}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-neutral-900 dark:text-white">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="How it works"
          title="Host a game in three steps"
          sub="No account, no downloads, no setup — just open, generate and play."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-full top-8 hidden w-8 -translate-x-1/2 border-t-2 border-dashed border-violet-400 md:block"
                />
              )}
              <div className="glass rounded-2xl border border-white/10 p-6">
                <span className="font-display text-4xl font-bold text-violet-600/20 dark:text-violet-500/30">
                  {s.num}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-neutral-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        kicker="Plans"
        title="One plan for everyone: Free"
        sub="The whole platform is free and always will be. Pick the setup that matches your night."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-3xl border p-7 ${
              p.highlight
                ? "border-transparent bg-gradient-to-b from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-600/30"
                : "glass border-white/10"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-600 shadow">
                {p.tag}
              </span>
            )}
            <p className={`text-xs font-bold uppercase tracking-wider ${p.highlight ? "text-white/70" : "text-violet-600 dark:text-violet-400"}`}>
              {p.tag}
            </p>
            <h3 className={`mt-2 font-display text-2xl font-bold ${p.highlight ? "text-white" : "text-neutral-900 dark:text-white"}`}>
              {p.name}
            </h3>
            <p className={`mt-1 text-sm font-semibold ${p.highlight ? "text-white/90" : "text-neutral-500 dark:text-neutral-400"}`}>
              ₹0 · Free forever
            </p>
            <p className={`mt-4 flex-1 text-sm leading-relaxed ${p.highlight ? "text-white/85" : "text-neutral-600 dark:text-neutral-400"}`}>
              {p.desc}
            </p>
            <Link
              href={p.href}
              className={`mt-6 rounded-full px-5 py-3 text-center text-sm font-bold transition ${
                p.highlight
                  ? "bg-white text-violet-700 hover:bg-violet-50"
                  : "border border-white/20 text-neutral-100 hover:border-violet-400 hover:text-violet-200"
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading kicker="Testimonials" title="Hosts love it" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="glass rounded-2xl border border-white/10 p-6"
            >
              <div className="flex gap-0.5 text-amber-400" aria-label="5 stars">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-violet-600 to-fuchsia-600 px-6 py-16 text-center sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]"
        />
        <h2 className="relative font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Tonight&apos;s Tambola starts here
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/85">
          Generate tickets, open the caller, pick a language and go. Free, fast and
          on every screen in the house.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/game"
            className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-violet-50"
          >
            Play the Game
          </Link>
          <Link
            href="/tickets"
            className="rounded-full border border-white/60 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Make Tickets
          </Link>
        </div>
      </div>
    </section>
  );
}
