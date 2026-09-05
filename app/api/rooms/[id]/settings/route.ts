import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readPlayerToken, toPublicRoom, updateRoomSettings, PLAYER_COOKIE } from "@/lib/room/engine";
import type { RoomSettings } from "@/lib/room/types";

export const dynamic = "force-dynamic";

const SETTING_KEYS: ("fullHouse" | "corners" | "earlyFive" | "topLine" | "middleLine" | "bottomLine")[] = [
  "fullHouse",
  "corners",
  "earlyFive",
  "topLine",
  "middleLine",
  "bottomLine",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const playerId = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);
  if (!playerId) return NextResponse.json({ error: "Player session missing." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch: Partial<RoomSettings> = {};
  for (const key of SETTING_KEYS) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "boolean") patch[key] = value;
  }
  if (Array.isArray((body as Record<string, unknown>).lineOrder)) {
    const lines = ((body as Record<string, unknown>).lineOrder as unknown[]).filter(
      (l): l is "top" | "middle" | "bottom" => l === "top" || l === "middle" || l === "bottom"
    );
    if (lines.length === 3) patch.lineOrder = lines;
  }

  const result = await updateRoomSettings(id, playerId, patch);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ room: toPublicRoom(result.room) });
}