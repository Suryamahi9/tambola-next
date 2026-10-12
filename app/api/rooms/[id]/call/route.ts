import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callNumber, readPlayerToken, toPublicRoom, PLAYER_COOKIE } from "@/lib/room/engine";
import { roomError, roomFailure } from "../respond";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const callerId = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);
    if (!callerId) return NextResponse.json({ error: "Player session missing." }, { status: 401 });

    let num: number | undefined;
    let numberProvided = false;
    try {
      const body = await request.json();
      if (body && "number" in body) {
        numberProvided = true;
        if (typeof body.number === "number" && Number.isInteger(body.number)) {
          num = body.number;
        }
      }
    } catch {
      /* no body — fall through to random draw */
    }
    // A malformed pick must fail loudly, never silently become a random draw.
    if (numberProvided && num === undefined) {
      return NextResponse.json(
        { error: "Pick a whole number between 1 and 90, or omit it for a random draw." },
        { status: 400 }
      );
    }

    const result = await callNumber(id, callerId, num);
    if ("error" in result) return roomError(result);
    return NextResponse.json({ room: toPublicRoom(result.room) });
  } catch (err) {
    return roomFailure(err);
  }
}
