import { randomBytes } from "node:crypto";
import { generateSetTickets } from "@/lib/ticket";
import { signToken, verifyToken } from "@/lib/auth/session";
import { getRoomByCode, getRoomById, insertRoom, withRoom } from "./store";
import { findWinner } from "./wins";
import type { Player, PublicPlayer, PublicRoom, Room } from "./types";

export const TICKETS_TO_START = 15;
export const MAX_TICKETS_PER_PLAYER = 5;
export const PLAYER_COOKIE = "tambola_player";

export function pricePerTicketPaise(): number {
  const raw = Number(process.env.ROOM_TICKET_PRICE);
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw * 100);
  return 2000; // ₹20 default
}

export function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function roomCodeFor(id: string): string {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

function paidTicketCount(room: Room): number {
  return room.players.filter((p) => p.paid).reduce((n, p) => n + p.tickets.length, 0);
}

export function ticketsNeeded(room: Room): number {
  return Math.max(0, TICKETS_TO_START - paidTicketCount(room));
}

export function createRoomId(): string {
  return randomBytes(9).toString("hex");
}

// ---- Player tokens (reuses the HMAC-signed session helpers) ----

export async function signPlayerToken(playerId: string): Promise<string> {
  return signToken(playerId, "player");
}

export async function readPlayerToken(token: string | undefined | null): Promise<string | null> {
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "player") return null;
  return payload.uid;
}

// ---- Room lifecycle ----

export function createRoomRecord(name: string, ticketCount: number): { room: Room; player: Player } {
  const id = createRoomId();
  const player: Player = {
    id: createRoomId(),
    name: name.trim() || "Player",
    tickets: generateSetTickets(ticketCount),
    paid: false,
    joinedAt: new Date().toISOString(),
    order: 0,
  };
  const room: Room = {
    id,
    code: roomCodeFor(id),
    status: "waiting",
    pricePerTicket: pricePerTicketPaise(),
    players: [player],
    calledNumbers: [],
    lastNumber: null,
    callerId: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    winner: null,
  };
  return { room, player };
}

/** Create a brand-new room with the host as an unpaid pending player. */
export async function createRoomForPlayer(name: string, ticketCount: number): Promise<Room> {
  const { room } = createRoomRecord(name, ticketCount);
  return insertRoom(room);
}

/** Validate a join target (by room code) before taking payment. */
export async function findJoinableRoom(code: string): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByCode(code);
  if (!room) return { error: "Room not found. Check the code and try again." };
  if (room.status !== "waiting") return { error: "That game has already started." };
  if (ticketsNeeded(room) <= 0) return { error: "That room is already full." };
  return { room };
}

export async function createJoinableRoom(): Promise<Room> {
  const { room } = createRoomRecord("Host", 1);
  return insertRoom(room);
}

/** Add (or replace) an unpaid pending player slot for a room. */
export async function addPendingPlayer(
  roomId: string,
  name: string,
  ticketCount: number
): Promise<{ room: Room; player: Player } | { error: string }> {
  const clamped = Math.max(1, Math.min(MAX_TICKETS_PER_PLAYER, Math.floor(ticketCount)));

  return withRoom(roomId, (existing) => {
    if (!existing) return { error: "Room not found." } as const;
    if (existing.status !== "waiting") return { error: "That game has already started." } as const;
    if (paidTicketCount(existing) + clamped > TICKETS_TO_START) {
      return { error: `Only ${ticketsNeeded(existing)} ticket slot(s) left in this room.` } as const;
    }
    const player: Player = {
      id: createRoomId(),
      name: name.trim() || "Player",
      tickets: generateSetTickets(clamped),
      paid: false,
      joinedAt: new Date().toISOString(),
      order: existing.players.length,
    };
    existing.players.push(player);
    return { room: existing, player } as const;
  });
}

/** Mark a player paid; auto-start the room once 15 tickets have joined. */
export async function markPaid(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Player not in this room." } as const;
    player.paid = true;

    if (room.status === "waiting" && paidTicketCount(room) >= TICKETS_TO_START) {
      room.status = "live";
      room.startedAt = new Date().toISOString();
      // The first player to join drives the draw.
      room.callerId = room.players[0]?.id ?? playerId;
    }
    return { room } as const;
  });
}

/** Host (first player) can start early — no need to wait for 15 tickets. */
export async function startGame(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    if (room.status !== "waiting") return { error: "Game has already started." } as const;
    const host = room.players[0];
    if (!host || host.id !== playerId) return { error: "Only the host can start the game." } as const;
    if (paidTicketCount(room) < 1) return { error: "Wait for at least one paid ticket." } as const;
    room.status = "live";
    room.startedAt = new Date().toISOString();
    room.callerId = host.id;
    return { room } as const;
  });
}

/** Server draws the next number so nobody can tamper with the board. */
export async function callNumber(
  roomId: string,
  callerId: string
): Promise<{ room: Room } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    if (room.status === "waiting") return { error: "Game has not started yet." } as const;
    if (room.status === "finished") return { error: "Game is over." } as const;
    if (room.callerId !== callerId) return { error: "You are not the caller." } as const;

    const calledSet = new Set(room.calledNumbers);
    const remaining = Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !calledSet.has(n));
    if (remaining.length === 0) {
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
      return { room } as const;
    }
    const num = remaining[Math.floor(Math.random() * remaining.length)];
    room.calledNumbers.push(num);
    room.lastNumber = num;

    // A completed ticket pattern ends the game for everyone.
    const winner = findWinner(room);
    if (winner) {
      room.winner = winner;
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
    } else if (room.calledNumbers.length >= 90) {
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
    }
    return { room } as const;
  });
}

/** Let another player take over the draw if the original caller disconnects. */
export async function takeOverCaller(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    if (!room.players.some((p) => p.id === playerId)) return { error: "Not in this room." } as const;
    room.callerId = playerId;
    return { room } as const;
  });
}

// ---- Public shapes ----

export function toPublicRoom(room: Room): PublicRoom {
  const players: PublicPlayer[] = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    ticketCount: p.tickets.length,
    paid: p.paid,
    order: p.order,
  }));
  return {
    id: room.id,
    code: room.code,
    status: room.status,
    pricePerTicket: room.pricePerTicket,
    players,
    calledNumbers: room.calledNumbers,
    lastNumber: room.lastNumber,
    callerId: room.callerId,
    hostId: room.players[0]?.id ?? null,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    winner: room.winner,
    ticketsNeeded: ticketsNeeded(room),
  };
}

export async function getRoom(roomId: string): Promise<Room | null> {
  return getRoomById(roomId);
}

export async function getRoomByCodeOrId(term: string): Promise<Room | null> {
  const byCode = await getRoomByCode(term);
  if (byCode) return byCode;
  return getRoomById(term);
}
