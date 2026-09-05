import Link from "next/link";

function SectionLabel({ children, color = "text-primary" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`font-label-sm text-label-sm uppercase tracking-widest font-bold ${color}`}>{children}</span>
  );
}

const statCards = [
  { value: "250,000+", label: "Games Hosted", color: "text-primary" },
  { value: "₹1.4 Cr", label: "Pools Awarded", color: "text-secondary" },
  { value: "99.98%", label: "Sync Uptime", color: "text-tertiary-fixed" },
  { value: "0.02s", label: "Claim Verification", color: "text-on-surface" },
];

const engineCards = [
  {
    id: "visual",
    eyebrow: "Visual Engine",
    chip: "11 Gloss Themes",
    chipClass: "text-primary-fixed",
    title: "Designer 3D Tambola Slips",
    body: "Alternating ticket shells rendered with deep iridescent finishes, crisp foil numbering, and responsive micro-dab animations.",
    glow: "bg-primary/10 group-hover:bg-primary/20",
    footerLeft: "Watermark: NAVEEN CHERRY",
    footerRight: (
      <>
        Custom Foil <span className="material-symbols-outlined text-sm">verified</span>
      </>
    ),
    children: (
      <div className="mt-6 space-y-3">
        <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-inner">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-2">
            <span className="text-primary font-bold">TICKET #TK-4821 • CREAM CARNIVAL</span>
            <span className="text-secondary font-mono">EARLY 5 READY</span>
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {["7", "•", "24", "•", "49", "•", "•", "77", "88"].map((d, i) =>
              d === "•" ? (
                <div key={i} className="h-9 rounded-lg bg-surface-container/30 flex items-center justify-center text-outline/30">
                  •
                </div>
              ) : i === 7 ? (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-ticket-digit text-ticket-digit font-bold shadow-[0_0_14px_rgba(245,158,11,0.5)]"
                >
                  {d}
                </div>
              ) : (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-surface-container-highest flex items-center justify-center font-ticket-digit text-ticket-digit text-on-surface font-bold"
                >
                  {d}
                </div>
              )
            )}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-container-lowest/50 backdrop-blur-md shadow-inner opacity-85">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-2">
            <span className="text-tertiary font-bold">TICKET #TK-4822 • ROSE GOLD VIP</span>
            <span className="text-on-surface-variant font-mono">1/5 DABBED</span>
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {["•", "12", "•", "36", "•", "54", "63", "•", "82"].map((d, i) =>
              d === "•" ? (
                <div key={i} className="h-8 rounded-lg bg-surface-container/30 flex items-center justify-center text-outline/30">
                  •
                </div>
              ) : d === "12" ? (
                <div
                  key={i}
                  className="h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center font-ticket-digit text-ticket-digit text-xs font-bold shadow-[0_0_10px_rgba(0,165,114,0.4)]"
                >
                  {d}
                </div>
              ) : (
                <div
                  key={i}
                  className="h-8 rounded-lg bg-surface-container-highest flex items-center justify-center font-ticket-digit text-ticket-digit text-xs text-on-surface"
                >
                  {d}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "caller",
    eyebrow: "Live Caller HUD",
    chip: (
      <>
        <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span> AUTOCALL: 5.0s
      </>
    ),
    chipClass: "text-secondary font-mono",
    title: "Dynamic 90-Ball Cage",
    body: "Real-time number flip with multi-lingual audio callouts (Hindi, English, Telugu) and automatic board lighting.",
    glow: "bg-secondary/10 group-hover:bg-secondary/20",
    footerLeft: "Drawn: 42 / 90 Numbers",
    footerRight: <span className="text-secondary font-mono">Last 5: 14, 82, 09, 33, 77</span>,
    children: (
      <div className="mt-6 p-4 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-inner flex flex-col items-center">
        <div className="relative flex items-center justify-center my-2">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary via-primary-container to-primary-fixed p-1 shadow-[0_0_36px_rgba(245,158,11,0.4)] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-surface-container-lowest flex flex-col items-center justify-center">
              <span className="font-label-sm text-[10px] text-primary uppercase font-bold tracking-widest leading-none">CURRENT</span>
              <span className="font-caller-announcement text-[56px] text-primary-fixed leading-none mt-1">77</span>
            </div>
          </div>
          <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse pointer-events-none"></div>
        </div>
        <div className="text-center mt-2">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">“Sunset Strip — Double Lucky 77”</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Telugu: “Ebbadi Yedu” • Hindi: “Satattar”</p>
        </div>
        <div className="w-full mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-high text-on-surface">
          <span className="font-label-sm text-label-sm font-bold">Speed: 5s / Ball</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-mono">3s</span>
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-xs font-mono font-bold">5s</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-mono">8s</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "party",
    eyebrow: "Multiplayer Sync",
    chip: "ROOM #482",
    chipClass: "text-primary font-mono font-bold",
    title: "Razorpay Party Arena",
    body: "Zero-stall 2-second HTTP polling cluster with automated instant prize payouts directly linked to game claims.",
    glow: "bg-tertiary-container/15 group-hover:bg-tertiary-container/30",
    footerLeft: "Razorpay Fast Checkout",
    footerRight: <span className="text-secondary font-semibold">100% Tamper Proof</span>,
    children: (
      <div className="mt-6 p-4 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-inner space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-label-sm text-[10px] uppercase text-on-surface-variant tracking-wider">Total Prize Pool</span>
            <div className="font-headline-md text-headline-md font-bold text-primary font-ticket-digit">₹12,500</div>
          </div>
          <div className="text-right">
            <span className="font-label-sm text-[10px] uppercase text-on-surface-variant tracking-wider">Capacity</span>
            <div className="font-headline-sm text-headline-sm font-bold text-secondary font-ticket-digit">38 / 50 TIX</div>
          </div>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-secondary-container to-secondary h-full rounded-full w-[76%] transition-all"></div>
        </div>
        <div className="p-2.5 rounded-lg bg-surface-container-high/60 flex flex-col gap-1.5 font-body-sm text-body-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-tertiary-fixed">@HostViktor:</span>
            <span className="text-on-surface-variant font-mono">14:02:18</span>
          </div>
          <p className="text-on-surface text-xs leading-snug">“Call 77 locked. Any claims for Early 5? 3 players sitting at 4 numbers!”</p>
          <div className="flex items-center gap-1 text-[11px] text-secondary font-medium">
            <span className="material-symbols-outlined text-xs">bolt</span> Bot Announcer: Priya M. verified Early 5!
          </div>
        </div>
      </div>
    ),
  },
];

const featureCards = [
  {
    icon: "volume_up",
    iconClass: "bg-primary-container/20 text-primary",
    label: "AUDIO SYNTHESIS SUITE",
    labelClass: "text-primary",
    title: "1–90 Dynamic Caller Engine",
    body: "Crystal-clear synthetic Indian English, Hindi, and Telugu real-time caller voices. Select from 4 voice tones (Classic British Club, Mumbai Street Nicknames, Royal VIP Salon, and Fast Esports Announcer) with configurable tempo pacing from 3s to 12s per pull.",
    chips: ["3 Languages", "4 Voice Tones", "Traditional Slang HUD", "Offline Voice Fallback"],
  },
  {
    icon: "print",
    iconClass: "bg-secondary-container/20 text-secondary",
    label: "PRINT & PDF EXPORTER",
    labelClass: "text-secondary",
    title: "Ticket Studio with Watermarking",
    body: "Generate 15 high-density, mathematical-certified unique tickets per batch across 11 designer themes (including Obsidian Noir, Royal Velvet, Emerald Glow, and Festival Gold). Stamp custom watermark identity signatures like \"NAVEEN CHERRY\" to completely halt counterfeit claims.",
    chips: ["15 Per PDF Sheet", "11 Color Themes", "Custom Club Brand Watermarks", "Vector Print Quality"],
  },
  {
    icon: "groups",
    iconClass: "bg-tertiary-container/20 text-tertiary",
    label: "MULTIPLAYER RELIABILITY",
    labelClass: "text-tertiary",
    title: "Tamper-Proof Party Rooms",
    body: "Our ultra-stable 2-second HTTP polling cluster delivers zero WebSocket socket-dropouts even on fluctuating 4G mobile links. Features synchronized 5-second automatic ball draws, server-side tamper verification, and integrated Razorpay cash entry ticketing for up to 50 concurrent players per salon.",
    chips: ["2s HTTP Polling Sync", "50-Seat VIP Cap", "Zero Dropped Draws", "Razorpay Fast Settlement"],
  },
  {
    icon: "verified_user",
    iconClass: "bg-error-container/20 text-primary-fixed",
    label: "ARBITRATION ENGINE",
    labelClass: "text-primary-fixed",
    title: "Instant Auto-Claim Prizes",
    body: "Eliminate shouting and false claim debates. When a player hits Early 5, Top Line, Middle Line, Bottom Line, 4 Corners, Star, or Full House, our server-side engine validates the ticket against drawn history in 20 milliseconds. Valid claims trigger jewel fireworks; bad claims get flagged without stopping game flow.",
    chips: ["Early 5 / Jaldi 5", "Top / Mid / Bottom Lines", "Four Corners & Star", "Full House 1st & 2nd"],
  },
];

const trustCards = [
  {
    icon: "diversity_3",
    iconClass: "text-primary",
    title: "100% Social Friendly",
    body: "Designed for family reunions, club kitty parties, corporate offsites, and community festival stages.",
  },
  {
    icon: "verified",
    iconClass: "text-secondary",
    title: "RNG Algorithm Certified",
    body: "Non-repeating true random seeds prevent biased sequences. Independent shuffle ledger logged for every match.",
  },
  {
    icon: "devices",
    iconClass: "text-tertiary",
    title: "Any Device Instant Play",
    body: "No app installation required. Tap room invite link or scan QR code to immediately mark tickets on any mobile browser.",
  },
];

export default function Landing() {
  return (
    <>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface via-surface-container-lowest to-surface pt-12 pb-24 px-6 md:px-12 xl:px-20">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-primary-container/20 via-tertiary-container/15 to-transparent blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-secondary/10 blur-[140px] pointer-events-none rounded-full"></div>
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-primary/10 blur-[130px] pointer-events-none rounded-full"></div>
        <div className="relative max-w-7xl w-full min-w-0 mx-auto flex flex-col items-center text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 max-w-full px-3 sm:px-4 py-1.5 rounded-full bg-surface-container-high/70 backdrop-blur-md shadow-md mb-6 cursor-default">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-md text-[10px] sm:text-label-md uppercase tracking-[0.14em] sm:tracking-widest text-primary-fixed font-bold">✦ INDIA&apos;S #1 SOCIAL TAMBOLA EXPERIENCE</span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-mono">v4.8 VIP</span>
          </div>
          <h1 className="font-display-hero w-full min-w-0 text-[2.5rem] leading-[1.05] sm:text-6xl sm:leading-[64px] md:text-[76px] md:leading-[82px] text-on-surface tracking-tight max-w-5xl font-extrabold">
            Classic Housie. <span className="bg-gradient-to-r from-primary-fixed via-primary to-primary-container bg-clip-text text-transparent">Midnight Thrills.</span> Real-Time Celebrations.
          </h1>
          <p className="mt-6 font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
            Host live games with custom voice calling, generate 15 designer print tickets in 11 themes with custom watermarks, or launch synchronized 50-player Razorpay party rooms with instant automated pattern verification.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 w-full max-w-3xl">
            <Link
              href="/game"
              className="group relative px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed text-on-primary-container font-headline-sm text-headline-sm flex items-center gap-3 shadow-[0_0_32px_rgba(245,158,11,0.35)] hover:shadow-[0_0_42px_rgba(245,158,11,0.55)] transition-all duration-300 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: `"FILL" 1` }}>campaign</span>
              <span>Launch Live Caller</span>
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <Link
              href="/play"
              className="px-7 py-3.5 rounded-xl bg-surface-container-high/90 hover:bg-surface-container-highest text-secondary-fixed font-headline-sm text-headline-sm flex items-center gap-2.5 backdrop-blur-xl shadow-lg transition-all duration-300"
            >
              <span className="material-symbols-outlined text-secondary text-xl">stadia_controller</span>
              <span>Enter Party Room</span>
            </Link>
            <Link
              href="/tickets"
              className="px-6 py-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-body-lg text-body-lg flex items-center gap-2 shadow-md transition-all duration-200"
            >
              <span className="material-symbols-outlined text-primary text-lg">local_activity</span>
              <span>Generate Designer Tickets</span>
            </Link>
            <Link
              href="/rules"
              className="px-5 py-3.5 rounded-xl bg-surface-container-lowest/80 hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg flex items-center gap-2 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-base">rule</span>
              <span>View Rules & Patterns</span>
            </Link>
          </div>
          <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl p-4 rounded-2xl bg-surface-container-low/70 backdrop-blur-xl shadow-xl">
            {statCards.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center p-3 text-center">
                <span className={`font-headline-lg text-headline-lg font-bold font-ticket-digit ${s.color}`}>{s.value}</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE STAGE ARCHITECTURE ─────────────────────────── */}
      <section className="w-full px-6 md:px-12 xl:px-20 -mt-10 pb-20 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <SectionLabel>LIVE STAGE ARCHITECTURE</SectionLabel>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">Engine Showcases in Action</h2>
            </div>
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-md text-label-md">
              <span className="w-2 h-2 rounded-full bg-secondary"></span> Auto-Sync Cluster Active
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {engineCards.map((card) => (
              <div
                key={card.id}
                className="group relative rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
              >
                <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${card.glow}`}></div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full bg-surface-container-high font-label-sm text-label-sm font-bold uppercase tracking-wider ${card.chipClass}`}>
                      {card.eyebrow}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{card.chip}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{card.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">{card.body}</p>
                  {card.children}
                </div>
                <div className="mt-6 pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>{card.footerLeft}</span>
                  <span className="text-primary font-semibold flex items-center gap-1">{card.footerRight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="w-full overflow-hidden py-20 px-6 md:px-12 xl:px-20 bg-surface-container-lowest/60" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel>BUILT FOR PRO CLUB HOSTS & FESTIVALS</SectionLabel>
            <h2 className="font-headline-lg text-headline-lg md:text-[40px] md:leading-[48px] text-on-surface font-extrabold tracking-tight mt-2">
              Engineered for High-Stakes Thrill. Perfected for Fair Play.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">
              Every layer of the Grand Tambola stack was rebuilt from ground zero to eliminate caller confusion, duplicate claims, and ticket fraud.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featureCards.map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-2xl bg-surface-container-low shadow-xl flex flex-col justify-between group hover:bg-surface-container transition-colors duration-300"
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${f.iconClass}`}>
                    <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                  </div>
                  <SectionLabel color={f.labelClass}>{f.label}</SectionLabel>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold mt-1">{f.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">{f.body}</p>
                </div>
                <div className="mt-8 pt-6 flex flex-wrap gap-2">
                  {f.chips.map((c) => (
                    <span key={c} className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-mono text-on-surface">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIP HOST CLEARANCE ──────────────────────────────── */}
      <section className="w-full py-20 px-6 md:px-12 xl:px-20 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm uppercase font-bold tracking-wider mb-4">
                  <span className="material-symbols-outlined text-sm">lock_open</span> VIP HOST CLEARANCE
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">
                  Host Live Clubs, Gated Tournaments & Kitty Parties
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
                  Invite-only member access for authorized callers & club hosts. Get access to customized branded ticket
                  templates, auto-payout routing, audio voice customizers, and deep match analytical exports.
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <Link
                  href="/login"
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-primary via-primary-fixed-dim to-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(255,185,95,0.3)] hover:shadow-[0_0_32px_rgba(255,185,95,0.5)] transition-all"
                >
                  <span className="material-symbols-outlined">badge</span>
                  <span>Caller & Host Sign In</span>
                </Link>
                <Link
                  href="/game"
                  className="w-full px-6 py-3.5 rounded-xl bg-surface-container-highest/80 hover:bg-surface-bright text-on-surface font-body-md text-body-md flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">play_circle</span>
                  <span>Test Free Practice Caller</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ROW ───────────────────────────────────────── */}
      <section className="w-full pb-20 px-6 md:px-12 xl:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustCards.map((t) => (
            <div key={t.title} className="p-6 rounded-2xl bg-surface-container-lowest/80 shadow-lg flex items-start gap-4">
              <span className={`material-symbols-outlined text-3xl ${t.iconClass}`}>{t.icon}</span>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t.title}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}