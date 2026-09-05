"use client";

import { useState } from "react";

/** Draw history + speed controls panel — sits under the board for the caller. */
export default function CallerControls({
  calledNumbers,
  isCaller,
  live,
  speedMs,
  onSpeedChange,
}: {
  calledNumbers: number[];
  isCaller: boolean;
  live: boolean;
  speedMs: number;
  onSpeedChange: (ms: number) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);

  const SPEEDS: [string, number][] = [
    ["10 s", 10000],
    ["5 s", 5000],
    ["3 s", 3000],
    ["2 s", 2000],
    ["15 s", 15000],
    ["30 s", 30000],
  ];

  const history = [...calledNumbers].reverse();

  return (
    <div className="glass-subtle mt-4 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Draw controls
        </p>
        {live && calledNumbers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-[11px] font-semibold text-violet-300 transition hover:text-violet-100"
          >
            {showHistory ? "Hide" : `History (${calledNumbers.length})`}
          </button>
        )}
      </div>

      {isCaller && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SPEEDS.map(([label, ms]) => (
            <button
              key={label}
              type="button"
              onClick={() => onSpeedChange(ms)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                speedMs === ms
                  ? "bg-violet-600/30 text-violet-200"
                  : "bg-white/[0.05] text-neutral-400 hover:bg-white/[0.1] hover:text-neutral-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {showHistory && history.length > 0 && (
        <div className="mt-3 max-h-40 overflow-y-auto [scrollbar-width:thin]">
          <div className="grid grid-cols-10 gap-1">
            {history.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className={`flex items-center justify-center rounded-md py-0.5 text-[11px] font-bold ${
                  i === 0
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white"
                    : "bg-white/[0.06] text-neutral-400"
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
