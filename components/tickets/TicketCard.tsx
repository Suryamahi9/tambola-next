"use client";

import type { CSSProperties } from "react";
import type { Grid } from "@/lib/ticket";

/** Colour palette — the "shell" of the ticket. */
export type TicketTheme =
  | "paperwhite"
  | "ocean"
  | "rosegold"
  | "emerald"
  | "sunset"
  | "mint"
  | "lavender"
  | "charcoalgold"
  | "navycream"
  | "plum"
  | "crimson"
  | "cobalt"
  | "honey"
  | "matcha"
  | "wine"
  | "onyx"
  | "graphite"
  | "peach"
  | "beryl"
  | "storm"
  | "mocha"
  | "lagoon"
  | "arctic"
  | "iris"
  | "pines"
  | "stone"
  | "print"
  | "dots"
  | "custom";

/** Structural layout — the "cut" of the ticket. */
export type TicketDesign =
  | "classic"
  | "carnival"
  | "stub"
  | "metro"
  | "aura"
  | "blueprint";

/** Back-compat: `style` is the theme selector. */
export type TicketStyle = TicketTheme;

interface Props {
  grid: Grid;
  name?: string;
  index: number;
  total: number;
  called?: ReadonlySet<number>;
  style?: TicketStyle;
  design?: TicketDesign;
  customTheme?: ThemeSpec;
}

const THEME_LABELS: Record<TicketTheme, string> = {
  paperwhite: "⚪ Paper White (default)",
  ocean: "🌊 Ocean Blue",
  rosegold: "🥀 Rose Gold",
  emerald: "🌲 Emerald Gold",
  sunset: "🌅 Sunset",
  mint: "🌿 Sky Mint",
  lavender: "🔮 Lavender",
  charcoalgold: "🖤 Charcoal Gold",
  navycream: "🎴 Navy Cream",
  plum: "🍇 Plum Dusk",
  crimson: "🔴 Crimson Crush",
  cobalt: "🟦 Cobalt Denim",
  honey: "🍯 Golden Honey",
  matcha: "🍵 Matcha Leaf",
  wine: "🍷 Velvet Wine",
  onyx: "⬛ Onyx Silver",
  graphite: "🥈 Graphite Steel",
  peach: "🍑 Dusk Peach",
  beryl: "💎 Beryl Quartz",
  storm: "🌌 Night Storm",
  mocha: "☕ Mocha Crème",
  lagoon: "🐚 Deep Lagoon",
  arctic: "🧊 Arctic Ice",
  iris: "🪻 Iris Indigo",
  pines: "🌲 Pines Evergreen",
  stone: "🪨 Warm Stone",
  print: "🖨️ B/W Print",
  dots: "◌ Dot Matrix",
  custom: "🎨 Custom",
};

const DESIGN_LABELS: Record<TicketDesign, string> = {
  classic: "📐 Classic Band",
  carnival: "🎡 Carnival Cream",
  stub: "🎟️ Perforated Stub",
  metro: "🚇 Retro Metro",
  aura: "✨ Glass Aura",
  blueprint: "📏 Blueprint",
};

export { THEME_LABELS, DESIGN_LABELS };
export const STYLE_LABELS = THEME_LABELS;

export interface ThemeSpec {
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

const THEMES: Record<Exclude<TicketTheme, never>, ThemeSpec> = {
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
    band: "bg-gradient-to-r from-[#3f3f46] to-[#27272a]",
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
  crimson: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fdf3f3] to-[#f6dcde] rounded-[6px] border border-[#c31e3a] shadow-[0_10px_28px_rgba(0,0,0,0.26)]",
    band: "bg-gradient-to-r from-[#b3123b] to-[#7a0a28]",
    brand: "text-[#fff2f4]",
    serial: "text-[#f8c9ce]",
    serialMuted: "text-[#d89aa2]",
    rule: "bg-[#d91a3f]",
    line: "#c31e3a",
    gridText: "text-[#c31e3a]",
    num: "text-[#6d1428]",
    filled: "bg-[#6d1428]/[0.07]",
    called: "bg-[#16324f] text-white",
    watermark: "rgba(195,30,58,0.09)",
  },
  cobalt: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#eef4fb] to-[#d9e7f5] rounded-[6px] border border-[#2b5f9e] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    band: "bg-gradient-to-r from-[#1d4e89] to-[#123a68]",
    brand: "text-[#e8f1ff]",
    serial: "text-[#a9c7e8]",
    serialMuted: "text-[#7fa3c9]",
    rule: "bg-[#3b82f6]",
    line: "#3a69a3",
    gridText: "text-[#3a69a3]",
    num: "text-[#1c3a5e]",
    filled: "bg-[#1c3a5e]/[0.07]",
    called: "bg-[#e0783a] text-white",
    watermark: "rgba(27,79,137,0.10)",
  },
  honey: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fffaf0] to-[#f7ecd2] rounded-[6px] border border-[#8a5a12] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    band: "bg-gradient-to-r from-[#c07f11] to-[#945c05]",
    brand: "text-[#fff8e6]",
    serial: "text-[#ecc77b]",
    serialMuted: "text-[#c9a558]",
    rule: "bg-[#f0a419]",
    line: "#8a5a12",
    gridText: "text-[#8a5a12]",
    num: "text-[#5d3a06]",
    filled: "bg-[#5d3a06]/[0.07]",
    called: "bg-[#0f6878] text-white",
    watermark: "rgba(122,80,18,0.10)",
  },
  matcha: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#f0f7ec] to-[#dcede0] rounded-[6px] border border-[#4a7a3f] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    band: "bg-gradient-to-r from-[#3c6e33] to-[#28501f]",
    brand: "text-[#f2fbea]",
    serial: "text-[#b6d8a8]",
    serialMuted: "text-[#8fb383]",
    rule: "bg-[#5fae49]",
    line: "#4a7a3f",
    gridText: "text-[#4a7a3f]",
    num: "text-[#2e521f]",
    filled: "bg-[#2e521f]/[0.07]",
    called: "bg-[#6b3f9e] text-white",
    watermark: "rgba(74,122,63,0.10)",
  },
  wine: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fdf1f5] to-[#f2d9e2] rounded-[6px] border border-[#7d2a4a] shadow-[0_10px_28px_rgba(0,0,0,0.24)]",
    band: "bg-gradient-to-r from-[#7d2a4a] to-[#521831]",
    brand: "text-[#ffeef4]",
    serial: "text-[#e9aebf]",
    serialMuted: "text-[#c9879d]",
    rule: "bg-[#b0436b]",
    line: "#7d2a4a",
    gridText: "text-[#7d2a4a]",
    num: "text-[#5c1730]",
    filled: "bg-[#5c1730]/[0.07]",
    called: "bg-[#0f766e] text-white",
    watermark: "rgba(125,42,74,0.10)",
  },
  onyx: {
    card: "bg-gradient-to-b from-[#24272c] to-[#16181c] rounded-[6px] border border-[#63666d] shadow-[0_10px_28px_rgba(0,0,0,0.45)]",
    band: "bg-gradient-to-r from-[#3b3f46] to-[#26292f]",
    brand: "text-[#f4f4f5]",
    serial: "text-[#b3b7bd]",
    serialMuted: "text-[#85898f]",
    rule: "bg-[#878b92]",
    line: "#7b7f86",
    gridText: "text-[#8f939a]",
    num: "text-[#f4f4f5]",
    filled: "bg-white/[0.08]",
    called: "bg-[#e2b714] text-[#3a2f00]",
    watermark: "rgba(255,255,255,0.05)",
  },
  graphite: {
    card: "bg-gradient-to-b from-[#1e2430] to-[#131722] rounded-[6px] border border-[#55617a] shadow-[0_10px_28px_rgba(0,0,0,0.45)]",
    band: "bg-gradient-to-r from-[#2c3a52] to-[#1c2740]",
    brand: "text-[#e8edf7]",
    serial: "text-[#aab8cf]",
    serialMuted: "text-[#8391aa]",
    rule: "bg-[#5a7bb8]",
    line: "#5a6b8a",
    gridText: "text-[#8496b1]",
    num: "text-[#eef2fa]",
    filled: "bg-white/[0.08]",
    called: "bg-[#22d3ee] text-[#083344]",
    watermark: "rgba(90,123,184,0.07)",
  },
  peach: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fff2e6] to-[#fce3cb] rounded-[6px] border border-[#c0631c] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    band: "bg-gradient-to-r from-[#e0753a] to-[#b34e14]",
    brand: "text-[#fff6ec]",
    serial: "text-[#f4c49a]",
    serialMuted: "text-[#d19a6d]",
    rule: "bg-[#ea8a4d]",
    line: "#c0631c",
    gridText: "text-[#c0631c]",
    num: "text-[#7a3d0e]",
    filled: "bg-[#7a3d0e]/[0.07]",
    called: "bg-[#0e7c74] text-white",
    watermark: "rgba(192,99,28,0.09)",
  },
  beryl: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#eefbf6] to-[#d7f2e7] rounded-[6px] border border-[#148a6e] shadow-[0_10px_28px_rgba(0,0,0,0.2)]",
    band: "bg-gradient-to-r from-[#0f7d64] to-[#0a5c49]",
    brand: "text-[#eafff7]",
    serial: "text-[#a8dcc9]",
    serialMuted: "text-[#7fb6a2]",
    rule: "bg-[#10b484]",
    line: "#148a6e",
    gridText: "text-[#148a6e]",
    num: "text-[#0b4a3a]",
    filled: "bg-[#0b4a3a]/[0.07]",
    called: "bg-[#d23c2e] text-white",
    watermark: "rgba(20,138,110,0.10)",
  },
  storm: {
    card: "bg-gradient-to-b from-[#1b1f3a] to-[#12142a] rounded-[6px] border border-[#4f5486] shadow-[0_10px_28px_rgba(0,0,0,0.45)]",
    band: "bg-gradient-to-r from-[#2a2f5e] to-[#1c2044]",
    brand: "text-[#eceefc]",
    serial: "text-[#b7bcec]",
    serialMuted: "text-[#8a90c4]",
    rule: "bg-[#6a71d6]",
    line: "#5a6099",
    gridText: "text-[#8b90c6]",
    num: "text-[#f2f3ff]",
    filled: "bg-white/[0.08]",
    called: "bg-[#f59e0b] text-[#3b2a05]",
    watermark: "rgba(106,113,214,0.08)",
  },
  mocha: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#f6e9d6] to-[#ecd7b8] rounded-[6px] border border-[#7a5c35] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    band: "bg-gradient-to-r from-[#8a5a35] to-[#5f3a20]",
    brand: "text-[#fff4e6]",
    serial: "text-[#d8b78f]",
    serialMuted: "text-[#b4936b]",
    rule: "bg-[#d97742]",
    line: "#7a5b3a",
    gridText: "text-[#6f5234]",
    num: "text-[#4a331c]",
    filled: "bg-[#4a331c]/[0.08]",
    called: "bg-[#0f766e] text-white",
    watermark: "rgba(122,92,53,0.10)",
  },
  lagoon: {
    card: "bg-gradient-to-b from-[#0f4a52] to-[#083138] rounded-[6px] border border-[#2e8e9c] shadow-[0_10px_28px_rgba(0,0,0,0.4)]",
    band: "bg-gradient-to-r from-[#1c8a99] to-[#0e5561]",
    brand: "text-[#eafffb]",
    serial: "text-[#7fe3ee]",
    serialMuted: "text-[#57b9c6]",
    rule: "bg-[#2de3f6]",
    line: "#2fb3c4",
    gridText: "text-[#6fc7d2]",
    num: "text-[#f0feff]",
    filled: "bg-white/[0.08]",
    called: "bg-[#ffb52e] text-[#3b2a05]",
    watermark: "rgba(45,227,246,0.09)",
  },
  arctic: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#f8fbff] to-[#dceafc] rounded-[6px] border border-[#7ea8d4] shadow-[0_10px_28px_rgba(0,0,0,0.2)]",
    band: "bg-gradient-to-r from-[#2f6fb8] to-[#1d4f96]",
    brand: "text-[#f4faff]",
    serial: "text-[#9dc6ee]",
    serialMuted: "text-[#79a1cd]",
    rule: "bg-[#2f9eeb]",
    line: "#5b8fd0",
    gridText: "text-[#4f84c4]",
    num: "text-[#1c3f6e]",
    filled: "bg-[#1c3f6e]/[0.07]",
    called: "bg-[#f53b57] text-white",
    watermark: "rgba(83,137,203,0.14)",
  },
  iris: {
    card: "bg-gradient-to-b from-[#2a1f4d] to-[#191130] rounded-[6px] border border-[#7a6cc0] shadow-[0_10px_28px_rgba(0,0,0,0.42)]",
    band: "bg-gradient-to-r from-[#4a3a94] to-[#302066]",
    brand: "text-[#f1edff]",
    serial: "text-[#c4b8eb]",
    serialMuted: "text-[#9488c4]",
    rule: "bg-[#a78bfa]",
    line: "#7a6cc0",
    gridText: "text-[#a394e0]",
    num: "text-[#f5f2ff]",
    filled: "bg-white/[0.08]",
    called: "bg-[#2dd4bf] text-[#00352b]",
    watermark: "rgba(167,139,250,0.08)",
  },
  pines: {
    card: "bg-gradient-to-b from-[#17382a] to-[#0a2117] rounded-[6px] border border-[#3e7a57] shadow-[0_10px_28px_rgba(0,0,0,0.4)]",
    band: "bg-gradient-to-r from-[#2a6b4b] to-[#184733]",
    brand: "text-[#e9f7ee]",
    serial: "text-[#a9d4b8]",
    serialMuted: "text-[#7fa893]",
    rule: "bg-[#4ade80]",
    line: "#57a378",
    gridText: "text-[#74ba92]",
    num: "text-[#f0fbf3]",
    filled: "bg-white/[0.08]",
    called: "bg-[#fbab19] text-[#3b2a05]",
    watermark: "rgba(74,222,128,0.08)",
  },
  stone: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#f5f5f2] to-[#e8e8e2] rounded-[6px] border border-[#6a6a63] shadow-[0_10px_28px_rgba(0,0,0,0.2)]",
    band: "bg-gradient-to-r from-[#949494] to-[#646464]",
    brand: "text-[#fafaf7]",
    serial: "text-[#c2c2b8]",
    serialMuted: "text-[#9a9a90]",
    rule: "bg-[#a3a39a]",
    line: "#7a7a70",
    gridText: "text-[#7d7d74]",
    num: "text-[#33332c]",
    filled: "bg-[#33332c]/[0.07]",
    called: "bg-[#d64541] text-white",
    watermark: "rgba(106,106,99,0.08)",
  },
  print: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#ffffff] to-[#e9e9e9] rounded-[6px] border border-[#191919] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    band: "bg-gradient-to-r from-[#191919] to-[#3d3d3d]",
    brand: "text-white",
    serial: "text-[#222222]",
    serialMuted: "text-[#6f6f6f]",
    rule: "bg-[#111111]",
    line: "#191919",
    gridText: "text-[#4a4a4a]",
    num: "text-[#0a0a0a]",
    filled: "bg-[#111111]/[0.12]",
    called: "bg-[#111111] text-white",
    watermark: "rgba(0,0,0,0.06)",
  },
  dots: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#fdfdf6] to-[#efefe4] rounded-[6px] border border-[#242424] shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    band: "bg-gradient-to-r from-[#242424] to-[#4c4c46]",
    brand: "text-white",
    serial: "text-[#262626]",
    serialMuted: "text-[#73736c]",
    rule: "bg-[#141414]",
    line: "#262626",
    gridText: "text-[#4c4c4c]",
    num: "text-[#161616]",
    filled: "bg-[radial-gradient(circle,rgba(0,0,0,0.5)_1px,transparent_1.4px)] bg-[length:5px_5px]",
    called: "bg-[#141414] text-white",
    watermark: "rgba(0,0,0,0.05)",
  },
  custom: {
    foilDark: true,
    card: "bg-gradient-to-b from-[#ffffff] to-[#eef1f5] rounded-[6px] border border-[#c3ccd6] shadow-[0_10px_28px_rgba(0,0,0,0.18)]",
    band: "bg-gradient-to-r from-[#46586c] to-[#33424f]",
    brand: "text-white",
    serial: "text-[#33424f]",
    serialMuted: "text-[#7d8a99]",
    rule: "bg-[#46586c]",
    line: "#46586c",
    gridText: "text-[#546375]",
    num: "text-[#18222c]",
    filled: "bg-[#18222c]/[0.07]",
    called: "bg-[#18222c] text-white",
    watermark: "rgba(70,88,108,0.10)",
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

/** Shared 3×9 number grid. `line` feeds the per-cell hairline via --ticket-line. */
function TicketGrid({
  grid,
  called,
  t,
}: {
  grid: Grid;
  called?: ReadonlySet<number>;
  t: ThemeSpec;
}) {
  return (
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
  );
}

function CarnivalCard({ grid, name, index, total, called }: Omit<Props, "style" | "design">) {
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

function ClassicCard({
  grid,
  name,
  index,
  total,
  called,
  t,
}: Omit<Props, "style" | "design"> & { t: ThemeSpec }) {
  const brand = name || "Tambola";
  const foil = t.foilDark ? "ticket-foil-deep" : "ticket-foil";
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
          <TicketGrid grid={grid} called={called} t={t} />
        </div>
      </div>
    </div>
  );
}

function StubCard({
  grid,
  name,
  index,
  total,
  called,
  t,
}: Omit<Props, "style" | "design"> & { t: ThemeSpec }) {
  const brand = name || "Tambola";
  const foil = t.foilDark ? "ticket-foil-deep" : "ticket-foil";
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

      <div className="relative z-[2] flex items-center justify-between gap-2 px-3 py-2">
        <span className={`font-vintage-display min-w-0 flex-1 truncate text-[12px] font-bold uppercase tracking-[0.18em] ${foil}`}>
          ✦ {brand}
        </span>
        <span className={`font-mono shrink-0 text-[9px] font-bold tracking-[0.18em] ${t.serial}`}>
          NO. {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="relative z-[2] border-t-2 border-dashed" style={{ borderColor: `${t.line}55` }} />

      <div className="relative z-[2] p-2 pt-2">
        <div className="rounded-[4px] border p-[3px]" style={{ borderColor: `${t.line}88` }}>
          <TicketGrid grid={grid} called={called} t={t} />
        </div>
      </div>

      <div className="relative z-[2] border-t-2 border-dashed" style={{ borderColor: `${t.line}55` }} />
    </div>
  );
}

function MetroCard({
  grid,
  name,
  index,
  called,
  t,
}: Omit<Props, "style" | "design"> & { t: ThemeSpec }) {
  const brand = name || "Tambola";
  const foil = t.foilDark ? "ticket-foil-deep" : "ticket-foil";
  const stripes = `repeating-linear-gradient(-45deg, ${t.line}33 0 8px, transparent 8px 16px)`;
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

      <div className="relative z-[2] h-2.5" style={{ backgroundImage: stripes }} />

      <div className="relative z-[2] flex items-center justify-between gap-3 px-4 py-2">
        <span className={`font-vintage-display min-w-0 flex-1 truncate text-[16px] font-black uppercase tracking-[0.28em] ${foil}`}>
          ✦ {brand}
        </span>
        <span
          className={`shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[9px] font-bold ${t.serial}`}
          style={{ borderColor: `${t.line}88` }}
        >
          No. {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {t.rule && <div className={`relative z-[2] mx-4 h-[3px] ${t.rule}`} />}

      <div className="relative z-[2] p-2 pt-2">
        <div className="rounded-[2px] border-2 p-[2px]" style={{ borderColor: t.line }}>
          <TicketGrid grid={grid} called={called} t={t} />
        </div>
      </div>

      <div className="relative z-[2] h-2.5" style={{ backgroundImage: stripes }} />
    </div>
  );
}

function AuraCard({
  grid,
  name,
  called,
  t,
}: Omit<Props, "style" | "design"> & { t: ThemeSpec }) {
  const brand = name || "Tambola";
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

      <div className="relative z-[2] flex items-center justify-start gap-2 px-3 py-2">
        <span className={`font-vintage-display min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.3em] ${t.serial}`}>
          ✦ {brand}
        </span>
      </div>

      <div className="relative z-[2] mx-3 rounded-[6px] p-[3px]" style={{ border: `1px solid ${t.line}44` }}>
        <TicketGrid grid={grid} called={called} t={t} />
      </div>
    </div>
  );
}

function BlueprintCard({
  grid,
  name,
  index,
  total,
  called,
  t,
}: Omit<Props, "style" | "design"> & { t: ThemeSpec }) {
  const brand = name || "Tambola";
  const foil = t.foilDark ? "ticket-foil-deep" : "ticket-foil";
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

      <div className="relative z-[2] flex items-center justify-between gap-2 px-3 pt-2">
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: t.line }}>
          DWG-{String(index + 1).padStart(3, "0")}
        </span>
        <span className={`font-vintage-display whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.24em] ${foil}`}>
          ✦ {brand}
        </span>
        <span className="font-mono text-[8px] font-bold" style={{ color: t.line }}>
          SH.{index + 1}/{total}
        </span>
      </div>

      <div className="relative z-[2] mx-3 mt-1.5 border-t" style={{ borderColor: `${t.line}55` }} />

      <div className="relative z-[2] p-3 pt-2">
        <div className="relative">
          <span className="pointer-events-none absolute -left-1 -top-1 z-[1] text-[10px] font-bold leading-none" style={{ color: t.line }}>+</span>
          <span className="pointer-events-none absolute -right-1 -top-1 z-[1] text-[10px] font-bold leading-none" style={{ color: t.line }}>+</span>
          <span className="pointer-events-none absolute -bottom-1 -left-1 z-[1] text-[10px] font-bold leading-none" style={{ color: t.line }}>+</span>
          <span className="pointer-events-none absolute -bottom-1 -right-1 z-[1] text-[10px] font-bold leading-none" style={{ color: t.line }}>+</span>
          <div className="rounded-[2px] border p-[3px]" style={{ borderColor: t.line }}>
            <TicketGrid grid={grid} called={called} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketCard(props: Props) {
  const t = props.customTheme ?? THEMES[props.style ?? "paperwhite"];
  switch (props.design ?? "classic") {
    case "carnival":
      return <CarnivalCard {...props} />;
    case "stub":
      return <StubCard {...props} t={t} />;
    case "metro":
      return <MetroCard {...props} t={t} />;
    case "aura":
      return <AuraCard {...props} t={t} />;
    case "blueprint":
      return <BlueprintCard {...props} t={t} />;
    default:
      return <ClassicCard {...props} t={t} />;
  }
}