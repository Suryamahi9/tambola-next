import type { Grid } from "@/lib/ticket";

interface Props {
  grid: Grid;
  name?: string;
  index: number;
  total: number;
}

export default function TicketCard({ grid, name, index, total }: Props) {
  return (
    <div className="break-inside-avoid overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-violet-600/5 to-fuchsia-600/5 px-4 py-2.5 dark:border-neutral-800">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
          🎫 {name || "Tambola Ticket"}
        </span>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
          #{String(index + 1).padStart(2, "0")} / {total}
        </span>
      </div>
      <div className="p-3">
        <div className="ticket-grid text-neutral-800 dark:text-neutral-100">
          {grid.flatMap((row, r) =>
            row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                className={
                  v === null
                    ? "bg-neutral-50 text-transparent dark:bg-neutral-950/40"
                    : "bg-white dark:bg-neutral-900"
                }
              >
                {v ?? ""}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
