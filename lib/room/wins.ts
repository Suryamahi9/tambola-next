import type { Grid } from "@/lib/ticket";
import type { Room, Win } from "./types";

export const PATTERNS = [
  { id: "fullhouse", label: "Full House", icon: "🏆" },
  { id: "corners", label: "Corners", icon: "⛶" },
  { id: "bottom", label: "Bottom Line", icon: "9️⃣" },
  { id: "middle", label: "Middle Line", icon: "3️⃣" },
  { id: "top", label: "Top Line", icon: "1️⃣" },
  { id: "early5", label: "Early Five", icon: "5️⃣" },
] as const;

export function ticketRowNums(grid: Grid, row: number): number[] {
  return grid[row].filter((v): v is number => v !== null);
}

export function ticketCorners(grid: Grid): number[] {
  const top = grid[0];
  const bottom = grid[2];
  const left = top.findIndex((v) => v !== null);
  const right = top.findLastIndex((v) => v !== null);
  const bLeft = bottom.findIndex((v) => v !== null);
  const bRight = bottom.findLastIndex((v) => v !== null);
  const corners: number[] = [];
  const topL = top[left];
  const topR = top[right];
  const botL = bottom[bLeft];
  const botR = bottom[bRight];
  if (topL !== undefined && topL !== null) corners.push(topL);
  if (topR !== undefined && topR !== null && right > left) corners.push(topR);
  if (botL !== undefined && botL !== null) corners.push(botL);
  if (botR !== undefined && botR !== null && bRight > bLeft) corners.push(botR);
  return corners;
}

export function ticketAllNums(grid: Grid): number[] {
  return grid.flat().filter((v): v is number => v !== null);
}

/** Patterns on one ticket that are fully covered by the called numbers. */
export function ticketWins(
  grid: Grid,
  calledSet: Set<number>
): { id: string; label: string }[] {
  const rows = [0, 1, 2].map((r) => ticketRowNums(grid, r));
  const complete = (nums: number[]) => nums.length > 0 && nums.every((n) => calledSet.has(n));

  const hits: { id: string; label: string }[] = [];
  if (complete(ticketAllNums(grid))) hits.push({ id: "fullhouse", label: "Full House" });
  if (complete(ticketCorners(grid))) hits.push({ id: "corners", label: "Corners" });
  if (complete(rows[2])) hits.push({ id: "bottom", label: "Bottom Line" });
  if (complete(rows[1])) hits.push({ id: "middle", label: "Middle Line" });
  if (complete(rows[0])) hits.push({ id: "top", label: "Top Line" });
  const calledOnTicket = grid
    .flat()
    .filter((v): v is number => v !== null && calledSet.has(v)).length;
  if (calledOnTicket >= 5) hits.push({ id: "early5", label: "Early Five" });
  return hits;
}

/** First paid player whose ticket has a complete pattern (in priority order). */
export function findWinner(room: Room): Win | null {
  const calledSet = new Set(room.calledNumbers);
  for (const player of room.players) {
    if (!player.paid) continue;
    for (let ti = 0; ti < player.tickets.length; ti++) {
      const hits = ticketWins(player.tickets[ti], calledSet);
      if (hits.length > 0) {
        const best = hits[0];
        return {
          playerId: player.id,
          playerName: player.name,
          ticketIndex: ti,
          pattern: best.id,
          label: best.label,
          grid: player.tickets[ti],
        };
      }
    }
  }
  return null;
}
