import type { Metadata } from "next";
import Onboarding from "@/components/play/Onboarding";
import {
  TICKETS_TO_START,
  MAX_ROOM_TICKETS,
  MAX_TICKETS_PER_PLAYER,
  formatRupees,
  pricePerTicketPaise,
} from "@/lib/room/engine";

export const metadata: Metadata = {
  title: "Play — Party Room",
  description:
    "Join a Tambola party room: pay for your tickets, enter the room, and the host starts once 15 tickets have joined.",
};

export const dynamic = "force-dynamic";

export default function PlayPage() {
  const pricePerTicket = pricePerTicketPaise();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/10 px-3 py-1 font-label-sm text-xs uppercase tracking-wider text-primary">
          <span className="material-symbols-outlined text-sm">groups</span>
          Party Room
        </span>
        <h1 className="mt-4 font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
          Buy your tickets, join the room
        </h1>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          Enter your name and pick your tickets. Rooms hold {TICKETS_TO_START}–
          {MAX_ROOM_TICKETS} tickets, and the host starts the game once the{" "}
          {TICKETS_TO_START}-ticket minimum is in — one player can buy up to{" "}
          {MAX_TICKETS_PER_PLAYER}.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-6 sm:p-8 shadow-xl">
        <Onboarding
          pricePerTicket={pricePerTicket}
          formattedPrice={formatRupees(pricePerTicket)}
          ticketsToStart={TICKETS_TO_START}
          maxTickets={MAX_TICKETS_PER_PLAYER}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: "lock", title: "Secure checkout", text: "Razorpay-powered payments; test mode auto-approves so you can try it." },
          { icon: "confirmation_number", title: "15–50 tickets per room", text: `A room needs ${TICKETS_TO_START} paid tickets to start and caps at ${MAX_ROOM_TICKETS}.` },
          { icon: "ticket", title: "One player, many tickets", text: "Buy up to five tickets yourself and mark them off live." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl bg-surface-container/90 backdrop-blur-2xl border border-outline-variant/40 p-4">
            <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
            <p className="mt-2 font-label-md text-sm font-bold text-on-surface">{f.title}</p>
            <p className="mt-1 font-body-sm text-xs leading-relaxed text-on-surface-variant">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
