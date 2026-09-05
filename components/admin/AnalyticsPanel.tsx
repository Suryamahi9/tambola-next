"use client";

import type { Room } from "@/lib/room/types";

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (ms < 60_000) return "just now";
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86400_000) return `${Math.floor(ms / 3600_000)}h ago`;
  return `${Math.floor(ms / 86400_000)}d ago`;
}

function csvCell(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPanel({ rooms }: { rooms: Room[] }) {
  const totalRooms = rooms.length;
  const live = rooms.filter((r) => r.status === "live").length;
  const waiting = rooms.filter((r) => r.status === "waiting").length;
  const finished = rooms.filter((r) => r.status === "finished").length;

  const allPlayers = rooms.flatMap((r) => r.players);
  const paidPlayers = allPlayers.filter((p) => p.paid);
  const totalTickets = paidPlayers.reduce((n, p) => n + p.tickets.length, 0);

  // Revenue from the paid room prices.
  const totalRevenue = paidPlayers.reduce((n, p) => {
    const room = rooms.find((r) => r.players.some((pl) => pl.id === p.id));
    return n + (room?.pricePerTicket ?? 2000) * p.tickets.length;
  }, 0);

  // Top players by win count across all rooms.
  const winMap = new Map<string, { name: string; wins: number; games: number }>();
  for (const room of rooms) {
    for (const p of room.players) {
      const entry = winMap.get(p.id) ?? { name: p.name, wins: 0, games: 0 };
      entry.wins += room.standings[p.id] ?? 0;
      entry.games += 1;
      winMap.set(p.id, entry);
    }
  }
  const topPlayers = [...winMap.values()].sort((a, b) => b.wins - a.wins).slice(0, 10);

  // Recent finished rooms.
  const recent = [...rooms]
    .filter((r) => r.status === "finished" && r.finishedAt)
    .sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!))
    .slice(0, 8);

  function exportRooms() {
    downloadCsv(`tambola-rooms-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Room code", "Status", "Round", "Players", "Paid players", "Paid tickets", "Price/ticket", "Revenue", "Called", "Winner", "Created", "Started", "Finished"],
      ...rooms.map((r) => [
        r.code,
        r.status,
        r.round,
        r.players.length,
        r.players.filter((p) => p.paid).length,
        r.players.filter((p) => p.paid).reduce((n, p) => n + p.tickets.length, 0),
        formatRupees(r.pricePerTicket),
        formatRupees(r.players.filter((p) => p.paid).reduce((n, p) => n + p.tickets.length * r.pricePerTicket, 0)),
        r.calledNumbers.length,
        r.winner?.playerName ?? "",
        r.createdAt,
        r.startedAt ?? "",
        r.finishedAt ?? "",
      ]),
    ]);
  }

  function exportPayments() {
    downloadCsv(`tambola-payments-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Room", "Player", "Tickets", "Price/ticket", "Paid amount", "Status", "Joined"],
      ...rooms.flatMap((r) =>
        r.players.map((p) => [
          r.code,
          p.name,
          p.tickets.length,
          formatRupees(r.pricePerTicket),
          formatRupees(p.tickets.length * r.pricePerTicket),
          p.paid ? "paid" : "pending",
          p.joinedAt,
        ])
      ),
    ]);
  }

  function exportPrizes() {
    downloadCsv(`tambola-prizes-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Room", "Round", "Prize", "Player", "Calls at win", "Player id"],
      ...rooms.flatMap((r) =>
        r.prizes.map((p) => [r.code, r.round, p.label, p.playerName, p.calledCount, p.playerId])
      ),
    ]);
  }

  return (
    <div className="space-y-6">
      {/* Export toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Data exports
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportRooms}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-neutral-200 transition hover:border-violet-400 hover:text-violet-200"
          >
            ⬇ Rooms CSV
          </button>
          <button
            type="button"
            onClick={exportPayments}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-neutral-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            ⬇ Payments CSV
          </button>
          <button
            type="button"
            onClick={exportPrizes}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-neutral-200 transition hover:border-amber-400 hover:text-amber-200"
          >
            ⬇ Prizes CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total rooms", value: totalRooms, icon: "🏠" },
          { label: "Total revenue", value: formatRupees(totalRevenue), icon: "💰" },
          { label: "Tickets sold", value: totalTickets, icon: "🎟️" },
          { label: "Paid players", value: paidPlayers.length, icon: "👥" },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl border border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {card.icon} {card.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status breakdown */}
        <section className="glass rounded-2xl border border-white/10 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Room status
          </h3>
          <div className="mt-3 space-y-2">
            {[
              { label: "Live", count: live, color: "emerald" },
              { label: "Waiting", count: waiting, color: "amber" },
              { label: "Finished", count: finished, color: "neutral" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span className={`text-${s.color}-300 font-medium`}>{s.label}</span>
                <span className="font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top players */}
        <section className="glass rounded-2xl border border-white/10 p-5 lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Top players
          </h3>
          {topPlayers.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No data yet — play some games!</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {topPlayers.map((p, i) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs">{i === 0 ? "👑" : `${i + 1}.`}</span>
                    <span className="font-semibold text-neutral-200">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300">
                      {p.wins} win{p.wins === 1 ? "" : "s"}
                    </span>
                    <span className="text-neutral-500">{p.games} game{p.games === 1 ? "" : "s"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent games */}
      <section className="glass rounded-2xl border border-white/10 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Recent games
        </h3>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No finished games yet.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-violet-300">{r.code}</span>
                  <span className="text-neutral-300">
                    {r.players.filter((p) => p.paid).length} players
                  </span>
                  <span className="text-neutral-500">
                    {r.calledNumbers.length} calls
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {r.winner && (
                    <span className="text-emerald-300">🏆 {r.winner.playerName}</span>
                  )}
                  <span className="text-neutral-500">{r.finishedAt ? timeAgo(r.finishedAt) : ""}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
