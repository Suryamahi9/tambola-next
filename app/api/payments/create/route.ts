import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  addPendingPlayer,
  createRoomForPlayer,
  findJoinableRoom,
  signPlayerToken,
  PLAYER_COOKIE,
  MAX_TICKETS_PER_PLAYER,
} from "@/lib/room/engine";

export const dynamic = "force-dynamic";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

async function createRazorpayOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountPaise),
      currency: "INR",
      receipt,
      notes: { source: "tambola-party-room" },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

export async function POST(request: Request) {
  let body: { name?: string; ticketCount?: number; roomCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 40);
  const rawCount = Math.floor(Number(body.ticketCount));
  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!Number.isFinite(rawCount) || rawCount < 1 || rawCount > MAX_TICKETS_PER_PLAYER) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_TICKETS_PER_PLAYER} tickets.` }, { status: 400 });
  }
  const roomCode = String(body.roomCode ?? "").trim();

  try {
    // Resolve the room: join by code, or create a new one.
    let roomId: string;
    let pricePerTicket: number;
    let playerId: string;
    if (roomCode) {
      const join = await findJoinableRoom(roomCode);
      if ("error" in join) return NextResponse.json({ error: join.error }, { status: 409 });
      roomId = join.room.id;
      pricePerTicket = join.room.pricePerTicket;
      const pending = await addPendingPlayer(roomId, name, rawCount);
      if ("error" in pending) return NextResponse.json({ error: pending.error }, { status: 409 });
      playerId = pending.player.id;
    } else {
      const room = await createRoomForPlayer(name, rawCount);
      roomId = room.id;
      pricePerTicket = room.pricePerTicket;
      playerId = room.players[0].id;
    }

    const amount = pricePerTicket * rawCount;

    const cookieStore = await cookies();
    cookieStore.set(PLAYER_COOKIE, await signPlayerToken(playerId), {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    // Test mode: without Razorpay keys we auto-approve so the flow runs end-to-end.
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({
        test: true,
        roomId,
        playerId,
        amount,
        pricePerTicket,
      });
    }

    const order = await createRazorpayOrder(amount, `room_${roomId}`);
    return NextResponse.json({
      test: false,
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      roomId,
      playerId,
      amount,
      pricePerTicket,
    });
  } catch (err) {
    console.error("[payments] create failed:", err);
    return NextResponse.json(
      { error: "Could not start payment. Check Razorpay keys and try again." },
      { status: 500 }
    );
  }
}
