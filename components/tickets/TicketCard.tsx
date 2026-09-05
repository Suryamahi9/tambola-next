import type { CSSProperties } from "react";
import type { Grid } from "@/lib/ticket";

export type TicketStyle =
  | "carnival"
  | "ocean"
  | "rosegold"
  | "emerald"
  | "sunset"
  | "paperwhite"
  | "mint"
  | "lavender"
  | "charcoalgold"
  | "navycream"
  | "plum";

interface Props {
  grid: Grid;
  name?: string;
  index: number;
  total: number;
  called?: ReadonlySet<number>;
  style?: TicketStyle;
}

const STYLE_LABELS: Record<TicketStyle, string> = {
  carnival: "🎡 Carnival",
  ocean: "🌊 Ocean Blue",
  rosegold: "🥀 Rose Gold",
  emerald: "🌲 Emerald Gold",
  sunset: "🌅 Sunset",
  paperwhite: "⚪ Paper White (default)",
  mint: "🌿 Sky Mint",
  lavender: "🔮 Lavender",
  charcoalgold: "🖤 Charcoal Gold",
  navycream: "🎴 Navy Cream",
  plum: "🍇 Plum Dusk",
};

interface ThemeSpec {
  card: string;
  band?: string;
  brand: string;
  serial: string;
  serialMuted: string;
  rule?: string;
  line: string;
  gridText: string;
  num: string;
  filled: string;
  called: string;
  watermark: string;
  foilDark?: boolean;
}

const THEMES: Record<Exclude<TicketStyle, "carnival">, ThemeSpec> = {
  ocean: {
    card: "bg-gradient-to-b from-[#1c3350] to-[#101c2e] rounded-[6px] border border-[#4b6f9d] shadow-[0_10px_28px_rgba(0,0,0,0.4)]",
    band: "bg-gradient-to-r from-[#2c5282] to-[#1b3a5f]",
    brand: "text-[#dbeafe]",
    serial: "text-[#7dd3fc]",
    serialMuted: "text-[#8fb3d9]",
    rule: "bg-[#38bdf8]",
    line: "#7aa2c9",
    gridText: "text-[#7aa2c9]",
    num: "text-white",
    filled: "bg-white/[0.08]",
    called: "bg-[#22d3ee] text-[#062a33]",
    watermark: "rgba(125,211,252,0.12)",
  },
  rosegold: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fdf0ee] to-[#f4d8d3] rounded-[6px] border border-[#b36a5e] shadow-[0_10px_28px_rgba(0,0,0,0.28)]",
    band: "bg-gradient-to-r from-[#8b3742] to-[#a84c5a]",
    brand: "text-[#fdeceb]",
    serial: "text-[#f6c5c0]",
    serialMuted: "text-[#d9a09a]",
    rule: "bg-[#c4543f]",
    line: "#b36a5e",
    gridText: "text-[#b36a5e]",
    num: "text-[#6d2f2a]",
    filled: "bg-[#6d2f2a]/[0.07]",
    called: "bg-[#d94f5e] text-white",
    watermark: "rgba(180,86,94,0.14)",
  },
  emerald: {
    card: "bg-gradient-to-b from-[#0f3d2e] to-[#0a241c] rounded-[6px] border border-[#3f8a68] shadow-[0_10px_28px_rgba(0,0,0,0.4)]",
    band: "bg-gradient-to-r from-[#14532d] to-[#0c3a20]",
    brand: "text-[#d1fae5]",
    serial: "text-[#fbbf24]",
    serialMuted: "text-[#9bc9ae]",
    rule: "bg-[#34d399]",
    line: "#63b48f",
    gridText: "text-[#63b48f]",
    num: "text-white",
    filled: "bg-white/[0.08]",
    called: "bg-[#f6c453] text-[#3b2a05]",
    watermark: "rgba(251,191,36,0.11)",
  },
  sunset: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fff3e0] to-[#fbd8b8] rounded-[6px] border border-[#7a4a21] shadow-[0_10px_28px_rgba(0,0,0,0.28)]",
    band: "bg-gradient-to-r from-[#d96a1d] to-[#b84e10]",
    brand: "text-[#fff7ed]",
    serial: "text-[#ffe1bd]",
    serialMuted: "text-[#e6b48a]",
    rule: "bg-[#fb923c]",
    line: "#7a4a21",
    gridText: "text-[#7a4a21]",
    num: "text-[#5d340e]",
    filled: "bg-[#5d340e]/[0.07]",
    called: "bg-[#f2730f] text-white",
    watermark: "rgba(217,106,29,0.12)",
  },
  paperwhite: {
    foilDark: true,
    card: "bg-gradient-to-b from-white to-[#f6f6f6] rounded-[6px] border border-black shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    brand: "text-black",
    serial: "text-black",
    serialMuted: "text-neutral-500",
    rule: "bg-black/40",
    line: "#000000",
    gridText: "text-[#000000]",
    num: "text-black",
    filled: "bg-black/[0.06]",
    called: "bg-[#d23c2e] text-white",
    watermark: "rgba(0,0,0,0.09)",
  },
  mint: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#ecfbf2] to-[#d3f0e0] rounded-[6px] border border-[#2b9160] shadow-[0_10px_28px_rgba(0,0,0,0.26)]",
    band: "bg-gradient-to-r from-[#15803d] to-[#0d6b35]",
    brand: "text-[#ecfdf5]",
    serial: "text-[#a7f3d0]",
    serialMuted: "text-[#8fceab]",
    rule: "bg-[#34d399]",
    line: "#2b9160",
    gridText: "text-[#2b9160]",
    num: "text-[#0d4f33]",
    filled: "bg-[#0d4f33]/[0.07]",
    called: "bg-[#10b981] text-white",
    watermark: "rgba(43,145,96,0.13)",
  },
  lavender: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#f5f3ff] to-[#e6e0fa] rounded-[6px] border border-[#8a78d1] shadow-[0_10px_28px_rgba(0,0,0,0.26)]",
    band: "bg-gradient-to-r from-[#6d28d9] to-[#5b21b6]",
    brand: "text-[#ede9fe]",
    serial: "text-[#ddd6fe]",
    serialMuted: "text-[#b5a8e3]",
    rule: "bg-[#a78bfa]",
    line: "#6d5bb6",
    gridText: "text-[#6d5bb6]",
    num: "text-[#46357e]",
    filled: "bg-[#46357e]/[0.08]",
    called: "bg-[#8b5cf6] text-white",
    watermark: "rgba(139,120,209,0.13)",
  },
  charcoalgold: {
    card: "bg-gradient-to-b from-[#262626] to-[#171717] rounded-[6px] border border-[#57534e] shadow-[0_10px_28px_rgba(0,0,0,0.4)]",
    brand: "text-[#fef3c7]",
    serial: "text-[#fde68a]",
    serialMuted: "text-[#a8a29e]",
    rule: "bg-[#fbbf24]",
    line: "#a8a29e",
    gridText: "text-[#a8a29e]",
    num: "text-white",
    filled: "bg-white/[0.08]",
    called: "bg-[#fbbf24] text-[#422006]",
    watermark: "rgba(251,191,36,0.11)",
  },
  navycream: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fdf6e8] to-[#f2e3c4] rounded-[6px] border border-[#1e3a5f] shadow-[inset_0_0_0_3px_#fffaf0,0_10px_28px_rgba(0,0,0,0.28)]",
    band: "bg-gradient-to-r from-[#16324f] to-[#244a7e]",
    brand: "text-[#eef2ff]",
    serial: "text-[#bfdbfe]",
    serialMuted: "text-[#a7bdd6]",
    rule: "bg-[#3b82f6]",
    line: "#1e3a5f",
    gridText: "text-[#1e3a5f]",
    num: "text-[#16324f]",
    filled: "bg-[#16324f]/[0.08]",
    called: "bg-[#d92d20] text-white",
    watermark: "rgba(30,58,95,0.16)",
  },
  plum: {
    card: "bg-gradient-to-b from-[#2e1a47] to-[#1a0f2e] rounded-[6px] border border-[#6b4b96] shadow-[0_10px_28px_rgba(0,0,0,0.42)]",
    band: "bg-gradient-to-r from-[#4c1d6e] to-[#2f1149]",
    brand: "text-[#f3e8ff]",
    serial: "text-[#f0abfc]",
    serialMuted: "text-[#b794d6]",
    rule: "bg-[#d946ef]",
    line: "#9f83c9",
    gridText: "text-[#9f83c9]",
    num: "text-white",
    filled: "bg-white/[0.08]",
    called: "bg-[#e0398f] text-white",
    watermark: "rgba(240,171,252,0.11)",
  },
};

const ACCENTS = [
  { ramp: "from-[#19a3bd] to-[#0e7490]", text: "text-[#0e7490]", fill: "bg-[#0e7490]" },
  { ramp: "from-[#e0783a] to-[#c2410c]", text: "text-[#c2410c]", fill: "bg-[#c2410c]" },
  { ramp: "from-[#8b5cf6] to-[#6d28d9]", text: "text-[#6d28d9]", fill: "bg-[#6d28d9]" },
  { ramp: "from-[#2f9e63] to-[#15803d]", text: "text-[#15803d]", fill: "bg-[#15803d]" },
  { ramp: "from-[#ee5a6f] to-[#e11d48]", text: "text-[#e11d48]", fill: "bg-[#e11d48]" },
  { ramp: "from-[#d99024] to-[#b45309]", text: "text-[#b45309]", fill: "bg-[#b45309]" },
  { ramp: "from-[#3b82f6] to-[#1d4ed8]", text: "text-[#1d4ed8]", fill: "bg-[#1d4ed8]" },
  { ramp: "from-[#e2508a] to-[#be185d]", text: "text-[#be185d]", fill: "bg-[#be185d]" },
] as const;

const CARNIVAL_CARD =
  "relative overflow-hidden rounded-[6px] border border-[#2a211a] bg-gradient-to-b from-[#fdf8ec] to-[#f1e6cd] shadow-[inset_0_0_0_3px_#fffdf5,0_10px_28px_rgba(0,0,0,0.3)]";
const CARNIVAL_STAIN =
  "after:pointer-events-none after:absolute after:inset-0 after:z-[1] after:content-[''] after:bg-[radial-gradient(ellipse_at_14%_6%,rgba(120,88,38,0.13),transparent_46%),radial-gradient(ellipse_at_92%_94%,rgba(96,68,30,0.11),transparent_52%)]";

function CarnivalCard({ grid, name, index, total, called }: Omit<Props, "style">) {
  const a = ACCENTS[index % ACCENTS.length];
  const brand = name || "Tambola";
  return (
    <div className={`break-inside-avoid flex ${CARNIVAL_CARD} ${CARNIVAL_STAIN}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
      >
        <span
          className="font-vintage-display whitespace-nowrap text-[22px] font-bold tracking-[0.22em] sm:text-[26px]"
          style={{ color: "rgba(90,60,25,0.13)" }}
        >
          NAVEEN CHERRY
        </span>
      </div>
      <div className={`relative z-[2] w-[14px] rounded-l-[5px] bg-gradient-to-b ${a.ramp}`} aria-hidden="true">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#fff7e6]">
          <span
            className="block text-[7px] font-bold tracking-[0.18em]"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative z-[2] flex items-center gap-2 py-1.5 pl-2 pr-3">
          <span className="font-vintage-display min-w-0 flex-1 truncate text-[11px] font-bold uppercase leading-none tracking-[0.22em] text-[#3a2b1c]">
            ✦ {brand}
          </span>
          <span className={`font-vintage-display shrink-0 text-[10px] font-bold italic tracking-wide ${a.text}`}>
            No. {String(index + 1).padStart(2, "0")}
            <span className="text-[#8a6f4d]"> / {String(total).padStart(2, "0")}</span>
          </span>
        </div>
        <div className={`${a.fill} relative z-[2] mx-2 h-[3px]`} />
        <div className="relative z-[2] p-2 pt-1.5">
          <div className="rounded-[4px] border border-[#2a211a]/90 p-[3px]">
            <div className={`ticket-grid font-vintage-serif text-[#2a211a]`}>
              {grid.flatMap((row, r) =>
                row.map((v, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={v === null ? "bg-transparent" : called?.has(v) ? `${a.fill} font-bold text-white` : "bg-[#2a211a]/[0.05]"}
                  >
                    {v ?? ""}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemedCard({ grid, name, index, total, called, style }: Props & { style: Exclude<TicketStyle, "carnival"> }) {
  const t = THEMES[style];
  const brand = name || "Tambola";
  const foil = t.foilDark ? "ticket-foil-deep" : "ticket-foil";
  const serialRing = "ABCDEFGH"[index % 8];
  const serialId = `#TKT-${String(8901 + index).slice(-4)}-${serialRing}`;
  return (
    <div className={`ticket-3d relative break-inside-avoid overflow-hidden ${t.card}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <span
          className="font-vintage-display whitespace-nowrap text-[24px] font-bold uppercase tracking-[0.28em] sm:text-[34px] rotate-[-8deg]"
          style={{ color: t.watermark }}
        >
          NAVEEN CHERRY
        </span>
      </div>

      {/* Header band */}
      <div className={`relative z-[2] flex items-center gap-2.5 ${t.band ? t.band : ""} px-3 py-2`}>
        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[15px] ${t.rule ? t.rule : ""} text-white shadow`}
        >
          <span className="material-symbols-outlined text-[15px]">military_tech</span>
        </span>
        <span className={`font-vintage-display min-w-0 flex-1 truncate text-[12px] font-bold uppercase leading-none tracking-[0.2em] ${foil}`}>
          ✦ {brand}
        </span>
        <span className={`font-vintage-display shrink-0 text-[11px] font-bold italic tracking-wide ${foil}`}>
          No. {String(index + 1).padStart(2, "0")}
          <span className={t.serialMuted}> / {String(total).padStart(2, "0")}</span>
        </span>
      </div>

      {t.rule && <div className={`relative z-[2] mx-3 mt-0 h-[3px] ${t.rule}`} />}

      <div className="relative z-[2] p-2 pt-1.5">
        <div
          className="rounded-[4px] border p-[3px]"
          style={{ borderColor: t.line }}
        >
          <div
            className={`ticket-grid ${t.gridText}`}
            style={{ ["--ticket-line" as string]: t.line } as CSSProperties}
          >
            {grid.flatMap((row, r) =>
              row.map((v, c) => (
                <div
                  key={`${r}-${c}`}
                  className={
                    v === null
                      ? "bg-transparent"
                      : called?.has(v)
                        ? `${t.called} font-bold`
                        : `${t.filled} ${t.num}`
                  }
                >
                  {v ?? ""}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Serial + barcode footer */}
      <div className={`relative z-[2] flex flex-wrap items-center justify-between gap-2 px-3 pb-2 pt-1 ${t.serialMuted}`}>
        <span className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-widest">
          {serialId}
          <svg className="h-3 w-20" fill="currentColor" viewBox="0 0 100 16" aria-hidden="true">
            {[3,1,4,2,1,3,5,2,4,1,3,2,4,2,1,5,2,3,1,4,2,3,5,2,4,1,3,2,1,4].map((w, idx) => (
              <rect key={idx} height="16" width={w} x={idx * 3.3} y="0"></rect>
            ))}
          </svg>
        </span>
      </div>
    </div>
  );
}

export default function TicketCard(props: Props) {
  if (props.style === "carnival") {
    return <CarnivalCard {...props} />;
  }
  return <ThemedCard {...props} style={props.style ?? "paperwhite"} />;
}

export { STYLE_LABELS };