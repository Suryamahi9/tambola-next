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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-300">
          Ticket Generator
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          Certified Tambola Tickets
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Every ticket is validated against the full official rule set. Generate
          unique random tickets for players, or build a complete 6-ticket book
          covering every number from 1 to 90 exactly once.
        </p>
      </div>

      <div className="mt-8">
        <TicketGenerator />
      </div>

      <div className="glass mt-12 rounded-2xl border border-white/10 p-6">
        <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
          Every ticket follows the official rules
        </h2>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {checklist.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
