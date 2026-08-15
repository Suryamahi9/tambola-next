import { randomBytes } from "node:crypto";
import { generateSetTickets, generateStrip, type Grid } from "@/lib/ticket";
import { signToken, verifyToken } from "@/lib/auth/session";
import { getRoomByCode, getRoomById, insertRoom, withRoom } from "./store";
import { awardPrizes, PATTERN_PRIORITY, playerCompletePatterns } from "./wins";
import type { PatternId, Player, Prize, PublicPlayer, PublicRoom, Room } from "./types";

/** Minimum paid tickets before the host may start the game. */
export const TICKETS_TO_START = 15;
/** Hard capacity for a room — no more tickets can be bought once this is reached. */
export const MAX_ROOM_TICKETS = 50;
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

function roomIsFull(room: Room): boolean {
  return paidTicketCount(room) >= MAX_ROOM_TICKETS;
}

export function createRoomId(): string {
  return randomBytes(9).toString("hex");
}

/** Deal `count` tickets from the room's shared 90-number books. The room keeps
 *  a cursor (current strip + next index); consecutive players consume tickets
 *  from the same book so numbers never repeat across them. A player's tickets
 *  always come from a single book (never split across two), so their own set
 *  stays unique — we roll to a fresh book if the current one can't fit them. */
function dealFromRoom(room: Room, count: number): Grid[] {
  if (
    !room.dealStrip ||
    (room.dealOffset ?? 0) + count > room.dealStrip.length
  ) {
    room.dealStrip = generateStrip();
    room.dealOffset = 0;
  }
  const strip = room.dealStrip;
  const out: Grid[] = [];
  if (strip) {
    for (let i = 0; i < count; i++) {
      out.push(strip[(room.dealOffset ?? 0) + i]);
    }
    room.dealOffset = (room.dealOffset ?? 0) + count;
  } else {
    for (let i = 0; i < count; i++) out.push(generateSetTickets(1)[0]);
  }
  return out;
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
  const room: Room = {
    id,
    code: roomCodeFor(id),
    status: "waiting",
    pricePerTicket: pricePerTicketPaise(),
    players: [],
    calledNumbers: [],
    lastNumber: null,
    callerId: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    winner: null,
    prizes: [],
    round: 1,
    standings: {},
    history: [],
    dealStrip: null,
    dealOffset: 0,
  };
  const player: Player = {
    id: createRoomId(),
    name: name.trim() || "Player",
    tickets: dealFromRoom(room, ticketCount),
    paid: false,
    joinedAt: new Date().toISOString(),
    order: 0,
  };
  room.players.push(player);
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
  if (roomIsFull(room)) return { error: "That room is full (50 tickets max)." };
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
    if (paidTicketCount(existing) + clamped > MAX_ROOM_TICKETS) {
      return { error: `Only ${MAX_ROOM_TICKETS - paidTicketCount(existing)} ticket slot(s) left in this room.` } as const;
    }
    const player: Player = {
      id: createRoomId(),
      name: name.trim() || "Player",
      tickets: dealFromRoom(existing, clamped),
      paid: false,
      joinedAt: new Date().toISOString(),
      order: existing.players.length,
    };
    existing.players.push(player);
    return { room: existing, player } as const;
  });
}

/** Mark a player paid; auto-start only when the room is completely full. */
export async function markPaid(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Player not in this room." } as const;
    player.paid = true;

    if (room.status === "waiting" && roomIsFull(room)) {
      room.status = "live";
      room.startedAt = new Date().toISOString();
      // The first player to join drives the draw.
      room.callerId = room.players[0]?.id ?? playerId;
    }
    return { room } as const;
  });
}

/** Host (first player) starts the game once the 15-ticket minimum is paid. */
export async function startGame(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    if (room.status !== "waiting") return { error: "Game has already started." } as const;
    const host = room.players[0];
    if (!host || host.id !== playerId) return { error: "Only the host can start the game." } as const;
    if (paidTicketCount(room) < TICKETS_TO_START) {
      return { error: `Wait for ${TICKETS_TO_START - paidTicketCount(room)} more paid ticket(s) (15 minimum).` } as const;
    }
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

    // Award any newly-completed patterns (one prize per pattern). The game
    // keeps running until Full House is won or all 90 numbers are called.
    const newly = awardPrizes(room);
    if (newly.length > 0) {
      // The headline win is the highest-priority pattern that just completed
      // (Full House even when a line also completed on the same draw).
      const best = newly.reduce((a, b) =>
        PATTERN_PRIORITY[b.pattern as PatternId] < PATTERN_PRIORITY[a.pattern as PatternId] ? b : a
      );
      room.winner = {
        playerId: best.playerId,
        playerName: best.playerName,
        ticketIndex: best.ticketIndex,
        pattern: best.pattern,
        label: best.label,
        grid: best.grid,
      };
    }
    const hasFullHouse = room.prizes.some((p) => p.pattern === "fullhouse");
    if (hasFullHouse || room.calledNumbers.length >= 90) {
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
    }
    return { room } as const;
  });
}

/** A player presses "Bingo!" — server validates their ticket and awards the
 *  highest-priority pattern they have completed (first valid claim wins). */
export async function claimBingo(
  roomId: string,
  playerId: string
): Promise<{ room: Room; prize: Prize } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    if (room.status !== "live") return { error: "The game isn't live yet." } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.paid) return { error: "Only paid players can claim." } as const;

    const available = playerCompletePatterns(player, new Set(room.calledNumbers)).filter(
      (hit) => !room.prizes.some((p) => p.pattern === hit.pattern)
    );
    if (available.length === 0) {
      return { error: "No complete pattern on your ticket yet — keep playing!" } as const;
    }
    const best = available.sort(
      (a, b) => PATTERN_PRIORITY[a.pattern as PatternId] - PATTERN_PRIORITY[b.pattern as PatternId]
    )[0];

    const prize: Prize = {
      pattern: best.pattern,
      label: best.label,
      playerId: player.id,
      playerName: player.name,
      ticketIndex: best.ticketIndex,
      grid: best.grid,
      calledCount: room.calledNumbers.length,
    };
    room.prizes.push(prize);
    room.winner = {
      playerId: player.id,
      playerName: player.name,
      ticketIndex: best.ticketIndex,
      pattern: best.pattern,
      label: best.label,
      grid: best.grid,
    };
    if (best.pattern === "fullhouse" || room.calledNumbers.length >= 90) {
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
    }
    return { room, prize } as const;
  });
}

/** Start a new round in the same room: fresh tickets for everyone, standings
 *  updated from the finished round's prizes. */
export async function nextRound(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found." } as const;
    if (room.status !== "finished") return { error: "The round is still running." } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Not in this room." } as const;

    room.history.push({
      round: room.round,
      finishedAt: new Date().toISOString(),
      winnerId: room.winner?.playerId ?? null,
      winnerName: room.winner?.playerName ?? null,
      calledCount: room.calledNumbers.length,
      prizes: room.prizes.map((p) => ({ label: p.label, playerName: p.playerName })),
    });
    room.history = room.history.slice(-20);

    for (const p of room.prizes) {
      room.standings[p.playerId] = (room.standings[p.playerId] ?? 0) + 1;
    }

    room.dealStrip = null;
    room.dealOffset = 0;
    for (const p of room.players) {
      if (p.paid) p.tickets = dealFromRoom(room, p.tickets.length);
    }
    room.calledNumbers = [];
    room.lastNumber = null;
    room.prizes = [];
    room.winner = null;
    room.round += 1;
    room.status = "live";
    room.startedAt = new Date().toISOString();
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
    prizes: room.prizes,
    round: room.round,
    standings: room.standings,
    history: room.history,
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
