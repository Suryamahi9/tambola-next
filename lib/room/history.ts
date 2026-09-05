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

/** Aggregate every room a player has been in. Prizes are matched by player id
 *  (current round) plus each stored round summary's winner. */
export function playerGameHistory(rooms: Room[], playerId: string): PlayerGameHistory {
  const records: PlayerRoomRecord[] = [];
  let totalPrizes = 0;
  let totalCalls = 0;

  for (const room of rooms) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) continue;

    const myPrizes = room.prizes.filter((p) => p.playerId === playerId);
    const historyWins = room.history.filter((h) => h.winnerId === playerId).length;
    const wins = (room.standings[playerId] ?? 0);
    const labels = [
      ...myPrizes.map((p) => p.label),
    ];
    // History summaries only store the round winner's name — surface those too.
    for (const h of room.history) {
      if (h.winnerId === playerId) labels.push(`Round ${h.round} — ${h.winnerName ?? "win"}`);
    }

    totalPrizes += myPrizes.length + historyWins;
    totalCalls += room.calledNumbers.length;

    records.push({
      roomId: room.id,
      code: room.code,
      name: player.name,
      status: room.status,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
      calledCount: room.calledNumbers.length,
      ticketsOwned: player.tickets.length,
      wins,
      prizeLabels: labels,
      wasHost: room.players[0]?.id === playerId,
      wasCaller: room.callerId === playerId,
    });
  }

  records.sort((a, b) => Date.parse(b.startedAt ?? b.roomId) - Date.parse(a.startedAt ?? a.roomId));

  return {
    totalGames: records.length,
    totalWins: records.reduce((n, r) => n + r.wins, 0),
    totalPrizes,
    totalCalls,
    rooms: records,
  };
}