"use client";

import { useCallback, useEffect, useState } from "react";
import {
  generateHalfSetBatch,
  generateSetBatch,
  generateUniqueGrids,
  type Grid,
} from "@/lib/ticket";
import TicketCard, { STYLE_LABELS, type TicketStyle } from "./TicketCard";

type Mode = "random" | "fullset" | "halfset";
const STYLE_OPTIONS = Object.entries(STYLE_LABELS) as [TicketStyle, string][];
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
  const [style, setStyle] = useState<TicketStyle>("paperwhite");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const generate = useCallback(() => {
    if (mode === "fullset") {
      const sets = Math.max(1, Math.min(50, count));
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
      const sets = Math.max(1, Math.min(50, count));
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

    const n = Math.max(1, Math.min(30, count));
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
    const n = Math.max(1, Math.min(30, count));
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
      setCount(Math.max(1, Math.min(50, parsed)));
    } else {
      setCount(Math.max(1, Math.min(30, parsed)));
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === "fullset") {
      setCount((c) => Math.max(1, Math.min(50, Math.ceil(c / 6))));
    } else if (m === "halfset") {
      setCount((c) => Math.max(1, Math.min(50, Math.ceil(c / 3))));
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
                max={mode === "random" ? 30 : 50}
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
                onChange={(e) => setStyle(e.target.value as TicketStyle)}
                className="w-full bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl font-label-md text-label-md focus:outline-none focus:bg-surface-container shadow-inner transition-colors"
              >
                {STYLE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-mono">11 Luxury Card Schemes</span>
          </div>
        </div>

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
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
            <span>Zero Duplicate Lines • Exact 5 Numbers/Row Standard</span>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-container-highest p-16 text-center bg-surface-container-low/40">
            <span className="material-symbols-outlined text-5xl text-primary">local_activity</span>
            <p className="mt-3 font-headline-sm text-headline-sm text-on-surface font-bold">No tickets yet</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Configure the customizer above and hit the gold Generate button.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tickets.map((grid, i) => (
              <div key={i} className="break-inside-avoid">
                <TicketCard
                  grid={grid}
                  name={labels[i] || undefined}
                  index={i}
                  total={tickets.length}
                  style={style}
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
