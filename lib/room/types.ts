import type { Grid } from "@/lib/ticket";

export type RoomStatus = "waiting" | "live" | "finished";

export type PatternId = "fullhouse" | "corners" | "bottom" | "middle" | "top" | "early5";

export interface Player {
  id: string;
  name: string;
  tickets: Grid[];
  paid: boolean;
  joinedAt: string;
  order: number;
}

export interface Win {
  playerId: string;
  playerName: string;
  ticketIndex: number;
  pattern: string; // pattern id
  label: string; // display label
  grid: Grid; // winning ticket
}

export interface Prize {
  pattern: PatternId;
  label: string;
  playerId: string;
  playerName: string;
  ticketIndex: number;
  grid: Grid;
  calledCount: number;
}

export interface RoundSummary {
  round: number;
  finishedAt: string;
  winnerId: string | null;
  winnerName: string | null;
  calledCount: number;
  prizes: { label: string; playerName: string }[];
}

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  pricePerTicket: number; // paise
  players: Player[];
  calledNumbers: number[];
  lastNumber: number | null;
  callerId: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  winner: Win | null;
  prizes: Prize[];
  round: number;
  standings: Record<string, number>;
  history: RoundSummary[];
  // Ticket-deal cursor: the next strip (90-number book) and the next ticket
  // index within it, so players joining in order share the same book. Books
  // are cut across players — no number repeats within a book.
  dealStrip: Grid[] | null;
  dealOffset: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  ticketCount: number;
  paid: boolean;
  order: number;
}

/** Everything the room UI needs. Tickets are included so players can render
 * their own boards and mark called numbers. */
export interface PublicRoom {
  id: string;
  code: string;
  status: RoomStatus;
  pricePerTicket: number;
  players: PublicPlayer[];
  calledNumbers: number[];
  lastNumber: number | null;
  callerId: string | null;
  hostId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  winner: Win | null;
  prizes: Prize[];
  round: number;
  standings: Record<string, number>;
  history: RoundSummary[];
  ticketsNeeded: number;
}
