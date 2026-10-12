import type { Room } from "@/lib/room/types";

export interface PlayerRoomRecord {
  roomId: string;
  code: string;
  name: string;
  status: Room["status"];
  startedAt: string | null;
  finishedAt: string | null;
  calledCount: number;
  ticketsOwned: number;
  wins: number;
  prizeLabels: string[];
  wasHost: boolean;
  wasCaller: boolean;
}

export interface PlayerGameHistory {
  totalGames: number;
  totalWins: number;
  totalPrizes: number;
  totalCalls: number;
  rooms: PlayerRoomRecord[];
}

/** Aggregate every room a player has been in. Every prize counts — current
 *  round plus all stored round summaries (matched by player id, falling back
 *  to name for summaries written before ids were stored). */
export function playerGameHistory(rooms: Room[], playerId: string): PlayerGameHistory {
  const records: PlayerRoomRecord[] = [];
  let totalPrizes = 0;
  let totalCalls = 0;

  for (const room of rooms) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) continue;

    const myPrizes = room.prizes.filter((p) => p.playerId === playerId);
    const labels = [...myPrizes.map((p) => p.label)];
    let pastWins = 0;
    let pastCalls = 0;
    for (const h of room.history) {
      pastCalls += h.calledCount;
      for (const prize of h.prizes) {
        if (prize.playerId ? prize.playerId === playerId : prize.playerName === player.name) {
          pastWins += 1;
          labels.push(`Round ${h.round} — ${prize.label}`);
        }
      }
    }

    const wins = myPrizes.length + pastWins;
    const calls = room.calledNumbers.length + pastCalls;
    totalPrizes += wins;
    totalCalls += calls;

    records.push({
      roomId: room.id,
      code: room.code,
      name: player.name,
      status: room.status,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
      calledCount: calls,
      ticketsOwned: player.tickets.length,
      wins,
      prizeLabels: labels,
      wasHost: room.players[0]?.id === playerId,
      wasCaller: room.callerId === playerId,
    });
  }

  const startedMs = (iso: string | null) => (iso ? Date.parse(iso) || 0 : 0);
  records.sort((a, b) => startedMs(b.startedAt) - startedMs(a.startedAt));

  return {
    totalGames: records.length,
    totalWins: records.reduce((n, r) => n + r.wins, 0),
    totalPrizes,
    totalCalls,
    rooms: records,
  };
}