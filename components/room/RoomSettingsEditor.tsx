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
    <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Prize settings
        </p>
        <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] text-on-surface-variant">
          Host only · before start
        </span>
      </div>

      {/* Active patterns */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {ROWS.map((row) => {
          const on = draft[row.key] as boolean;
          if (row.key === "fullHouse") {
            return (
              <div
                key={row.key}
                className="flex items-center justify-between rounded-xl border border-primary-container/30 bg-primary-container/10 px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-primary-fixed-dim">{row.label} <span className="material-symbols-outlined text-base align-middle">star</span></p>
                  <p className="text-[11px] text-on-surface-variant">{row.desc}</p>
                </div>
                <span className="rounded-full bg-primary-container/25 px-2.5 py-1 text-[11px] font-bold text-primary-fixed-dim">
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
                  ? "border-secondary-container/40 bg-secondary-container/15"
                  : "border-outline-variant/40 bg-surface-container"
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${on ? "text-secondary" : "text-on-surface-variant"}`}>
                  {row.label}
                </p>
                <p className="text-[11px] text-on-surface-variant">{row.desc}</p>
              </div>
              <span
                className={`material-symbols-outlined text-lg ${on ? "text-secondary" : "text-on-surface-variant/60"}`}
                aria-hidden="true"
              >
                {on ? "check_circle" : "radio_button_unchecked"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Line priority */}
      <div className="mt-5">
        <p className="font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Line priority (highest first)
        </p>
        <div className="mt-2 space-y-1.5">
          {lineOrder.map((line, i) => (
            <div
              key={line}
              className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high text-xs text-on-surface-variant">{i + 1}</span>
                <span className="text-sm font-semibold text-on-surface">
                  {LINE_NAMES[line]} Line
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => moveLine(line, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container-high text-sm text-on-surface-variant transition hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-30"
                  aria-label={`Move ${LINE_NAMES[line]} line up`}
                >
                  <span className="material-symbols-outlined text-base">arrow_upward</span>
                </button>
                <button
                  type="button"
                  disabled={disabled || i === lineOrder.length - 1}
                  onClick={() => moveLine(line, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container-high text-sm text-on-surface-variant transition hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-30"
                  aria-label={`Move ${LINE_NAMES[line]} line down`}
                >
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-error/30 bg-error-container/15 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={disabled || saving}
        onClick={save}
        className="mt-4 w-full rounded-xl bg-secondary-container/25 px-5 py-2.5 text-sm font-bold text-secondary transition hover:bg-secondary-container/40 disabled:opacity-50"
      >
        {saving ? "Saving…" : moved ? "Save settings" : "Saved"}
      </button>
    </div>
  );
}