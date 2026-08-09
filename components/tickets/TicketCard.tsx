import type { Grid } from "@/lib/ticket";

interface Props {
  grid: Grid;
  name?: string;
  index: number;
  total: number;
}

export default function TicketCard({ grid, name, index, total }: Props) {
  return (
    <div className="glass break-inside-avoid overflow-hidden rounded-xl border border-white/10 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 px-4 py-2.5">
        <span className="text-xs font-semibold text-neutral-200">
          🎫 {name || "Tambola Ticket"}
        </span>
        <span className="font-mono text-[11px] text-neutral-500">
          #{String(index + 1).padStart(2, "0")} / {total}
        </span>
      </div>
      <div className="p-3">
        <div className="ticket-grid text-neutral-100">
          {grid.flatMap((row, r) =>
            row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                className={
                  v === null
                    ? "bg-white/[0.02] text-transparent"
                    : "bg-white/10"
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
