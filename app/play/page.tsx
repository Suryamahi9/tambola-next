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
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          Party Room
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          Buy your tickets, join the room
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Enter your name and pick your tickets. Rooms hold {TICKETS_TO_START}–
          {MAX_ROOM_TICKETS} tickets, and the host starts the game once the{" "}
          {TICKETS_TO_START}-ticket minimum is in — one player can buy up to{" "}
          {MAX_TICKETS_PER_PLAYER}.
        </p>
      </div>

      <div className="glass mt-8 rounded-2xl border border-white/10 p-6 sm:p-8">
        <Onboarding
          pricePerTicket={pricePerTicket}
          formattedPrice={formatRupees(pricePerTicket)}
          ticketsToStart={TICKETS_TO_START}
          maxTickets={MAX_TICKETS_PER_PLAYER}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🔒", title: "Secure checkout", text: "Razorpay-powered payments; test mode auto-approves so you can try it." },
          { icon: "🎟️", title: "15–50 tickets per room", text: `A room needs ${TICKETS_TO_START} paid tickets to start and caps at ${MAX_ROOM_TICKETS}.` },
          { icon: "🎫", title: "One player, many tickets", text: "Buy up to five tickets yourself and mark them off live." },
        ].map((f) => (
          <div key={f.title} className="glass-subtle rounded-xl border border-white/10 p-4">
            <span className="text-xl">{f.icon}</span>
            <p className="mt-2 text-sm font-bold text-neutral-900 dark:text-white">{f.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
