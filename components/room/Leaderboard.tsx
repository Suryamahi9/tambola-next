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

  const crown = ["👑", "🥈", "🥉"];

  if (ranked.length === 0) return null;

  return (
    <div className="glass-subtle rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Leaderboard
        </p>
        {room.round > 1 && (
          <span className="text-[11px] font-semibold text-neutral-500">
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
                ? "border border-amber-500/20 bg-amber-500/10"
                : "bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center text-xs">{crown[i] ?? `${i + 1}.`}</span>
              <span className={`font-semibold ${i === 0 && p.wins > 0 ? "text-amber-300" : "text-neutral-200"}`}>
                {p.name}
              </span>
              {p.id === room.callerId && <span className="text-[10px]">🎙️</span>}
            </div>
            <span className="flex items-center gap-1.5">
              {p.wins > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  {p.wins} win{p.wins === 1 ? "" : "s"}
                </span>
              )}
              <span className="text-[11px] text-neutral-500">{p.ticketCount} 🎟️</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Per-round history */}
      {history.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Past rounds
          </p>
          <ul className="mt-2 space-y-1">
            {[...history].reverse().map((h) => (
              <li
                  key={h.round}
                  className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5 text-[11px]"
                >
                  <span className="font-semibold text-neutral-300">Round {h.round}</span>
                  <span className="text-neutral-400">
                    {h.winnerName ? (
                      <>
                        🏆 <span className="text-neutral-200">{h.winnerName}</span>
                        {h.calledCount > 0 && (
                          <span className="ml-1 text-neutral-500">· {h.calledCount} calls</span>
                        )}
                      </>
                    ) : (
                      <span className="text-neutral-500">No winner · {h.calledCount} calls</span>
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
