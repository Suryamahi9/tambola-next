import type { Grid } from "@/lib/ticket";

interface Props {
  grid: Grid;
  name?: string;
  index: number;
  total: number;
}

const SHELLS = [
  {
    card: "border-[#e6dcc7] bg-gradient-to-b from-[#fdfbf7] to-[#f1eadb] shadow-[0_10px_28px_rgba(0,0,0,0.28)]",
    header: "border-b border-[#e0d2b4] bg-gradient-to-r from-[#5a3a1d] to-[#7a5530]",
    headerText: "text-[#f6ecd9]",
    metaText: "text-[#ddc9a8]",
    grid: "font-mono text-[#6b4a23]",
    filled: "bg-[#6b4a23]/[0.05]",
    empty: "bg-transparent",
  },
  {
    card: "border-[#c69e6a] bg-gradient-to-b from-[#a37240] to-[#87562d] shadow-[0_10px_28px_rgba(0,0,0,0.32)]",
    header: "border-b border-[#a4773f] bg-gradient-to-r from-[#4a2f17] to-[#684a26]",
    headerText: "text-[#f8eede]",
    metaText: "text-[#e3cfa9]",
    grid: "font-mono text-[#fbf3e2]",
    filled: "bg-white/10",
    empty: "bg-transparent",
  },
] as const;

export default function TicketCard({ grid, name, index, total }: Props) {
  const s = SHELLS[index % 2 === 0 ? 0 : 1];
  return (
    <div
      className={`break-inside-avoid overflow-hidden rounded-xl border transition hover:shadow-lg ${s.card}`}
    >
      <div className={`flex items-center justify-between border-b px-4 py-2.5 ${s.header}`}>
        <span className={`text-xs font-semibold ${s.headerText}`}>
          🎫 {name || "Tambola Ticket"}
        </span>
        <span className={`font-mono text-[11px] ${s.metaText}`}>
          #{String(index + 1).padStart(2, "0")} / {total}
        </span>
      </div>
      <div className="p-3">
        <div className={`ticket-grid ${s.grid}`}>
          {grid.flatMap((row, r) =>
            row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                className={v === null ? s.empty : s.filled}
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
