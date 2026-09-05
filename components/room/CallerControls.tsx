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
    <div className="mt-4 rounded-2xl bg-surface-container/90 backdrop-blur-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Draw controls
        </p>
        {live && calledNumbers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-[11px] font-semibold text-primary-fixed-dim transition hover:text-primary"
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
                  ? "bg-secondary-container text-on-secondary-container shadow-md"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
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
                    ? "bg-gradient-to-tr from-primary-fixed to-primary-container text-on-primary-container shadow-md"
                    : "bg-surface-container-high text-on-surface-variant"
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
