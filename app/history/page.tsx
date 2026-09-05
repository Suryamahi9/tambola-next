import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { PLAYER_COOKIE } from "@/lib/room/engine";
import { playerGameHistory } from "@/lib/room/history";
import { getAllRooms } from "@/lib/room/store";

export const metadata: Metadata = {
  title: "My Games — Tambola Zone",
  description: "Every Tambola party room you've joined, the prizes you've won, and your all-time record.",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLAYER_COOKIE)?.value;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "player") redirect("/play");

  const rooms = await getAllRooms();
  const history = playerGameHistory(rooms, payload.uid);
  const cashWon = history.rooms.reduce((n, r) => n + r.wins, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
          Player history
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          My Games
        </h1>
        <p className="mt-3 text-neutral-400">
          Every party room you have joined, every prize you have claimed, across all rounds.
        </p>
      </div>

      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Games played", value: history.totalGames, icon: "🕹️" },
          { label: "Patterns won", value: history.totalPrizes, icon: "🏆" },
          { label: "Career wins", value: cashWon, icon: "⭐" },
          { label: "Numbers called", value: history.totalCalls, icon: "🔢" },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl border border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {card.icon} {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Games list */}
      {history.rooms.length === 0 ? (
        <div className="glass mt-8 rounded-2xl border border-white/10 p-12 text-center">
          <p className="text-4xl">🎫</p>
          <p className="mt-3 font-semibold text-neutral-200">No games yet</p>
          <p className="mt-1 text-sm text-neutral-400">
            Join a party room and your history will show up here automatically.
          </p>
          <Link
            href="/play"
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white"
          >
            Play now
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {history.rooms.map((r) => (
            <div
              key={`${r.roomId}-${r.code}`}
              className="glass-subtle rounded-2xl border border-white/10 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-sm font-bold tracking-widest text-violet-300">
                    {r.code}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      r.status === "live"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : r.status === "finished"
                          ? "bg-neutral-500/15 text-neutral-300"
                          : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.wasHost && <span className="text-[11px] text-neutral-400">👑 host</span>}
                  {r.wasCaller && <span className="text-[11px] text-neutral-400">🎙️ caller</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-neutral-300">
                    {r.ticketsOwned} 🎟️
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-neutral-300">
                    {r.calledCount} calls
                  </span>
                  {r.wins > 0 && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-300">
                      {r.wins} win{r.wins === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              {r.prizeLabels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.prizeLabels.map((label, i) => (
                    <span
                      key={`${label}-${i}`}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300"
                    >
                      🏆 {label}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 text-[11px] text-neutral-500">
                played as <span className="font-semibold text-neutral-300">{r.name}</span>
                {r.startedAt && <> · started {new Date(r.startedAt).toLocaleString()}</>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}