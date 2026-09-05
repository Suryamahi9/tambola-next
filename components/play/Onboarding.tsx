"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateResponse {
  test?: boolean;
  orderId?: string;
  keyId?: string;
  roomId: string;
  playerId: string;
  amount: number;
  pricePerTicket: number;
  error?: string;
}

interface VerifyResponse {
  ok?: boolean;
  error?: string;
}

interface RazorpayWindow {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
}

function loadRazorpayCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as RazorpayWindow).Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

export default function Onboarding({
  pricePerTicket,
  formattedPrice,
  ticketsToStart,
  maxTickets,
}: {
  pricePerTicket: number;
  formattedPrice: string;
  ticketsToStart: number;
  maxTickets: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [joinMode, setJoinMode] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setError("");
    setPending(true);
    try {
      const createRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ticketCount,
          roomCode: joinMode ? roomCode : undefined,
        }),
      });
      const create = (await createRes.json()) as CreateResponse;
      if (!createRes.ok || create.error) {
        setError(create.error ?? "Could not start payment.");
        setPending(false);
        return;
      }

      const verify = async (payload: Record<string, string>) => {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, roomId: create.roomId }),
        });
        const body = (await res.json()) as VerifyResponse;
        if (!res.ok || !body.ok) {
          setError(body.error ?? "Could not confirm payment.");
          setPending(false);
          return false;
        }
        return true;
      };

      if (create.test) {
        const ok = await verify({});
        if (ok) router.push(`/room/${create.roomId}`);
        return;
      }

      await loadRazorpayCheckout();
      const rzp = new (window as RazorpayWindow).Razorpay!({
        key: create.keyId,
        amount: create.amount,
        currency: "INR",
        name: "Tambola Party Room",
        description: `${ticketCount} ticket(s) · Room #${create.roomId.slice(0, 6)}`,
        order_id: create.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const ok = await verify({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          if (ok) router.push(`/room/${create.roomId}`);
        },
        theme: { color: "#f59e0b" },
        modal: { ondismiss: () => setPending(false) },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
        >
          Your name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="e.g. Priya"
          className="w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label
          htmlFor="ticketCount"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
        >
          Tickets ({formattedPrice} each)
        </label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: maxTickets }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTicketCount(n)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold transition ${
                ticketCount === n
                  ? "border-primary bg-primary text-on-primary-container shadow-lg shadow-primary/25"
                  : "border-white/15 bg-surface-container-high text-on-surface-variant hover:border-primary/50 hover:text-on-surface"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant/80">
          {ticketsToStart} tickets needed to start the game.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-surface-container-low p-4">
        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input
            type="checkbox"
            checked={joinMode}
            onChange={(e) => setJoinMode(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          I have a room code — join an existing room
        </label>
        {joinMode && (
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Room code"
            className="mt-3 w-full rounded-xl border border-white/10 bg-surface-container-lowest px-4 py-2.5 text-sm uppercase tracking-widest text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-container-low px-4 py-3">
        <span className="text-sm text-on-surface-variant">
          Total · {ticketCount} × {formattedPrice}
        </span>
        <span className="font-display text-lg font-bold text-primary">
          {(ticketCount * pricePerTicket / 100).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          })}
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={pending || !name.trim()}
        className="w-full rounded-full bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-5 py-3 text-sm font-bold text-on-primary-container shadow-lg shadow-primary/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Processing…" : joinMode ? "Pay & Join Room" : "Pay & Create Room"}
      </button>
    </div>
  );
}