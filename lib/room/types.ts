import type { Grid } from "@/lib/ticket";

export type RoomStatus = "waiting" | "live" | "finished";

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
  ticketsNeeded: number;
}
