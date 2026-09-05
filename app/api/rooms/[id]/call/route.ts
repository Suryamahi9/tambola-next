import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callNumber, readPlayerToken, toPublicRoom, PLAYER_COOKIE } from "@/lib/room/engine";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const callerId = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);
  if (!callerId) return NextResponse.json({ error: "Player session missing." }, { status: 401 });

  let num: number | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.number === "number" && Number.isInteger(body.number)) {
      num = body.number;
    }
  } catch {
    /* no body / no number — fall through to random draw */
  }

  const result = await callNumber(id, callerId, num);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ room: toPublicRoom(result.room) });
}
