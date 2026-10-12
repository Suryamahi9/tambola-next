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
  DEFAULT_LOGO_HEIGHT,
  DEFAULT_LOGO_OPACITY,
  DEFAULT_LOGO_WIDTH,
  type TicketTheme,
  type TicketDesign,
  type ThemeSpec,
  type CustomStyles,
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
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
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

/** Labelled % slider for the Watermark & Logo panel. */
function TuneSlider({
  icon,
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  icon: string;
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className={`space-y-2 ${disabled ? "opacity-40" : ""}`}>
      <span className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">{icon}</span>
          {label}
        </span>
        <span className="font-mono text-secondary">{value}%</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-secondary disabled:cursor-not-allowed"
        aria-label={label}
      />
    </label>
  );
}

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
  const [zoomPct, setZoomPct] = useState(100);
  const [customColors, setCustomColors] = useState<CustomPalette>(DEFAULT_CUSTOM);
  const [watermark, setWatermark] = useState("");
  const [logo, setLogo] = useState("");
  // Background tuning (percent units in state; card takes fractions).
  // Logo width/height = ghost % of ticket box · logo depth = ghost opacity % ·
  // watermark depth = text strength % (0 hides the text).
  const [logoWidth, setLogoWidth] = useState(Math.round(DEFAULT_LOGO_WIDTH * 100));
  const [logoHeight, setLogoHeight] = useState(Math.round(DEFAULT_LOGO_HEIGHT * 100));
  const [logoFit, setLogoFit] = useState<"fit" | "fill">("fit");
  const [logoDepth, setLogoDepth] = useState(Math.round(DEFAULT_LOGO_OPACITY * 100));
  const [wmDepth, setWmDepth] = useState(100);
  // Watermark text colour override — "" means the theme's own colour.
  const [wmColor, setWmColor] = useState("");

  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const hydratedRef = useRef(false);

  // Toast auto-dismiss is handled by the single stored timer in showToast.

  // Template memory — restore last controls after mount so server and client renders match.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (!raw) {
        hydratedRef.current = true; // nothing to protect — arm persistence immediately
        return;
      }
      // "logoSize" is legacy (pre-split single slider) — migrated below, never written.
      // "ticketSize" is legacy (pre-slider Compact/Standard/Large) — migrated below, never written.
      const p = JSON.parse(raw) as Partial<Record<"mode" | "count" | "name" | "style" | "design" | "ticketSize" | "ticketZoom" | "custom" | "watermark" | "logo" | "logoSize" | "logoWidth" | "logoHeight" | "logoFit" | "logoDepth" | "wmDepth" | "wmColor", unknown>>;
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
        if (typeof p.ticketZoom === "number") {
          setZoomPct(Math.max(70, Math.min(130, Math.round(p.ticketZoom))));
        } else if (p.ticketSize === "sm" || p.ticketSize === "md" || p.ticketSize === "lg") {
          // Migrate pre-slider prefs: Compact 90 / Standard 100 / Large 105.
          setZoomPct(p.ticketSize === "sm" ? 90 : p.ticketSize === "lg" ? 105 : 100);
        }
        if (
          Array.isArray(p.custom) &&
          p.custom.length === 6 &&
          (p.custom as unknown[]).every((c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c as string))
        )
          setCustomColors(p.custom as CustomPalette);
        if (typeof p.watermark === "string") setWatermark(p.watermark);
        if (typeof p.logo === "string") setLogo(p.logo);
        if (typeof p.logoWidth === "number") setLogoWidth(Math.max(15, Math.min(100, Math.round(p.logoWidth))));
        else if (typeof p.logoSize === "number") {
          // Migrate pre-split prefs: one size drove both axes.
          const v = Math.max(15, Math.min(100, Math.round(p.logoSize)));
          setLogoWidth(v);
          setLogoHeight(v);
        }
        if (typeof p.logoHeight === "number") setLogoHeight(Math.max(15, Math.min(100, Math.round(p.logoHeight))));
        if (p.logoFit === "fit" || p.logoFit === "fill") setLogoFit(p.logoFit);
        if (typeof p.logoDepth === "number") setLogoDepth(Math.max(2, Math.min(50, Math.round(p.logoDepth))));
        if (typeof p.wmDepth === "number") setWmDepth(Math.max(0, Math.min(100, Math.round(p.wmDepth))));
        if (typeof p.wmColor === "string" && (/^#[0-9a-f]{6}$/i.test(p.wmColor) || p.wmColor === "")) setWmColor(p.wmColor);
        hydratedRef.current = true;
      });
      return () => window.cancelAnimationFrame(id);
    } catch {
      /* corrupt storage — keep defaults, arm saving */
      hydratedRef.current = true;
    }
  }, []);

  // Persist only after restore has applied, so defaults never clobber saved prefs.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(
        PREF_KEY,
        JSON.stringify({ mode, count, name, style, design, ticketZoom: zoomPct, custom: customColors, watermark, logo, logoWidth, logoHeight, logoFit, logoDepth, wmDepth, wmColor })
      );
    } catch {
      /* storage full / private mode */
    }
  }, [mode, count, name, style, design, zoomPct, customColors, watermark, logo, logoWidth, logoHeight, logoFit, logoDepth, wmDepth, wmColor]);

  const analysis = useMemo(() => {
    let duplicateLines = 0;
    let invalid = 0;
    let gridDupes = 0;
    const seenGrids = new Set<string>();
    const seenLines = new Map<string, number>();
    for (const g of tickets) {
      // Validate against the loosest generation rule (strips are minted with
      // maxRun 4): a 3-in-a-row run is legal in set books, so the default
      // maxRun 3 would falsely flag fresh full/half-set tickets "invalid".
      if (!isValidTicket(g, 4)) invalid++;
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

  // Static class shell for the custom theme (all classes exist at build
  // time); the live hex values ride via `customStyles` inline styles below.
  // `line`, `watermark` and `foilDark` stay dynamic — they are plain colour
  // strings / a boolean, never Tailwind classes.
  const customTheme = useMemo<ThemeSpec>(() => {
    const [cardF, , , ink, , wat] = customColors;
    const dark = luminance(cardF) < 0.45;
    return {
      foilDark: dark,
      card: "bg-gradient-to-b from-[#ffffff] to-[#eef1f5] rounded-[6px] border border-[#c3ccd6] shadow-[0_10px_28px_rgba(0,0,0,0.18)]",
      band: "bg-gradient-to-r from-[#46586c] to-[#33424f]",
      brand: "text-white",
      serial: "text-[#33424f]",
      serialMuted: "text-[#7d8a99]",
      rule: "bg-[#46586c]",
      line: dark ? shade(ink, 0.78) : shade(ink, 0.88),
      gridText: "text-[#546375]",
      num: "text-[#18222c]",
      filled: "bg-[#18222c]/[0.07]",
      called: "bg-[#18222c] text-white",
      watermark: rgba(wat, dark ? 0.26 : 0.22),
    };
  }, [customColors]);

  const customStyles = useMemo<CustomStyles>(() => {
    const [cardF, cardT, cB, ink, acc] = customColors;
    const dark = luminance(cardF) < 0.45;
    const line = dark ? shade(ink, 0.78) : shade(ink, 0.88);
    const accDark = luminance(acc) < 0.5;
    return {
      card: {
        backgroundImage: `linear-gradient(to bottom, ${cardF}, ${cardT})`,
        borderColor: dark ? shade(cB, 1.35) : shade(cB, 0.62),
      },
      band: {
        backgroundImage: `linear-gradient(to right, ${cB}, ${shade(cB, 0.68)})`,
      },
      brand: { color: luminance(cB) < 0.55 ? "#ffffff" : "#111111" },
      serial: { color: dark ? shade(acc, 1.3) : ink },
      serialMuted: { color: dark ? shade(acc, 0.85) : shade(ink, 0.85) },
      rule: { backgroundColor: acc },
      gridText: { color: line },
      num: { color: ink },
      filled: {
        backgroundColor: dark ? "rgba(255,255,255,0.09)" : rgba(ink, 0.08),
      },
      called: {
        backgroundColor: acc,
        color: accDark ? "#ffffff" : "#151515",
      },
    };
  }, [customColors]);

  const updateCustomColor = useCallback((i: number, value: string) => {
    setCustomColors((prev) => {
      const next = [...prev] as CustomPalette;
      next[i] = value;
      return next;
    });
  }, []);

  // Downscale uploaded logos to a small data URL so prefs stay inside the
  // localStorage quota; SVGs are kept as-is (canvas can't rasterise them).
  const onLogoFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showToast("Pick an image file (PNG, JPG, WebP or SVG)");
        return;
      }
      if (file.size > 800 * 1024) {
        showToast("Logo too large — pick an image under 800KB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        if (file.type === "image/svg+xml") {
          setLogo(src);
          showToast("Logo added");
          return;
        }
        const img = new Image();
        img.onload = () => {
          const max = 256;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setLogo(src);
          } else {
            ctx.drawImage(img, 0, 0, w, h);
            setLogo(canvas.toDataURL("image/png"));
          }
          showToast("Logo added");
        };
        img.onerror = () => showToast("Could not read that image");
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

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
    setLabels(Array(grids.length).fill(name.trim() || null));
    showToast(`Generated ${grids.length} unique tickets`);
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
    setLabels(
      grids.map((_, i) => `${names[i % names.length]}-${Math.floor(i / names.length) + 1}`)
    );
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
    if (tickets.length > 200) {
      showToast("Too many tickets — export 200 or fewer at a time");
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      for (let i = 0; i < tickets.length; i++) {
        const grid = tickets[i];
        if (i > 0 && i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
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
        const wm = (watermark.trim() || "NAVEEN CHERRY").toUpperCase();
        if (/^#[0-9a-f]{6}$/i.test(wmColor)) {
          const [r, g, b] = hexToRgb(wmColor);
          doc.setTextColor(r, g, b);
        } else {
          doc.setTextColor(210, 210, 210);
        }
        let logoDrawn = false;
        if (logo.startsWith("data:image/")) {
          try {
            const fmt = logo.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
            const props = doc.getImageProperties(logo);
            // Ghost logo, honouring the Width / Height / Depth sliders.
            // Print always uses fit (whole logo) even in Fill mode — cropping
            // on paper is a worse surprise than letterboxing.
            const widthF = Math.max(0.15, Math.min(1, logoWidth / 100));
            const heightF = Math.max(0.15, Math.min(1, logoHeight / 100));
            const depthF = Math.max(0.02, Math.min(0.5, logoDepth / 100));
            const maxW = w * widthF;
            const maxH = h * heightF;
            const s = Math.min(maxW / props.width, maxH / props.height, 1);
            const iw = props.width * s;
            const ih = props.height * s;
            try {
              const gs = new (doc as unknown as { GState: new (o: object) => object }).GState({ opacity: depthF });
              (doc as unknown as { setGState: (g: object) => void }).setGState(gs);
            } catch {
              /* old jsPDF without GState — full-opacity small logo still fine */
            }
            doc.addImage(logo, fmt, x + (w - iw) / 2, y + (h - ih) / 2 - 4, iw, ih, undefined, "FAST");
            try {
              const gs = new (doc as unknown as { GState: new (o: object) => object }).GState({ opacity: 1 });
              (doc as unknown as { setGState: (g: object) => void }).setGState(gs);
            } catch {
              /* ignore */
            }
            logoDrawn = true;
          } catch {
            /* unsupported image — fall back to text watermark */
          }
        }
        doc.setFontSize(24);
        const wmW = doc.getTextWidth(wm);
        // Watermark: scaled to span the ticket width, faint grey.
        doc.setFontSize(Math.min(34, (24 * (w - 14)) / wmW));
        doc.text(wm, x + w / 2, logoDrawn ? y + h - 8 : y + h / 2, { align: "center" });
        doc.setFillColor(20, 20, 20);
        doc.roundedRect(x, y, w, 12, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(label, x + 2, y + 8);
        doc.text(wm, x + w / 2, y + 8, { align: "center" });
        doc.text(
          `#${String(i + 1).padStart(2, "0")} / ${tickets.length}`,
          x + w - 2,
          y + 8,
          { align: "right" }
        );
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
      }
      doc.save(`tambola-tickets-${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("PDF downloaded");
    } catch {
      showToast("PDF unavailable — use Print instead");
    }
  }, [tickets, labels, showToast, watermark, logo, logoWidth, logoHeight, logoDepth, wmColor]);

  return (
    <div>
      {/* Master Customizer Panel */}
      <div className="no-print w-full bg-surface-container-low rounded-2xl p-6 lg:p-8 space-y-8 shadow-xl">
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
              <TuneSlider
                icon="zoom_in"
                label="Ticket zoom"
                value={zoomPct}
                min={70}
                max={130}
                onChange={setZoomPct}
              />
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-mono">
              {THEME_OPTIONS.length} Themes · {DESIGN_OPTIONS.length} Designs
            </span>
          </div>
        </div>

        {/* Branding: watermark text + logo */}
        <div className="rounded-2xl bg-surface-container-highest/60 border border-primary-container/30 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">brand_awareness</span>
              Watermark &amp; Logo
            </span>
            <span className="font-label-sm text-label-sm text-secondary">
              Printed on every ticket · defaults to “NAVEEN CHERRY”
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">water_drop</span>
                Watermark Text
              </span>
              <input
                type="text"
                value={watermark}
                maxLength={40}
                onChange={(e) => setWatermark(e.target.value)}
                placeholder="NAVEEN CHERRY"
                className="w-full bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl font-label-md text-label-md font-semibold tracking-wide uppercase focus:outline-none focus:bg-surface-container shadow-inner transition-colors"
              />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center gap-1.5 pt-1">
                <span className="material-symbols-outlined text-sm">format_color_text</span>
                Watermark Colour
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-surface-container-highest p-1.5 shadow-inner">
                <input
                  type="color"
                  value={wmColor || "#8a6f4d"}
                  onChange={(e) => setWmColor(e.target.value)}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
                  aria-label="Watermark colour"
                />
                <span className="truncate font-mono text-[11px] text-on-surface-variant">
                  {wmColor || "Theme default"}
                </span>
                {wmColor && (
                  <button
                    type="button"
                    onClick={() => setWmColor("")}
                    className="ml-auto rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface px-3 py-1.5 font-label-sm text-label-sm font-bold flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Auto
                  </button>
                )}
              </span>
            </label>
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">image</span>
                Logo (optional)
              </span>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer rounded-xl bg-surface-container hover:bg-surface-bright text-on-surface px-4 py-3 font-label-md text-label-md font-bold flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">upload</span>
                  {logo ? "Replace logo" : "Upload logo"}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    onLogoFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {logo ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-white/90 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setLogo("")}
                      className="rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface px-3 py-2 font-label-sm text-label-sm font-bold flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    PNG, JPG or SVG · shown faintly behind the numbers
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Width + height + depth tuning — live on every ticket, saved to this browser */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TuneSlider
              icon="swap_horiz"
              label="Logo width"
              value={logoWidth}
              min={15}
              max={100}
              disabled={!logo}
              onChange={setLogoWidth}
            />
            <TuneSlider
              icon="swap_vert"
              label="Logo height"
              value={logoHeight}
              min={15}
              max={100}
              disabled={!logo}
              onChange={setLogoHeight}
            />
            <TuneSlider
              icon="opacity"
              label="Logo depth"
              value={logoDepth}
              min={2}
              max={50}
              disabled={!logo}
              onChange={setLogoDepth}
            />
            <TuneSlider
              icon="water_drop"
              label="Watermark depth"
              value={wmDepth}
              min={0}
              max={100}
              onChange={setWmDepth}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">aspect_ratio</span>
              Logo fit
            </span>
            <div className={`grid grid-cols-2 gap-2 bg-surface-container-highest p-1 rounded-xl w-full sm:w-96 ${!logo ? "opacity-40" : ""}`}>
              {(
                [
                  ["fit", "Fit · whole logo"],
                  ["fill", "Fill · exact box"],
                ] as ["fit" | "fill", string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={!logo}
                  onClick={() => setLogoFit(value)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all disabled:cursor-not-allowed ${
                    logoFit === value
                      ? "bg-primary-container text-on-primary-container font-label-md text-label-md font-bold"
                      : "text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-medium"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Fill crops edges to match your exact width × height
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
        // Single column on phones (stacked top-to-bottom); sm+ decks follow
        // the zoom: dense multi-col when small, roomy 1–2 col when large.
        // NOTE: base MUST be grid-cols-1, not bare `grid` — an implicit auto
        // track sizes to max-content, so a long watermark blows the ticket
        // past the phone frame (Tailwind grid-cols-* uses minmax(0,1fr),
        // which caps the track). Tight phone gap, airy sm+ gap.
        className={`grid grid-cols-1 gap-2 sm:gap-4 ${
          zoomPct <= 92
            ? "sm:grid-cols-3 xl:grid-cols-4"
            : zoomPct >= 103
              ? "sm:grid-cols-1 lg:grid-cols-2"
              : "sm:grid-cols-2 xl:grid-cols-3"
        }`}
        style={zoomPct !== 100 ? { zoom: zoomPct / 100 } : undefined}
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
                  customStyles={style === "custom" ? customStyles : undefined}
                  watermarkText={watermark || undefined}
                  logo={logo || undefined}
                  logoWidth={logoWidth / 100}
                  logoHeight={logoHeight / 100}
                  logoFit={logoFit}
                  logoOpacity={logoDepth / 100}
                  watermarkOpacity={wmDepth / 100}
                  watermarkColor={wmColor || undefined}
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
