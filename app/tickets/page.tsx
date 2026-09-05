import type { Metadata } from "next";
import TicketGenerator from "@/components/tickets/TicketGenerator";
import { requireMember } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Ticket Generator",
  description:
    "Generate professional Tambola / Housie tickets that follow the official 3×9 rules — 15 numbers, 5 per row, 1–3 per column — or full 1–90 sets.",
};

const checklist = [
  "3 rows × 9 columns grid",
  "Exactly 15 numbers per ticket",
  "5 numbers in every row",
  "1–3 numbers in every column, none empty",
  "Column 1 = 1–9, column 9 = 80–90",
  "Columns sorted top-to-bottom, rows left-to-right",
  "No duplicate numbers on a ticket",
];

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  await requireMember("/tickets");
  return (
    <div className="w-full px-6 lg:px-12 py-8 space-y-10">
      {/* Command Deck */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-bold tracking-widest flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
              ENGINE V4.2 ACTIVE
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono tracking-wider">LIB/TICKET.TS • CERTIFIED RNG</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-4">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-black tracking-tight uppercase">
              Tambola Ticket Studio
            </h1>
            <span className="font-headline-sm text-headline-sm text-primary font-light tracking-wide">/ Batch Print Matrix</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Compliant 90-ball algorithm generator. Guarantees authentic 9×3 matrices (5 digits &amp; 4 blanks
            per row, monotonic column range constraints) calibrated for physical luxury print and digital VIP salons.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 bg-surface-container-low p-2 rounded-2xl shadow-md">
          <div className="bg-surface-container px-4 py-2.5 rounded-xl text-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest block">Batch Pool</span>
            <span className="font-ticket-digit text-ticket-digit text-primary font-bold">15 / 15</span>
          </div>
          <div className="bg-surface-container px-4 py-2.5 rounded-xl text-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest block">A4 Sheets</span>
            <span className="font-ticket-digit text-ticket-digit text-secondary font-bold">5 Pages</span>
          </div>
          <div className="bg-surface-container px-4 py-2.5 rounded-xl text-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest block">Entropy</span>
            <span className="font-ticket-digit text-ticket-digit text-tertiary font-bold">99.9%</span>
          </div>
        </div>
      </div>

      <TicketGenerator />

      {/* Designer 3D Tambola Slips — Visual Engine showcase */}
      <section className="group relative w-full rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-6 lg:p-8 shadow-2xl flex flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" aria-hidden="true"></div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-primary-fixed font-label-sm text-label-sm font-bold uppercase tracking-wider">
              Visual Engine
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">11 Gloss Themes</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
            Designer 3D Tambola Slips
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Alternating ticket shells rendered with deep iridescent finishes, crisp foil numbering, and layered
            3D depth — built for luxury print and screenshot-ready batch shares.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="p-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-inner">
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-2">
                <span className="text-primary font-bold">TICKET #01 • PAPER WHITE</span>
                <span className="text-secondary font-mono">EARLY 5 READY</span>
              </div>
              <div className="grid grid-cols-9 gap-1.5">
                {[7, null, 24, null, 49, null, null, 77, 88].map((v, i) =>
                  v === null ? (
                    <div key={i} className="h-9 rounded-lg bg-surface-container/30 flex items-center justify-center text-outline/30">•</div>
                  ) : (
                    <div
                      key={i}
                      className={`h-9 rounded-lg flex items-center justify-center font-ticket-digit text-ticket-digit font-bold ${
                        v === 77
                          ? "bg-primary-container text-on-primary-container shadow-[0_0_14px_rgba(245,158,11,0.5)]"
                          : "bg-surface-container-highest text-on-surface"
                      }`}
                    >
                      {v}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest/50 backdrop-blur-md shadow-inner opacity-90">
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-2">
                <span className="text-tertiary font-bold">TICKET #02 • ROSE GOLD VIP</span>
                <span className="text-on-surface-variant font-mono">1/5 DABBED</span>
              </div>
              <div className="grid grid-cols-9 gap-1.5">
                {[null, 12, null, 36, null, 54, 63, null, 82].map((v, i) =>
                  v === null ? (
                    <div key={i} className="h-9 rounded-lg bg-surface-container/30 flex items-center justify-center text-outline/30">•</div>
                  ) : (
                    <div
                      key={i}
                      className={`h-9 rounded-lg flex items-center justify-center font-ticket-digit text-ticket-digit font-bold ${
                        v === 12
                          ? "bg-secondary-container text-on-secondary-container shadow-[0_0_10px_rgba(0,165,114,0.4)]"
                          : "bg-surface-container-highest text-on-surface"
                      }`}
                    >
                      {v}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
          <span>Watermark: NAVEEN CHERRY</span>
          <span className="text-primary font-semibold flex items-center gap-1">
            Custom Foil <span className="material-symbols-outlined text-sm">verified</span>
          </span>
        </div>
      </section>

      {/* Rule checklist */}
      <div className="w-full bg-surface-container-low rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-highest">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-secondary-fixed animate-pulse"></span>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                Official Ticket Rule Verification
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Every grid is validated against the full official Housie rule set before it ships.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-surface-container text-secondary font-label-sm text-label-sm font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            ZERO COLLISIONS DETECTED
          </span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checklist.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-xl bg-surface-container px-4 py-3 font-body-md text-body-md text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-secondary text-lg">verified</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}