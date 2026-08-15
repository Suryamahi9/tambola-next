"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateHalfSetBatch,
  generateSetBatch,
  generateUniqueGrids,
  loadBatches,
  saveBatch,
  type Batch,
  type Grid,
} from "@/lib/ticket";
import TicketCard from "./TicketCard";

type Mode = "random" | "fullset" | "halfset";
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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Load saved batches after mount so server and client first renders match.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setBatches(loadBatches()));
    return () => window.cancelAnimationFrame(id);
  }, []);

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
      setBatches(saveBatch(batch));
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
      setBatches(saveBatch(batch));
      showToast(`Generated ${batch.length} unique tickets — half sets, 45 numbers each`);
      return;
    }

    const n = Math.max(1, Math.min(30, count));
    const grids = generateUniqueGrids(n);
    setTickets(grids);
    setLabels(Array(n).fill(name.trim() || null));
    setBatches(saveBatch(grids));
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
    setBatches(saveBatch(grids));
    showToast("Tickets with names generated");
  }, [mode, name, count, showToast]);

  const restore = useCallback(
    (batch: Batch) => {
      setMode("random");
      setCount(batch.tickets.length);
      setTickets(batch.tickets);
      setLabels(Array(batch.tickets.length).fill(null));
      showToast(`Restored batch from ${batch.time}`);
    },
    [showToast]
  );

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
        doc.setFillColor(i % 2 === 1 ? 138 : 253, i % 2 === 1 ? 90 : 251, i % 2 === 1 ? 46 : 247);
        doc.roundedRect(x, y, w, h, 5, 5, "F");
        doc.setFillColor(i % 2 === 1 ? 104 : 90, i % 2 === 1 ? 74 : 58, i % 2 === 1 ? 38 : 29);
        doc.roundedRect(x, y, w, 12, 3, 3, "F");
        doc.setTextColor(i % 2 === 1 ? 248 : 246, i % 2 === 1 ? 238 : 236, i % 2 === 1 ? 222 : 217);
        doc.setFontSize(8);
        doc.text(`${label}  ·  #${String(i + 1).padStart(2, "0")} / ${tickets.length}`, x + 2, y + 8);
        const cw = w / 9;
        const ch = (h - 14) / 3;
        doc.setFontSize(9);
        grid.forEach((row, r) =>
          row.forEach((v, c) => {
            const cx = x + c * cw;
            const cy = y + 14 + r * ch;
            doc.setDrawColor(i % 2 === 1 ? 201 : 224, i % 2 === 1 ? 154 : 210, i % 2 === 1 ? 99 : 180);
            doc.setLineWidth(0.2);
            doc.rect(cx, cy, cw, ch);
            if (v !== null) {
              doc.setTextColor(i % 2 === 1 ? 251 : 107, i % 2 === 1 ? 243 : 74, i % 2 === 1 ? 226 : 35);
              doc.text(String(v), cx + cw / 2, cy + ch / 2 + 1.5, { align: "center" });
            }
          })
        );
        doc.setTextColor(120, 120, 120);
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
      <div className="glass rounded-2xl border border-white/10 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Mode
              </span>
              <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-1">
                {(
                  [
                    ["random", "Random Tickets"],
                    ["fullset", "Full Set (1–90)"],
                    ["halfset", "Half Set (45)"],
                  ] as [Mode, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => switchMode(value)}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mode === value
                        ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {mode === "fullset"
                  ? "How many sets (6 each)"
                  : mode === "halfset"
                    ? "How many sets (3 each)"
                    : "How many tickets"}
              </span>
              <input
                type="number"
                min={1}
                max={mode === "random" ? 30 : 50}
                value={count}
                onChange={(e) => handleCountChange(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#0b0d1a] px-4 py-2.5 text-sm font-semibold text-neutral-100 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Player name (optional)
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Surya"
                className="w-full rounded-xl border border-white/15 bg-[#0b0d1a] px-4 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/40 transition hover:brightness-110"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M20 12a8 8 0 1 1-8-8m0 0v8m4-8h-4" />
              </svg>
              Generate
            </button>
            <button
              type="button"
              onClick={fillNames}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-violet-400"
            >
              Fill Names
            </button>
            <button
              type="button"
              onClick={printAll}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-violet-400"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => void downloadPDF()}
              disabled={tickets.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-violet-400"
            >
              ⬇ PDF
            </button>
          </div>
        </div>

        {mode === "fullset" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Full Set mode generates official 6-ticket books where every number from 1 to 90
            appears exactly once across each set, and no ticket repeats. Choose 1–50 sets.
          </p>
        )}
        {mode === "halfset" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Half Set mode deals 3-ticket half-books — 45 unique numbers each — and every ticket
            in the batch is unique. Choose 1–50 half-sets.
          </p>
        )}
      </div>

      <div ref={printRef} className="print-area mt-8">
        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-16 text-center dark:border-neutral-700">
            <p className="text-4xl">🎫</p>
            <p className="mt-3 font-semibold text-neutral-700 dark:text-neutral-200">
              No tickets yet
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Configure the settings above and hit Generate.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tickets.map((grid, i) => (
              <div key={i}>
                <TicketCard
                  grid={grid}
                  name={labels[i] || undefined}
                  index={i}
                  total={tickets.length}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
            Recent Batches
          </h2>
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {batches.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No batches yet — generate your first set of tickets above.
            </p>
          ) : (
            batches.map((batch, i) => {
              const sample = batch.tickets[0]
                ? batch.tickets[0].flat().filter((v): v is number => v !== null).slice(0, 10)
                : [];
              return (
                <div
                  key={i}
                  className="glass-subtle flex items-center justify-between gap-3 rounded-xl border border-white/10 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                      🕐 {batch.time} · {batch.tickets.length} tickets
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Sample: {sample.join(", ")}…
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(batch)}
                    className="shrink-0 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-violet-400 hover:text-violet-200"
                  >
                    ↻ Reuse
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
