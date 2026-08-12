import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRoom, readPlayerToken, toPublicRoom, PLAYER_COOKIE } from "@/lib/room/engine";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = await getRoom(id);
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const cookieStore = await cookies();
  const me = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);

  // The current player gets their own ticket grids so the board can be
  // checked off live; other players' grids are never exposed.
  const mePlayer = me ? room.players.find((p) => p.id === me) : undefined;

  return NextResponse.json(
    {
      room: toPublicRoom(room),
      me,
      myTickets: mePlayer ? mePlayer.tickets : [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
