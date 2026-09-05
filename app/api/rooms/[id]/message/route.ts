import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readPlayerToken, sendMessage, toPublicRoom, PLAYER_COOKIE } from "@/lib/room/engine";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const playerId = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);
  if (!playerId) return NextResponse.json({ error: "Player session missing." }, { status: 401 });

  let text = "";
  try {
    text = String(((await request.json()) as { text?: unknown }).text ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const result = await sendMessage(id, playerId, text);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ room: toPublicRoom(result.room) });
}
