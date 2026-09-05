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
    <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-4 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">savings</span>
        <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Cash pool
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="font-headline-md text-headline-md font-bold text-primary-fixed-dim">
            {formatRupees(potPaise)}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            {paidTickets} paid ticket{paidTickets === 1 ? "" : "s"} × {formatRupees(room.pricePerTicket)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-headline-md text-lg font-bold text-on-surface">
            {paidTickets}
            <span className="text-sm text-on-surface-variant">/50</span>
          </p>
          <p className="text-[11px] text-on-surface-variant">ticket slots filled</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {paid.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 text-[11px]"
          >
            <span className="font-semibold text-on-surface">{p.name}</span>
            <span className="font-mono text-secondary-fixed-dim">
              {formatRupees(p.ticketCount * room.pricePerTicket)}
            </span>
          </span>
        ))}
        {pending.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-container/15 px-2.5 py-1 text-[11px]"
          >
            <span className="font-semibold text-primary-fixed-dim">{p.name}</span>
            <span className="material-symbols-outlined text-sm text-primary-fixed-dim">timer</span>
            <span className="text-primary/80">{p.ticketCount} pending</span>
          </span>
        ))}
      </div>
    </div>
  );
}