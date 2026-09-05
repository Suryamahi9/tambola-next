"use client";

import type { PublicRoom } from "@/lib/room/types";

/** Standings across rounds — shows cumulative wins + per-round history. */
export default function Leaderboard({ room }: { room: PublicRoom }) {
  const players = room.players;
  const standings = room.standings;
  const history = room.history;

  // Sort players by wins descending.
  const ranked = [...players]
    .map((p) => ({ ...p, wins: standings[p.id] ?? 0 }))
    .sort((a, b) => b.wins - a.wins || a.order - b.order);

  const crowns = [
    { icon: "military_tech", cls: "text-primary-fixed-dim" },
    { icon: "workspace_premium", cls: "text-on-surface-variant" },
    { icon: "workspace_premium", cls: "text-tertiary-fixed-dim" },
  ];

  if (ranked.length === 0) return null;

  return (
    <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Leaderboard
        </p>
        {room.round > 1 && (
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-[11px] font-semibold text-primary-fixed-dim">
            Round {room.round}
          </span>
        )}
      </div>

      {/* Ranked players */}
      <ul className="mt-3 space-y-1.5">
        {ranked.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
              i === 0 && p.wins > 0
                ? "border border-primary-container/30 bg-primary-container/15"
                : "bg-surface-container"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`flex w-5 items-center justify-center text-xs ${crowns[i]?.cls ?? "text-on-surface-variant"}`}>
                {crowns[i] ? (
                  <span className="material-symbols-outlined text-sm">{crowns[i].icon}</span>
                ) : (
                  `${i + 1}.`
                )}
              </span>
              <span className={`font-label-md font-semibold ${i === 0 && p.wins > 0 ? "text-primary-fixed-dim" : "text-on-surface"}`}>
                {p.name}
              </span>
              {p.id === room.callerId && (
                <span className="material-symbols-outlined text-sm text-primary-fixed-dim">mic</span>
              )}
            </div>
            <span className="flex items-center gap-1.5">
              {p.wins > 0 && (
                <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 text-[11px] font-bold text-secondary">
                  {p.wins} win{p.wins === 1 ? "" : "s"}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">confirmation_number</span>
                {p.ticketCount}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {/* Per-round history */}
      {history.length > 0 && (
        <div className="mt-4 border-t border-outline-variant/40 pt-3">
          <p className="font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Past rounds
          </p>
          <ul className="mt-2 space-y-1">
            {[...history].reverse().map((h) => (
              <li
                key={h.round}
                className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-1.5 text-[11px]"
              >
                <span className="font-semibold text-on-surface">Round {h.round}</span>
                <span className="text-on-surface-variant">
                  {h.winnerName ? (
                    <>
                      <span className="material-symbols-outlined text-sm align-middle mr-1 text-primary">emoji_events</span>
                      <span className="text-primary-fixed-dim">{h.winnerName}</span>
                      {h.calledCount > 0 && (
                        <span className="ml-1 text-on-surface-variant/70">· {h.calledCount} calls</span>
                      )}
                    </>
                  ) : (
                    <span className="text-on-surface-variant/70">No winner · {h.calledCount} calls</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
