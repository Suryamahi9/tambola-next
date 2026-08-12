import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { markPaid, readPlayerToken, PLAYER_COOKIE } from "@/lib/room/engine";

export const dynamic = "force-dynamic";

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const playerId = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);

  let body: { roomId?: string; orderId?: string; paymentId?: string; signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const roomId = String(body.roomId ?? "");
  if (!playerId) return NextResponse.json({ error: "Player session missing." }, { status: 401 });
  if (!roomId) return NextResponse.json({ error: "Missing room id." }, { status: 400 });

  try {
    // Test mode: no Razorpay keys means payments are auto-approved.
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      const result = await markPaid(roomId, playerId);
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
      return NextResponse.json({ ok: true, test: true, roomId });
    }

    const { orderId, paymentId, signature } = body;
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Incomplete Razorpay payload." }, { status: 400 });
    }
    if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
      return NextResponse.json({ error: "Payment signature invalid." }, { status: 400 });
    }

    const result = await markPaid(roomId, playerId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true, test: false, roomId });
  } catch (err) {
    console.error("[payments] verify failed:", err);
    return NextResponse.json({ error: "Could not verify payment." }, { status: 500 });
  }
}
