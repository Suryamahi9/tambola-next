import type { Grid } from "@/lib/ticket";

export type RoomStatus = "waiting" | "live" | "finished";

/** One chat line in a room. `kind` drives the UI:
 *  "user" = a player, "system" = game events, "ai" = the bot announcer. */
export type ChatKind = "user" | "system" | "ai";

export interface ChatMessage {
  id: string;
  playerId: string | null; // null for system/bot lines
  playerName: string; // display label ("" for system lines)
  kind: ChatKind;
  text: string;
  createdAt: string; // ISO
}

/** Chat bounds: cap the transcript (oldest dropped) + per-player rate limit. */
export const MAX_CHAT_MESSAGES = 100;
export const MAX_CHAT_LENGTH = 240;
export const CHAT_MIN_INTERVAL_MS = 1500;

export type PatternId = "fullhouse" | "corners" | "bottom" | "middle" | "top" | "early5";

/** Per-room prize configuration — the host picks which patterns are active and
 *  the priority order of the three lines before the game starts. */
export interface RoomSettings {
  fullHouse: boolean;
  corners: boolean;
  earlyFive: boolean;
  topLine: boolean;
  middleLine: boolean;
  bottomLine: boolean;
  /** Relative priority of the lines when several complete on the same draw. */
  lineOrder: ("top" | "middle" | "bottom")[];
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  fullHouse: true,
  corners: true,
  earlyFive: true,
  topLine: true,
  middleLine: true,
  bottomLine: true,
  lineOrder: ["bottom", "middle", "top"],
};

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
  /** Room chat — capped at MAX_CHAT_MESSAGES, oldest dropped first. */
  messages: ChatMessage[];
  /** Prize configuration chosen by the host (defaults to all patterns on). */
  settings: RoomSettings;
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
  messages: ChatMessage[];
  /** Prize configuration — visible so players know which patterns score. */
  settings: RoomSettings;
}
