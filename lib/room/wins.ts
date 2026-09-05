import type { Grid } from "@/lib/ticket";
import type { PatternId, Player, Prize, Room, Win } from "./types";
import { DEFAULT_ROOM_SETTINGS } from "./types";

export const PATTERNS = [
  { id: "fullhouse", label: "Full House", icon: "🏆" },
  { id: "corners", label: "Corners", icon: "⛶" },
  { id: "bottom", label: "Bottom Line", icon: "9️⃣" },
  { id: "middle", label: "Middle Line", icon: "3️⃣" },
  { id: "top", label: "Top Line", icon: "1️⃣" },
  { id: "early5", label: "Early Five", icon: "5️⃣" },
] as const;

/** Award priority: full house first, early five last. */
export const PATTERN_PRIORITY: Record<PatternId, number> = {
  fullhouse: 0,
  corners: 1,
  bottom: 2,
  middle: 3,
  top: 4,
  early5: 5,
};

type BooleanSettingKey = "fullHouse" | "corners" | "earlyFive" | "topLine" | "middleLine" | "bottomLine";

const LINE_SETTING: Record<"top" | "middle" | "bottom", BooleanSettingKey> = {
  top: "topLine",
  middle: "middleLine",
  bottom: "bottomLine",
};

/** Is this pattern active for the room (respects host prize settings)? */
export function isPatternEnabled(room: Pick<Room, "settings">, pattern: PatternId): boolean {
  const s = room.settings ?? DEFAULT_ROOM_SETTINGS;
  switch (pattern) {
    case "fullhouse": return s.fullHouse;
    case "corners": return s.corners;
    case "early5": return s.earlyFive;
    case "top":
    case "middle":
    case "bottom": return s[LINE_SETTING[pattern]];
    default: return true;
  }
}

/** The patterns that can be awarded, in priority order. Lines are prioritized
 *  per the host's lineOrder setting (full house first, early five last). */
export function activePatterns(room: Pick<Room, "settings">): PatternId[] {
  const s = room.settings ?? DEFAULT_ROOM_SETTINGS;
  const lines = (s.lineOrder ?? DEFAULT_ROOM_SETTINGS.lineOrder).slice();

  const lineRank: Record<string, number> = { top: 5, middle: 5, bottom: 5 };
  lines.forEach((l, i) => (lineRank[l] = 2 + i));

  const priority: Record<PatternId, number> = {
    fullhouse: 0,
    corners: 1,
    top: lineRank.top,
    middle: lineRank.middle,
    bottom: lineRank.bottom,
    early5: 5,
  };

  return (Object.keys(priority) as PatternId[])
    .filter((p) => isPatternEnabled(room, p))
    .sort((a, b) => priority[a] - priority[b]);
}

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

/** Every pattern a player's tickets currently complete (across all tickets). */
export function playerCompletePatterns(
  player: Player,
  calledSet: Set<number>
): { pattern: PatternId; label: string; ticketIndex: number; grid: Grid }[] {
  return completePatternsOnTickets(player.tickets, calledSet);
}

/** Complete patterns across a set of grids. Optionally honors a room's prize
 *  settings + already-awarded prizes (used by the client Bingo self-check). */
export function completePatternsOnTickets(
  tickets: Grid[],
  calledSet: Set<number>,
  room?: Pick<Room, "prizes" | "settings">
): { pattern: PatternId; label: string; ticketIndex: number; grid: Grid }[] {
  const out: { pattern: PatternId; label: string; ticketIndex: number; grid: Grid }[] = [];
  for (let ti = 0; ti < tickets.length; ti++) {
    for (const hit of ticketWins(tickets[ti], calledSet)) {
      const pattern = hit.id as PatternId;
      if (room && !isPatternEnabled(room, pattern)) continue;
      if (room && room.prizes.some((p) => p.pattern === pattern)) continue;
      out.push({ pattern, label: hit.label, ticketIndex: ti, grid: tickets[ti] });
    }
  }
  return out;
}

/** Award one prize per active pattern (first paid player in join order).
 *  Only patterns enabled by the host's room settings are considered. */
export function awardPrizes(room: Room): Prize[] {
  const calledSet = new Set(room.calledNumbers);
  const awarded = new Set(room.prizes.map((p) => p.pattern));
  const newly: Prize[] = [];
  for (const pattern of activePatterns(room)) {
    if (awarded.has(pattern)) continue;
    for (const player of room.players) {
      if (!player.paid) continue;
      const hits = playerCompletePatterns(player, calledSet);
      const hit = hits.find((h) => h.pattern === pattern);
      if (hit) {
        const prize: Prize = {
          pattern,
          label: hit.label,
          playerId: player.id,
          playerName: player.name,
          ticketIndex: hit.ticketIndex,
          grid: hit.grid,
          calledCount: room.calledNumbers.length,
        };
        room.prizes.push(prize);
        newly.push(prize);
        awarded.add(pattern);
        break;
      }
    }
  }
  return newly;
}
