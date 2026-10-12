import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readPlayerToken, sendMessage, toPublicRoom, PLAYER_COOKIE } from "@/lib/room/engine";
import { roomError, roomFailure } from "../respond";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const playerId = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);
    if (!playerId) return NextResponse.json({ error: "Player session missing." }, { status: 401 });

    let raw: unknown;
    try {
      raw = ((await request.json()) as { text?: unknown }).text ?? "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    if (typeof raw !== "string") {
      return NextResponse.json({ error: "Message must be text." }, { status: 400 });
    }
    const text = raw.trim();
    if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

    const result = await sendMessage(id, playerId, text);
    if ("error" in result) return roomError(result);
    return NextResponse.json({ room: toPublicRoom(result.room) });
  } catch (err) {
    return roomFailure(err);
  }
}
