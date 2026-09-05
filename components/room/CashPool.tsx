"use client";

import type { PublicRoom } from "@/lib/room/types";

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Live cash pool — pot, per-player contribution, and ticket slots. */
export default function CashPool({ room }: { room: PublicRoom }) {
  const paid = room.players.filter((p) => p.paid);
  const paidTickets = paid.reduce((n, p) => n + p.ticketCount, 0);
  const potPaise = paidTickets * room.pricePerTicket;
  const pending = room.players.filter((p) => !p.paid);

  return (
    <div className="glass-subtle rounded-2xl border border-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
        💰 Cash pool
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="font-display text-2xl font-bold text-emerald-300">
            {formatRupees(potPaise)}
          </p>
          <p className="text-[11px] text-neutral-500">
            {paidTickets} paid ticket{paidTickets === 1 ? "" : "s"} × {formatRupees(room.pricePerTicket)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-lg font-bold text-white">
            {paidTickets}
            <span className="text-sm text-neutral-500">/50</span>
          </p>
          <p className="text-[11px] text-neutral-500">ticket slots filled</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {paid.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px]"
          >
            <span className="font-semibold text-neutral-200">{p.name}</span>
            <span className="text-emerald-300">
              {formatRupees(p.ticketCount * room.pricePerTicket)}
            </span>
          </span>
        ))}
        {pending.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px]"
          >
            <span className="font-semibold text-amber-300">{p.name}</span>
            <span className="text-amber-200/70">{p.ticketCount} 🎟️ pending</span>
          </span>
        ))}
      </div>
    </div>
  );
}