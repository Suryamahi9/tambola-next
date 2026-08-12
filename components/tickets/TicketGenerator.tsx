"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateStrip,
  generateUniqueGrids,
  loadBatches,
  saveBatch,
  type Batch,
  type Grid,
} from "@/lib/ticket";
import TicketCard from "./TicketCard";

type Mode = "random" | "fullset";

const SET_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function TicketGenerator() {
  const [mode, setMode] = useState<Mode>("random");
  const [count, setCount] = useState(15);
  const [name, setName] = useState("");
  const [tickets, setTickets] = useState<Grid[]>([]);
  const [labels, setLabels] = useState<(string | null)[]>([]);
  const [batches, setBatches] = useState<Batch[]>(() =>
    typeof window === "undefined" ? [] : loadBatches()
  );
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

  const generate = useCallback(() => {
    if (mode === "fullset") {
      const sets = Math.max(1, Math.min(8, count));
      const grids: Grid[] = [];
      const labelsOut: (string | null)[] = [];
      for (let s = 0; s < sets; s++) {
        const strip = generateStrip();
        if (!strip) {
          showToast("Could not generate a full set — please try again");
          return;
        }
        strip.forEach((g) => {
          grids.push(g);
          labelsOut.push(`Set ${SET_LABELS[s]}`);
        });
      }
      setTickets(grids);
      setLabels(labelsOut);
      setBatches(saveBatch(grids));
      showToast(`Generated ${grids.length} tickets — full set, 1–90 exactly once`);
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
    if (mode === "fullset") {
      setCount(Math.max(1, Math.min(8, parsed)));
    } else {
      setCount(Math.max(1, Math.min(30, parsed)));
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === "fullset") {
      setCount((c) => Math.max(1, Math.min(8, Math.ceil(c / 6))));
    }
  };

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
                {mode === "fullset" ? "How many sets (6 each)" : "How many tickets"}
              </span>
              <input
                type="number"
                min={mode === "fullset" ? 1 : 1}
                max={mode === "fullset" ? 8 : 30}
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
          </div>
        </div>

        {mode === "fullset" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Full Set mode generates an official 6-ticket book where every number from 1 to 90
            appears exactly once across the set. Choose 1–8 sets.
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
              <TicketCard
                key={i}
                grid={grid}
                name={labels[i] || undefined}
                index={i}
                total={tickets.length}
              />
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
