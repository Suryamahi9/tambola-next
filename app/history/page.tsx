import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { PLAYER_COOKIE } from "@/lib/room/engine";
import { playerGameHistory } from "@/lib/room/history";
import { getAllRooms } from "@/lib/room/store";

export const metadata: Metadata = {
  title: "My Games — Golden Tambola",
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
  const careerWins = history.rooms.reduce((n, r) => n + r.wins, 0);

  return (
    <div className="carnival-glow mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 font-label-sm text-label-sm uppercase tracking-widest text-on-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          Player history
        </span>
        <h1 className="gold-text mt-4 font-headline-lg text-headline-lg font-bold tracking-tight">
          My Games
        </h1>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          Every party room you have joined, every prize you have claimed, across all rounds.
        </p>
      </div>
      <div className="marquee-bulbs mt-6" aria-hidden />

      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Games played", value: history.totalGames, icon: "🕹️" },
          { label: "Patterns won", value: history.totalPrizes, icon: "🏆" },
          { label: "Career wins", value: careerWins, icon: "⭐" },
          { label: "Numbers called", value: history.totalCalls, icon: "🔢" },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl border border-primary/20 p-5 shadow-xl shadow-black/40">
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              {card.icon} {card.label}
            </p>
            <p className="gold-text mt-2 font-headline-md text-headline-md font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Games list */}
      {history.rooms.length === 0 ? (
        <div className="glass mt-8 rounded-2xl border border-primary/20 p-12 text-center shadow-xl shadow-black/40">
          <p className="text-4xl">🎫</p>
          <p className="mt-3 font-label-md text-label-md font-semibold text-on-surface">No games yet</p>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Join a party room and your history will show up here automatically.
          </p>
          <Link
            href="/play"
            className="gold-face gold-sheen relative mt-6 inline-flex items-center overflow-hidden rounded-full px-6 py-2.5 font-headline-sm text-headline-sm transition-transform hover:-translate-y-0.5"
          >
            Play now
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {history.rooms.map((r, i) => (
            <div key={`${r.roomId}-${r.code}`}>
              {i > 0 && <div className="stub-divider mb-3" aria-hidden />}
              <div
                className="glass-subtle rounded-2xl border border-primary/20 p-5 shadow-xl shadow-black/40"
              >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 font-label-md text-label-md font-bold tracking-widest text-primary">
                    {r.code}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      r.status === "live"
                        ? "bg-primary/15 text-primary"
                        : r.status === "finished"
                          ? "bg-surface-container-high text-on-surface-variant"
                          : "bg-primary/15 text-primary"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.wasHost && <span className="text-[11px] text-on-surface-variant">👑 host</span>}
                  {r.wasCaller && <span className="text-[11px] text-on-surface-variant">🎙️ caller</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-on-surface-variant">
                    {r.ticketsOwned} 🎟️
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-on-surface-variant">
                    {r.calledCount} calls
                  </span>
                  {r.wins > 0 && (
                    <span className="rounded-full bg-secondary/15 px-2.5 py-1 font-bold text-secondary">
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
                      className="inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-secondary"
                    >
                      🏆 {label}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 text-[11px] text-on-surface-variant/70">
                played as <span className="font-semibold text-on-surface-variant">{r.name}</span>
                {r.startedAt && <> · started {new Date(r.startedAt).toLocaleString()}</>}
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}