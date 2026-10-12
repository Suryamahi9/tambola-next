import { randomBytes } from "node:crypto";
import { generateSetTickets, generateStrip, type Grid } from "@/lib/ticket";
import { signToken, verifyToken, PLAYER_TOKEN_DAYS } from "@/lib/auth/session";
import { generateBotReply, isBotTrigger } from "./ai";
import { getRoomByCode, getRoomById, insertRoom, withRoom } from "./store";
import { awardPrizes, isPatternEnabled, patternRank, playerCompletePatterns } from "./wins";
import { CHAT_MIN_INTERVAL_MS, DEFAULT_ROOM_SETTINGS, MAX_CHAT_LENGTH, MAX_CHAT_MESSAGES } from "./types";
import type { ChatMessage, PatternId, Player, Prize, PublicPlayer, PublicRoom, Room, RoomSettings } from "./types";

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
  return signToken(playerId, "player", PLAYER_TOKEN_DAYS);
}

export async function readPlayerToken(token: string | undefined | null): Promise<string | null> {
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "player") return null;
  return payload.uid;
}

// ---- Room chat ----

function pushChat(room: Room, message: ChatMessage): void {
  room.messages.push(message);
  if (room.messages.length > MAX_CHAT_MESSAGES) {
    room.messages.splice(0, room.messages.length - MAX_CHAT_MESSAGES);
  }
}

/** Append a game-event line (draws, prizes, round changes) to the chat. */
export function postSystemMessage(room: Room, text: string): void {
  pushChat(room, {
    id: createRoomId(),
    playerId: null,
    playerName: "",
    kind: "system",
    text,
    createdAt: new Date().toISOString(),
  });
}

/** Persist a player's chat line; replies to @bot / /help via the AI announcer. */
export async function sendMessage(
  roomId: string,
  playerId: string,
  raw: string
): Promise<{ room: Room } | { error: string; status?: number }> {
  const text = raw.trim().slice(0, MAX_CHAT_LENGTH);
  if (!text) return { error: "Message is empty.", status: 400 } as const;

  const base = await withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "You are not a player in this room.", status: 403 } as const;

    const lastUser = [...room.messages]
      .reverse()
      .find((m) => m.kind === "user" && m.playerId === playerId);
    if (lastUser && Date.now() - Date.parse(lastUser.createdAt) < CHAT_MIN_INTERVAL_MS) {
      return { error: "You're sending too fast — take a breath.", status: 429 } as const;
    }

    pushChat(room, {
      id: createRoomId(),
      playerId,
      playerName: player.name,
      kind: "user",
      text,
      createdAt: new Date().toISOString(),
    });
    return { room } as const;
  });

  if ("error" in base) return base;

  // AI announcer runs AFTER the user message persists so a slow model call
  // never blocks the send. The reply lands a poll or two later. This must
  // never fail the request — the user's message is already saved.
  if (isBotTrigger(text)) {
    try {
      const reply = await generateBotReply(text, base.room);
      await withRoom(roomId, (room) => {
        if (!room) return;
        pushChat(room, {
          id: createRoomId(),
          playerId: null,
          playerName: "Tambola Bot",
          kind: "ai",
          text: reply,
          createdAt: new Date().toISOString(),
        });
      });
    } catch (err) {
      console.error("[room] bot reply failed (message already saved):", err);
    }
  }

  return base;
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
    messages: [],
    settings: { ...DEFAULT_ROOM_SETTINGS },
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
  // Room codes are short — retry on the (unlikely) collision so a new room
  // never aliases an existing one.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { room } = createRoomRecord(name, ticketCount);
    if (!(await getRoomByCode(room.code))) return insertRoom(room);
  }
  const { room } = createRoomRecord(name, ticketCount);
  return insertRoom(room);
}

/** Validate a join target (by room code) before taking payment. */
export async function findJoinableRoom(code: string): Promise<{ room: Room } | { error: string; status?: number }> {
  const room = await getRoomByCode(code);
  if (!room) return { error: "Room not found. Check the code and try again.", status: 404 };
  if (room.status !== "waiting") return { error: "That game has already started.", status: 409 };
  if (roomIsFull(room)) return { error: "That room is full (50 tickets max).", status: 409 };
  return { room };
}

/** Add (or replace) an unpaid pending player slot for a room. */
export async function addPendingPlayer(
  roomId: string,
  name: string,
  ticketCount: number
): Promise<{ room: Room; player: Player } | { error: string; status?: number }> {
  const clamped = Math.max(1, Math.min(MAX_TICKETS_PER_PLAYER, Math.floor(ticketCount)));

  return withRoom(roomId, (existing) => {
    if (!existing) return { error: "Room not found.", status: 404 } as const;
    if (existing.status !== "waiting") return { error: "That game has already started.", status: 409 } as const;
    // Count unpaid reservations too — otherwise two players can reserve into
    // the same headroom and push paid tickets past the cap.
    const reserved =
      paidTicketCount(existing) +
      existing.players.filter((p) => !p.paid).reduce((n, p) => n + p.tickets.length, 0);
    if (reserved + clamped > MAX_ROOM_TICKETS) {
      return { error: `Only ${MAX_ROOM_TICKETS - reserved} ticket slot(s) left in this room.`, status: 409 } as const;
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

/** Shared tail of every payment path: flip paid, announce, maybe auto-start. */
function applyPaid(room: Room, player: Player): void {
  player.paid = true;
  postSystemMessage(room, `${player.name} is in with ${player.tickets.length} ticket${player.tickets.length === 1 ? "" : "s"}.`);

  if (room.status === "waiting" && roomIsFull(room)) {
    room.status = "live";
    room.startedAt = new Date().toISOString();
    // The player whose payment filled the room drives the draw.
    room.callerId = player.id;
    postSystemMessage(room, `The room is full — game started! Good luck everyone! 🍀`);
  }
}

/** Mark a player paid; auto-start only when the room is completely full. */
export async function markPaid(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Player not in this room.", status: 403 } as const;
    if (room.status !== "waiting") {
      return { error: "Payments are closed — that game has already started.", status: 409 } as const;
    }
    // Idempotent: re-verifying an already-paid player must not announce twice.
    if (player.paid) return { room } as const;
    applyPaid(room, player);
    return { room } as const;
  });
}

/** Record a live-mode Razorpay order so verify can bind amount + single use. */
export async function recordPendingOrder(
  roomId: string,
  orderId: string,
  playerId: string,
  amount: number
): Promise<{ ok: true } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    room.pendingOrders = room.pendingOrders ?? {};
    room.pendingOrders[orderId] = { playerId, amount, used: false };
    return { ok: true } as const;
  });
}

/** Consume a recorded order: same checks as markPaid, plus the order must be
 *  fresh, belong to this player, and match the ticket price. */
export async function consumePendingOrder(
  roomId: string,
  orderId: string,
  playerId: string
): Promise<{ room: Room } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    const pending = room.pendingOrders?.[orderId];
    if (!pending || pending.playerId !== playerId) {
      return { error: "Unknown payment order for this room.", status: 400 } as const;
    }
    if (pending.used) return { error: "That payment was already used.", status: 409 } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Player not in this room.", status: 403 } as const;
    if (room.status !== "waiting") {
      return { error: "Payments are closed — that game has already started.", status: 409 } as const;
    }
    const expected = room.pricePerTicket * player.tickets.length;
    if (pending.amount !== expected) {
      return { error: "Payment amount doesn't match these tickets.", status: 400 } as const;
    }
    pending.used = true;
    if (player.paid) return { room } as const;
    applyPaid(room, player);
    return { room } as const;
  });
}

/** Host authority: players[0] while paid, otherwise any paid player — so an
 *  abandoned unpaid host slot can't strand a paid room with no one able to
 *  start it, change settings, or open the next round. */
function isEffectiveHost(room: Room, playerId: string): boolean {
  const first = room.players[0];
  if (first && first.paid) return first.id === playerId;
  return room.players.some((p) => p.id === playerId && p.paid);
}

/** Host configures the prize patterns before the game starts. */
export async function updateRoomSettings(
  roomId: string,
  playerId: string,
  patch: Partial<RoomSettings>
): Promise<{ room: Room } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    if (room.status !== "waiting") return { error: "Settings can only change before the game starts.", status: 409 } as const;
    if (!isEffectiveHost(room, playerId)) return { error: "Only the host can change prize settings.", status: 403 } as const;
    room.settings = { ...room.settings, ...patch };
    return { room } as const;
  });
}

/** Host (first player) starts the game once the 15-ticket minimum is paid. */
export async function startGame(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    if (room.status !== "waiting") return { error: "Game has already started.", status: 409 } as const;
    if (!isEffectiveHost(room, playerId)) return { error: "Only the host can start the game.", status: 403 } as const;
    if (paidTicketCount(room) < TICKETS_TO_START) {
      return { error: `Wait for ${TICKETS_TO_START - paidTicketCount(room)} more paid ticket(s) (15 minimum).`, status: 409 } as const;
    }
    room.status = "live";
    room.startedAt = new Date().toISOString();
    room.callerId = playerId;
    postSystemMessage(room, `Game started — good luck everyone! 🍀`);
    return { room } as const;
  });
}

/** Server draws a number — either the caller picks one, or a random draw.
 *  When `num` is provided the caller is selecting manually (like a physical
 *  Tambola bag); otherwise auto-draw picks at random. */
export async function callNumber(
  roomId: string,
  callerId: string,
  num?: number
): Promise<{ room: Room } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    if (room.status === "waiting") return { error: "Game has not started yet.", status: 409 } as const;
    if (room.status === "finished") return { error: "Game is over.", status: 409 } as const;
    if (room.callerId !== callerId) return { error: "You are not the caller.", status: 403 } as const;

    const calledSet = new Set(room.calledNumbers);
    const remaining = Array.from({ length: 90 }, (_, i) => i + 1).filter((n) => !calledSet.has(n));
    if (remaining.length === 0) {
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
      postSystemMessage(room, "All 90 numbers were called — game complete.");
      return { room } as const;
    }

    let chosen: number;
    if (num !== undefined) {
      if (!remaining.includes(num)) {
        return { error: `${num} is not available — pick an uncalled number.`, status: 400 } as const;
      }
      chosen = num;
    } else {
      chosen = remaining[Math.floor(Math.random() * remaining.length)];
    }

    room.calledNumbers.push(chosen);
    room.lastNumber = chosen;

    // Chat milestones keep the room lively without spamming every draw.
    if (room.calledNumbers.length % 10 === 0) {
      postSystemMessage(room, `📣 ${room.calledNumbers.length}/90 numbers called.`);
    }

    // Award any newly-completed patterns (one prize per pattern). The game
    // keeps running until Full House is won or all 90 numbers are called.
    const newly = awardPrizes(room);
    if (newly.length > 0) {
      for (const p of newly) {
        postSystemMessage(room, `🏆 ${p.playerName} completes ${p.label}!`);
      }
      // The headline win is the highest-priority pattern awarded so far
      // (Full House even when a line also completed on the same draw) —
      // never downgrade an earlier headline.
      const rank = (pattern: string) => patternRank(room, pattern as PatternId);
      const best = newly.reduce((a, b) => (rank(b.pattern) < rank(a.pattern) ? b : a));
      const current = room.winner ? rank(room.winner.pattern) : Infinity;
      if (rank(best.pattern) < current) {
        room.winner = {
          playerId: best.playerId,
          playerName: best.playerName,
          ticketIndex: best.ticketIndex,
          pattern: best.pattern,
          label: best.label,
          grid: best.grid,
        };
      }
    }
    const hasFullHouse = room.prizes.some((p) => p.pattern === "fullhouse");
    if (hasFullHouse || room.calledNumbers.length >= 90) {
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
      postSystemMessage(
        room,
        hasFullHouse && room.winner
          ? `🎉 ${room.winner.playerName} wins ${room.winner.label} — game over!`
          : "All 90 numbers were called — game complete."
      );
    }
    return { room } as const;
  });
}

/** A player presses "Bingo!" — server validates their ticket and awards the
 *  highest-priority pattern they have completed (first valid claim wins). */
export async function claimBingo(
  roomId: string,
  playerId: string
): Promise<{ room: Room; prize: Prize } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    if (room.status === "waiting") return { error: "The game hasn't started yet.", status: 409 } as const;
    if (room.status === "finished") {
      return { error: "That game is over — wait for the next round.", status: 409 } as const;
    }
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.paid) return { error: "Only paid players can claim.", status: 403 } as const;

    const available = playerCompletePatterns(player, new Set(room.calledNumbers)).filter(
      (hit) =>
        !room.prizes.some((p) => p.pattern === hit.pattern) &&
        isPatternEnabled(room, hit.pattern as PatternId)
    );
    if (available.length === 0) {
      return { error: "No complete pattern on your ticket yet — keep playing!", status: 422 } as const;
    }
    // Highest priority first, honouring the host's lineOrder (same ranking
    // the auto-draw path uses).
    const rank = (pattern: string) => patternRank(room, pattern as PatternId);
    const best = available.sort((a, b) => rank(a.pattern) - rank(b.pattern))[0];

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
    postSystemMessage(room, `${player.name} claims ${best.label}!`);
    if (!room.winner || rank(best.pattern) < rank(room.winner.pattern)) {
      room.winner = {
        playerId: player.id,
        playerName: player.name,
        ticketIndex: best.ticketIndex,
        pattern: best.pattern,
        label: best.label,
        grid: best.grid,
      };
    }
    if (best.pattern === "fullhouse" || room.calledNumbers.length >= 90) {
      room.status = "finished";
      room.finishedAt = new Date().toISOString();
    }
    return { room, prize } as const;
  });
}

/** Start a new round in the same room: fresh tickets for everyone, standings
 *  updated from the finished round's prizes. Host-only. */
export async function nextRound(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    if (room.status !== "finished") return { error: "The round is still running.", status: 409 } as const;
    if (!isEffectiveHost(room, playerId)) {
      return { error: "Only the host can start the next round.", status: 403 } as const;
    }

    room.history.push({
      round: room.round,
      finishedAt: new Date().toISOString(),
      winnerId: room.winner?.playerId ?? null,
      winnerName: room.winner?.playerName ?? null,
      calledCount: room.calledNumbers.length,
      prizes: room.prizes.map((p) => ({ label: p.label, playerName: p.playerName, playerId: p.playerId })),
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
    room.finishedAt = null;
    // The host opening the round drives the draw (fixes a dead callerId).
    room.callerId = playerId;
    postSystemMessage(room, `Round ${room.round} — fresh tickets for everyone. Go! 🔄`);
    return { room } as const;
  });
}

/** Let another player take over the draw if the original caller disconnects.
 *  Paid players only, and never by wresting a live game from an active paid
 *  caller mid-draw. */
export async function takeOverCaller(
  roomId: string,
  playerId: string
): Promise<{ room: Room } | { error: string; status?: number }> {
  return withRoom(roomId, (room) => {
    if (!room) return { error: "Room not found.", status: 404 } as const;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Not in this room.", status: 403 } as const;
    if (!player.paid) return { error: "Only paid players can call.", status: 403 } as const;
    if (room.status === "finished") return { error: "Game is over.", status: 409 } as const;
    const current = room.callerId ? room.players.find((p) => p.id === room.callerId) : undefined;
    if (room.status === "live" && current?.paid && current.id !== playerId) {
      return { error: `${current.name} is already calling — ask them to hand over first.`, status: 409 } as const;
    }
    room.callerId = playerId;
    postSystemMessage(room, `${player.name} is now the caller. 🎙️`);
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
    messages: room.messages,
    settings: room.settings ?? { ...DEFAULT_ROOM_SETTINGS },
  };
}

export async function getRoom(roomId: string): Promise<Room | null> {
  return getRoomById(roomId);
}
