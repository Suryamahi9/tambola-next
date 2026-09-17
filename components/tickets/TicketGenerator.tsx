"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generateHalfSetBatch,
  generateSetBatch,
  generateUniqueGrids,
  gridKey,
  isValidTicket,
  type Grid,
} from "@/lib/ticket";
import TicketCard, {
  THEME_LABELS,
  DESIGN_LABELS,
  type TicketTheme,
  type TicketDesign,
  type ThemeSpec,
} from "./TicketCard";

type Mode = "random" | "fullset" | "halfset";
type SelectedDesign = TicketDesign | "all";
type CustomPalette = [string, string, string, string, string, string];
const RANDOM_MAX = 50;
const SET_MAX = 50;
const PREF_KEY = "tambola-generator-prefs";
const DEFAULT_CUSTOM: CustomPalette = ["#1f3a5f", "#111c30", "#2e5f8a", "#eef4ff", "#22d3ee", "#7dd3fc"];
const CUSTOM_FIELDS: { key: string; label: string }[] = [
  { key: "cardTop", label: "Card Top" },
  { key: "cardBottom", label: "Card Bottom" },
  { key: "band", label: "Band" },
  { key: "ink", label: "Ink · Text" },
  { key: "accent", label: "Accent" },
  { key: "watermark", label: "Watermark" },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function shade(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(c * f))));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
const THEME_OPTIONS = Object.entries(THEME_LABELS) as [TicketTheme, string][];
const DESIGN_OPTIONS = Object.entries(DESIGN_LABELS) as [TicketDesign, string][];
const DESIGN_ORDER: TicketDesign[] = ["classic", "carnival", "stub", "metro", "aura", "blueprint"];
const SET_LABELS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK", "AL", "AM", "AN",
  "AO", "AP", "AQ", "AR", "AS", "AT", "AU", "AV", "AW", "AX",
];

export default function TicketGenerator() {
  const [mode, setMode] = useState<Mode>("random");
  const [count, setCount] = useState(15);
  const [name, setName] = useState("");
  const [tickets, setTickets] = useState<Grid[]>([]);
  const [labels, setLabels] = useState<(string | null)[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [style, setStyle] = useState<TicketTheme>("paperwhite");
  const [design, setDesign] = useState<SelectedDesign>("all");
  const [showCoverage, setShowCoverage] = useState(false);
  const [ticketSize, setTicketSize] = useState<"sm" | "md" | "lg">("md");
  const [customColors, setCustomColors] = useState<CustomPalette>(DEFAULT_CUSTOM);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Template memory — restore last controls after mount so server and client renders match.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (!raw) {
        hydratedRef.current = true; // nothing to protect — arm persistence immediately
        return;
      }
      const p = JSON.parse(raw) as Partial<Record<"mode" | "count" | "name" | "style" | "design" | "ticketSize" | "custom", unknown>>;
      const id = window.requestAnimationFrame(() => {
        if (p.mode === "random" || p.mode === "fullset" || p.mode === "halfset") setMode(p.mode);
        if (typeof p.count === "number") {
          const max = p.mode === "random" ? RANDOM_MAX : SET_MAX;
          setCount(Math.max(1, Math.min(max, p.count)));
        }
        if (typeof p.name === "string") setName(p.name);
        if (typeof p.style === "string" && p.style in THEME_LABELS) setStyle(p.style as TicketTheme);
        if (p.design === "all" || (typeof p.design === "string" && p.design in DESIGN_LABELS))
          setDesign(p.design as SelectedDesign);
        if (p.ticketSize === "sm" || p.ticketSize === "md" || p.ticketSize === "lg")
          setTicketSize(p.ticketSize);
        if (
          Array.isArray(p.custom) &&
          p.custom.length === 6 &&
          (p.custom as unknown[]).every((c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c as string))
        )
          setCustomColors(p.custom as CustomPalette);
        hydratedRef.current = true;
      });
      return () => window.cancelAnimationFrame(id);
    } catch {
      /* corrupt storage — keep defaults */
    }
  }, []);

  // Persist only after restore has applied, so defaults never clobber saved prefs.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ mode, count, name, style, design, ticketSize, custom: customColors }));
    } catch {
      /* storage full / private mode */
    }
  }, [mode, count, name, style, design, ticketSize, customColors]);

  const analysis = useMemo(() => {
    let duplicateLines = 0;
    let invalid = 0;
    let gridDupes = 0;
    const seenGrids = new Set<string>();
    const seenLines = new Map<string, number>();
    for (const g of tickets) {
      if (!isValidTicket(g)) invalid++;
      const key = gridKey(g);
      if (seenGrids.has(key)) gridDupes++;
      seenGrids.add(key);
      for (const row of g) {
        const line = row.filter((v): v is number => v !== null).sort((a, b) => a - b).join(",");
        const prev = seenLines.get(line) ?? 0;
        if (prev > 0) duplicateLines++;
        seenLines.set(line, prev + 1);
      }
    }
    return { duplicateLines, invalid, gridDupes };
  }, [tickets]);

  const coverage = useMemo(() => {
    const counts = new Array<number>(91).fill(0);
    let total = 0;
    let peak = 0;
    for (const g of tickets) {
      for (const row of g) {
        for (const v of row) {
          if (v) {
            counts[v]++;
            total++;
          }
        }
      }
    }
    for (let n = 1; n <= 90; n++) if (counts[n] > peak) peak = counts[n];
    return { counts, total, missing: counts.filter((_, n) => n >= 1 && counts[n] === 0).length, peak };
  }, [tickets]);

  const customTheme = useMemo<ThemeSpec>(() => {
    const [cardF, cardT, cB, ink, acc, wat] = customColors;
    const dark = luminance(cardF) < 0.45;
    const band = `bg-gradient-to-r from-[${cB}] to-[${shade(cB, 0.68)}]`;
    const brand = luminance(cB) < 0.55 ? "text-white" : "text-[#111111]";
    const line = dark ? shade(ink, 0.78) : shade(ink, 0.88);
    const card = dark
      ? `bg-gradient-to-b from-[${cardF}] to-[${cardT}] rounded-[6px] border border-[${shade(cB, 1.35)}] shadow-[0_10px_28px_rgba(0,0,0,0.4)]`
      : `bg-gradient-to-b from-[${cardF}] to-[${cardT}] rounded-[6px] border border-[${shade(cB, 0.62)}] shadow-[0_10px_28px_rgba(0,0,0,0.2)]`;
    const accDark = luminance(acc) < 0.5;
    return {
      foilDark: dark,
      card,
      band,
      brand,
      serial: dark ? `text-[${shade(acc, 1.3)}]` : `text-[${ink}]`,
      serialMuted: dark ? `text-[${shade(acc, 0.85)}]` : `text-[${shade(ink, 0.85)}]`,
      rule: `bg-[${acc}]`,
      line,
      gridText: `text-[${line}]`,
      num: `text-[${ink}]`,
      filled: dark ? "bg-white/[0.09]" : `bg-[${ink}]/[0.08]`,
      called: `bg-[${acc}] ${accDark ? "text-white" : "text-[#151515]"}`,
      watermark: rgba(wat, dark ? 0.12 : 0.1),
    };
  }, [customColors]);

  const updateCustomColor = useCallback((i: number, value: string) => {
    setCustomColors((prev) => {
      const next = [...prev] as CustomPalette;
      next[i] = value;
      return next;
    });
  }, []);

  const generate = useCallback(() => {
    if (mode === "fullset") {
      const sets = Math.max(1, Math.min(SET_MAX, count));
      const batch = generateSetBatch(sets);
      if (!batch) {
        showToast("Could not generate unique full sets — please try again");
        return;
      }
      setTickets(batch);
      setLabels(batch.map((_, i) => `Set ${SET_LABELS[Math.floor(i / 6)]}`));
      showToast(`Generated ${batch.length} unique tickets — full set, 1–90 exactly once`);
      return;
    }

    if (mode === "halfset") {
      const sets = Math.max(1, Math.min(SET_MAX, count));
      const batch = generateHalfSetBatch(sets);
      if (!batch) {
        showToast("Could not generate unique half sets — please try again");
        return;
      }
      setTickets(batch);
      setLabels(batch.map((_, i) => `Set ${SET_LABELS[Math.floor(i / 3)]}`));
      showToast(`Generated ${batch.length} unique tickets — half sets, 45 numbers each`);
      return;
    }

    const n = Math.max(1, Math.min(RANDOM_MAX, count));
    const grids = generateUniqueGrids(n);
    setTickets(grids);
    setLabels(Array(n).fill(name.trim() || null));
    showToast(`Generated ${n} unique tickets`);
  }, [mode, count, name, showToast]);

  const fillNames = useCallback(() => {
    if (mode === "fullset") {
      showToast("Switch to Random Tickets mode to add player names");
      return;
    }
    if (!name.trim()) {
      showToast("Type a name first, or enter multiple names separated by spaces");
      return;
    }
    const names = name.trim().split(/\s+/).filter(Boolean);
    const n = Math.max(1, Math.min(RANDOM_MAX, count));
    const grids = generateUniqueGrids(n);
    setTickets(grids);
    setLabels(names.map((base, i) => `${base}-${i + 1}`));
    showToast("Tickets with names generated");
  }, [mode, name, count, showToast]);

  const printAll = useCallback(() => {
    window.print();
  }, []);

  const handleCountChange = (value: string) => {
    const parsed = parseInt(value, 10) || 1;
    if (mode === "fullset" || mode === "halfset") {
      setCount(Math.max(1, Math.min(SET_MAX, parsed)));
    } else {
      setCount(Math.max(1, Math.min(RANDOM_MAX, parsed)));
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === "fullset") {
      setCount((c) => Math.max(1, Math.min(SET_MAX, Math.ceil(c / 6))));
    } else if (m === "halfset") {
      setCount((c) => Math.max(1, Math.min(SET_MAX, Math.ceil(c / 3))));
    } else {
      setCount((c) => Math.max(1, Math.min(RANDOM_MAX, c)));
    }
  };

  const downloadPDF = useCallback(async () => {
    if (tickets.length === 0) {
      showToast("Generate tickets first");
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      tickets.forEach((grid, i) => {
        if (i > 0) doc.addPage();
        const label = labels[i] || "Tambola Ticket";
        const w = 176;
        const h = 100;
        const x = 12;
        const y = 30;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, w, h, 5, 5, "FD");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(210, 210, 210);
        doc.setFontSize(24);
        doc.text("NAVEEN CHERRY", x + w / 2, y + h / 2, { angle: -8, align: "center" });
        doc.setFillColor(20, 20, 20);
        doc.roundedRect(x, y, w, 12, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`${label}  ·  #${String(i + 1).padStart(2, "0")} / ${tickets.length}`, x + 2, y + 8);
        const cw = w / 9;
        const ch = (h - 14) / 3;
        doc.setFontSize(9);
        grid.forEach((row, r) =>
          row.forEach((v, c) => {
            const cx = x + c * cw;
            const cy = y + 14 + r * ch;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.15);
            doc.rect(cx, cy, cw, ch);
            if (v !== null) {
              doc.setTextColor(0, 0, 0);
              doc.text(String(v), cx + cw / 2, cy + ch / 2 + 1.5, { align: "center" });
            }
          })
        );
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`${label} — 15 numbers.  Generated ${new Date().toLocaleString()}`, x, y + h + 6);
      });
      doc.save(`tambola-tickets-${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("PDF downloaded");
    } catch {
      showToast("PDF unavailable — use Print instead");
    }
  }, [tickets, labels, showToast]);

  return (
    <div>
      {/* Master Customizer Panel */}
      <div className="w-full bg-surface-container-low rounded-2xl p-6 lg:p-8 space-y-8 shadow-xl">
        {/* Upper config row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-5 space-y-2">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">edit_note</span>
              Player Name / Event Header
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-headline-sm text-headline-sm text-primary font-bold">✦</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="DIWALI DHAMAKA GALA 2025"
                className="w-full bg-surface-container-highest text-on-surface pl-10 pr-4 py-3.5 rounded-xl font-label-lg text-label-lg font-semibold tracking-wide uppercase focus:outline-none focus:bg-surface-container shadow-inner transition-colors"
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-2">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">casino</span>
              Batch Mode
            </label>
            <div className="grid grid-cols-3 gap-2 bg-surface-container-highest p-1 rounded-xl">
              {(
                [
                  ["random", "Random"],
                  ["fullset", "Full Set"],
                  ["halfset", "Half Set"],
                ] as [Mode, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchMode(value)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
                    mode === value
                      ? "bg-primary-container text-on-primary-container font-label-md text-label-md font-bold"
                      : "text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-medium"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {mode === "fullset" ? "Sets (6 each)" : mode === "halfset" ? "Sets (3 each)" : "Tickets"}
              </span>
              <input
                type="number"
                min={1}
                max={mode === "random" ? RANDOM_MAX : SET_MAX}
                value={count}
                onChange={(e) => handleCountChange(e.target.value)}
                className="w-24 bg-surface-container-highest text-on-surface text-center py-2.5 rounded-xl font-mono font-bold focus:outline-none focus:bg-surface-container shadow-inner transition-colors"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">palette</span>
                Ticket Theme
              </span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as TicketTheme)}
                className="w-full bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl font-label-md text-label-md focus:outline-none focus:bg-surface-container shadow-inner transition-colors"
              >
                {THEME_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">tune</span>
                Ticket Design
              </span>
              <select
                value={design}
                onChange={(e) => setDesign(e.target.value as SelectedDesign)}
                className="w-full bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl font-label-md text-label-md focus:outline-none focus:bg-surface-container shadow-inner transition-colors"
              >
                <option value="all">✦ All Designs Mixed</option>
                {DESIGN_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">zoom_out_map</span>
                Ticket Size
              </span>
              <select
                value={ticketSize}
                onChange={(e) => setTicketSize(e.target.value as "sm" | "md" | "lg")}
                className="w-full bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl font-label-md text-label-md focus:outline-none focus:bg-surface-container shadow-inner transition-colors"
              >
                <option value="sm">Compact</option>
                <option value="md">Standard</option>
                <option value="lg">Large</option>
              </select>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-mono">
              {THEME_OPTIONS.length} Themes · {DESIGN_OPTIONS.length} Designs
            </span>
          </div>
        </div>

        {style === "custom" && (
          <div className="rounded-2xl bg-surface-container-highest/60 border border-primary-container/30 p-4 space-y-3 print:hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">palette</span>
                Custom Theme Editor
              </span>
              <span className="font-label-sm text-label-sm text-secondary">
                Previewed live on the batch below · saved to this browser
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {CUSTOM_FIELDS.map((f, i) => (
                <label key={f.key} className="block">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{f.label}</span>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-surface-container p-1.5">
                    <input
                      type="color"
                      value={customColors[i]}
                      onChange={(e) => updateCustomColor(i, e.target.value)}
                      className="h-8 w-10 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
                      aria-label={f.label}
                    />
                    <span className="truncate font-mono text-[11px] text-on-surface-variant">{customColors[i]}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/40"
                  style={{ backgroundColor: customColors[2] }}
                  aria-hidden
                />
                Band
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/40"
                  style={{ backgroundColor: customColors[4] }}
                  aria-hidden
                />
                Accent
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/40"
                  style={{ backgroundColor: customColors[3] }}
                  aria-hidden
                />
                Ink
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/40"
                  style={{ backgroundColor: customColors[5] }}
                  aria-hidden
                />
                Watermark
              </span>
              <button
                type="button"
                onClick={() => setCustomColors(DEFAULT_CUSTOM)}
                className="rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface px-3 py-1.5 font-label-sm text-label-sm font-bold flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reset Colors
              </button>
            </div>
          </div>
        )}

        {/* Action toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 bg-surface-container-highest/40 p-4 rounded-xl">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              className="px-5 py-3 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-black flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary-container/20"
            >
              <span className="material-symbols-outlined text-xl">casino</span>
              Generate {mode === "random" ? "Unique" : mode === "fullset" ? "Full Set" : "Half Set"} Grids
            </button>
            <button
              type="button"
              onClick={fillNames}
              className="px-4 py-3 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-bright font-label-md text-label-md font-bold flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-lg text-tertiary">edit</span>
              Fill Names
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={printAll}
              className="px-5 py-3 rounded-xl bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold flex items-center gap-2 hover:opacity-95 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-xl">print</span>
              Print Sheet
            </button>
            <button
              type="button"
              onClick={() => void downloadPDF()}
              disabled={tickets.length === 0}
              className="px-4 py-3 rounded-xl bg-surface-container-high text-on-surface hover:text-primary font-label-md text-label-md font-bold flex items-center gap-2 transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export PDF
            </button>
          </div>
        </div>

        {mode === "fullset" && (
          <p className="rounded-xl bg-primary-container/15 border border-primary-container/30 px-4 py-3 font-label-md text-label-md leading-relaxed text-primary">
            Full Set mode generates official 6-ticket books where every number from 1 to 90
            appears exactly once across each set, and no ticket repeats. Choose 1–50 sets.
          </p>
        )}
        {mode === "halfset" && (
          <p className="rounded-xl bg-primary-container/15 border border-primary-container/30 px-4 py-3 font-label-md text-label-md leading-relaxed text-primary">
            Half Set mode deals 3-ticket half-books — 45 unique numbers each — and every ticket
            in the batch is unique. Choose 1–50 half-sets.
          </p>
        )}
      </div>

      {/* Live batch showcase */}
      <div className="print-area mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-secondary-fixed animate-pulse"></span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Live Batch Showcase &amp; Verification Deck
            </h2>
            <span className="text-on-surface-variant font-label-sm text-label-sm uppercase bg-surface-container-high px-2 py-0.5 rounded-full">
              {tickets.length} Ticket{tickets.length === 1 ? "" : "s"} Ready
            </span>
            <span className="text-secondary font-label-sm text-label-sm uppercase bg-secondary-container/15 px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tickets.length > 0 && (
              <span
                className={`font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full ${
                  analysis.invalid === 0 && analysis.gridDupes === 0
                    ? "text-secondary bg-secondary-container/15"
                    : "text-[#fbbf24] bg-[#fbbf24]/10"
                }`}
              >
                {analysis.invalid === 0 && analysis.gridDupes === 0
                  ? `✓ ${tickets.length} unique · all valid`
                  : `⚠ ${analysis.invalid} invalid · ${analysis.gridDupes} dupes`}
              </span>
            )}
            {tickets.length > 0 && (
              <span
                className={`font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full ${
                  analysis.duplicateLines === 0
                    ? "text-secondary bg-secondary-container/15"
                    : "text-[#fbbf24] bg-[#fbbf24]/10"
                }`}
              >
                {analysis.duplicateLines === 0 ? "✓ No duplicate lines" : `⚠ ${analysis.duplicateLines} duplicate lines`}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowCoverage((v) => !v)}
              disabled={tickets.length === 0}
              className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              {showCoverage ? "Hide" : "Show"} Number Coverage
            </button>
          </div>
        </div>

        {showCoverage && tickets.length > 0 && (
          <div className="no-print rounded-2xl bg-surface-container-low border border-surface-container-high p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5 font-label-md text-label-md font-bold text-on-surface">
              <span className="material-symbols-outlined text-secondary text-lg">bar_chart</span>
              Number Coverage
              <span className="text-on-surface-variant font-label-sm text-label-sm">
                {coverage.total} numbers across {tickets.length} tickets
              </span>
              <span className="font-label-sm text-label-sm text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-full">
                {coverage.missing} missing
              </span>
              <span className="font-label-sm text-label-sm text-primary bg-primary-container/15 px-2 py-0.5 rounded-full">
                peak ×{coverage.peak}
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1" aria-label="How many times each number 1-90 appears">
              {Array.from({ length: 9 }, (_, r) =>
                Array.from({ length: 10 }, (_, c) => r * 10 + c + 1)
              ).flat().map((n) => {
                const c = coverage.counts[n];
                const cls =
                  c === 0
                    ? "bg-surface-container text-on-surface-variant"
                    : c === 1
                      ? "bg-primary-container text-on-primary-container"
                      : c === 2
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-tertiary-container text-on-tertiary-container";
                return (
                  <div key={n} className={`aspect-[2/3] rounded-md flex flex-col items-center justify-center ${cls}`} title={`${n} appears ${c}×`}>
                    <span className="font-mono font-bold text-[9px] leading-none">{n}</span>
                    <span className="font-mono text-[6px] leading-none opacity-70 mt-0.5">{c}×</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-container-highest p-16 text-center bg-surface-container-low/40">
            <span className="material-symbols-outlined text-5xl text-primary">local_activity</span>
            <p className="mt-3 font-headline-sm text-headline-sm text-on-surface font-bold">No tickets yet</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Configure the customizer above and hit the gold Generate button.
            </p>
          </div>
        ) : (
          <div
        className={`grid gap-4 ${
          ticketSize === "sm"
            ? "sm:grid-cols-3 xl:grid-cols-4"
            : ticketSize === "lg"
              ? "sm:grid-cols-1 lg:grid-cols-2"
              : "sm:grid-cols-2 xl:grid-cols-3"
        }`}
        style={ticketSize !== "md" ? { zoom: ticketSize === "sm" ? 0.9 : 1.05 } : undefined}
      >
            {tickets.map((grid, i) => (
              <div key={i} className="break-inside-avoid">
                <TicketCard
                  grid={grid}
                  name={labels[i] || undefined}
                  index={i}
                  total={tickets.length}
                  style={style}
                  design={design === "all" ? DESIGN_ORDER[i % DESIGN_ORDER.length] : design}
                  customTheme={style === "custom" ? customTheme : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary-container px-5 py-3 font-label-md text-label-md font-bold text-on-primary-container shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
