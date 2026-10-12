import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { claimBingo, readPlayerToken, toPublicRoom, PLAYER_COOKIE } from "@/lib/room/engine";
import { roomError, roomFailure } from "../respond";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const playerId = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);
    if (!playerId) return NextResponse.json({ error: "Player session missing." }, { status: 401 });

    const result = await claimBingo(id, playerId);
    if ("error" in result) return roomError(result);
    return NextResponse.json({ room: toPublicRoom(result.room), prize: result.prize });
  } catch (err) {
    return roomFailure(err);
  }
}
