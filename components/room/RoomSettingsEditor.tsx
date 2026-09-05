"use client";

import { useState } from "react";
import type { RoomSettings } from "@/lib/room/types";

/** Host configures prize patterns + line priority before the game starts. */
export default function RoomSettingsEditor({
  settings,
  disabled,
  onSave,
  saving,
}: {
  settings: RoomSettings;
  disabled: boolean;
  onSave: (patch: Partial<RoomSettings>) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<RoomSettings>({ ...settings });
  const [lineOrder, setLineOrder] = useState<("top" | "middle" | "bottom")[]>(
    [...settings.lineOrder]
  );
  const [moved, setMoved] = useState(false);
  const [error, setError] = useState("");

  function toggle(key: keyof RoomSettings) {
    if (typeof draft[key] === "boolean") {
      setDraft((d) => ({ ...d, [key]: !d[key] }));
    }
  }

  function moveLine(id: "top" | "middle" | "bottom", dir: -1 | 1) {
    setMoved(true);
    setLineOrder((order) => {
      const i = order.indexOf(id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= order.length) return order;
      const next = [...order];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    if (!draft.fullHouse) {
      setError("Full House must stay on — it's the headline prize.");
      return;
    }
    const lineOrderKeys: ("top" | "middle" | "bottom")[] = [...lineOrder];
    setError("");
    onSave({
      fullHouse: draft.fullHouse,
      corners: draft.corners,
      earlyFive: draft.earlyFive,
      topLine: draft.topLine,
      middleLine: draft.middleLine,
      bottomLine: draft.bottomLine,
      lineOrder: lineOrderKeys,
    });
    setMoved(false);
  }

  const ROWS: { key: keyof RoomSettings; label: string; desc: string }[] = [
    { key: "fullHouse", label: "Full House", desc: "All 15 numbers on a ticket" },
    { key: "corners", label: "Corners", desc: "The four corner numbers" },
    { key: "topLine", label: "Top Line", desc: "Top row of 5" },
    { key: "middleLine", label: "Middle Line", desc: "Middle row of 5" },
    { key: "bottomLine", label: "Bottom Line", desc: "Bottom row of 5" },
    { key: "earlyFive", label: "Early Five", desc: "First to 5 on a ticket" },
  ];

  const LINE_NAMES: Record<string, string> = { top: "Top", middle: "Middle", bottom: "Bottom" };

  return (
    <div className="glass-subtle rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Prize settings
        </p>
        <span className="text-[11px] text-neutral-500">Host only · before start</span>
      </div>

      {/* Active patterns */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {ROWS.map((row) => {
          const on = draft[row.key] as boolean;
          if (row.key === "fullHouse") {
            return (
              <div
                key={row.key}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-2.5 opacity-80"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-200">{row.label} ★</p>
                  <p className="text-[11px] text-neutral-500">{row.desc}</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                  On
                </span>
              </div>
            );
          }
          return (
            <button
              key={row.key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(row.key)}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition disabled:opacity-60 ${
                on
                  ? "border-emerald-500/25 bg-emerald-500/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${on ? "text-emerald-200" : "text-neutral-400"}`}>
                  {row.label}
                </p>
                <p className="text-[11px] text-neutral-500">{row.desc}</p>
              </div>
              <span
                className={`text-lg ${on ? "text-emerald-400" : "text-neutral-600"}`}
                aria-hidden="true"
              >
                {on ? "●" : "○"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Line priority */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Line priority (highest first)
        </p>
        <div className="mt-2 space-y-1.5">
          {lineOrder.map((line, i) => (
            <div
              key={line}
              className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center text-xs text-neutral-500">{i + 1}</span>
                <span className="text-sm font-semibold text-neutral-200">
                  {LINE_NAMES[line]} Line
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => moveLine(line, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-sm text-neutral-300 transition hover:bg-white/[0.12] disabled:opacity-30"
                  aria-label={`Move ${LINE_NAMES[line]} line up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || i === lineOrder.length - 1}
                  onClick={() => moveLine(line, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-sm text-neutral-300 transition hover:bg-white/[0.12] disabled:opacity-30"
                  aria-label={`Move ${LINE_NAMES[line]} line down`}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={disabled || saving}
        onClick={save}
        className="mt-4 w-full rounded-full bg-violet-600/20 px-5 py-2.5 text-sm font-bold text-violet-200 transition hover:bg-violet-600/30 disabled:opacity-50"
      >
        {saving ? "Saving…" : moved ? "Save settings" : "Saved"}
      </button>
    </div>
  );
}