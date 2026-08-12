"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TicketCard from "@/components/tickets/TicketCard";
import type { PublicRoom } from "@/lib/room/types";
import type { Grid } from "@/lib/ticket";

interface RoomData {
  room: PublicRoom;
  me: string | null;
  myTickets: Grid[];
}

const POLL_MS = 2000;
const DRAW_MS = 5000;

export default function RoomView({ roomId }: { roomId: string }) {
  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(true);
  const [copied, setCopied] = useState(false);
  const [calling, setCalling] = useState(false);
  const pendingCall = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Room not found.");
      const json = (await res.json()) as RoomData;
      setData(json);
      setError("");
    } catch {
      setError("Lost connection to the room. Retrying…");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rooms/${roomId}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Room not found.");
        return res.json() as Promise<RoomData>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Lost connection to the room. Retrying…");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const iv = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [roomId, refresh]);

  const room = data?.room ?? null;
  const me = data?.me ?? null;
  const isCaller = !!room && room.callerId === me;
  const isHost = !!room && room.hostId === me;
  const myPlayer = room?.players.find((p) => p.id === me) ?? null;
  const calledSet = new Set(room?.calledNumbers ?? []);

  async function doCall() {
    if (!roomId || pendingCall.current) return;
    pendingCall.current = true;
    setCalling(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/call`, { method: "POST" });
      if (res.ok) await refresh();
    } finally {
      pendingCall.current = false;
      setCalling(false);
    }
  }

  // Caller auto-draw: every DRAW_MS while I'm the caller and the game is live.
  useEffect(() => {
    if (!room || room.status !== "live" || room.callerId !== me || !auto) return;
    const iv = setInterval(() => {
      void doCall();
    }, DRAW_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, room?.status, room?.callerId, me, auto]);

  async function takeOver() {
    if (!roomId) return;
    const res = await fetch(`/api/rooms/${roomId}/caller`, { method: "POST" });
    if (res.ok) await refresh();
  }

  async function startNow() {
    if (!roomId) return;
    const res = await fetch(`/api/rooms/${roomId}/start`, { method: "POST" });
    if (res.ok) await refresh();
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `🎫 Join my Tambola room! Code: ${room?.code ?? ""} · ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Tambola Party Room", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  }

  if (loading && !data) {
    return <p className="py-20 text-center text-sm text-neutral-400">Connecting to room…</p>;
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-lg font-semibold text-neutral-200">Room not found</p>
        <p className="mt-2 text-sm text-neutral-400">The room may have expired or the link is wrong.</p>
        <Link
          href="/play"
          className="mt-6 inline-block rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white"
        >
          Create a room
        </Link>
      </div>
    );
  }

  const statusCopy =
    room.status === "live"
      ? "Game is live"
      : room.status === "finished"
        ? "Game finished"
        : `Waiting — ${room.ticketsNeeded} more ticket${room.ticketsNeeded === 1 ? "" : "s"} to start`;

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{error}</p>}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Party Room</h1>
            <span className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-sm font-bold tracking-widest text-violet-300">
              {room.code}
            </span>
          </div>
          <p
            className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              room.status === "live"
                ? "bg-emerald-500/15 text-emerald-300"
                : room.status === "finished"
                  ? "bg-neutral-500/15 text-neutral-300"
                  : "bg-amber-500/15 text-amber-300"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusCopy}
          </p>
          {myPlayer && (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              You are playing as <span className="font-semibold text-violet-300">{myPlayer.name}</span> ·{" "}
              {myPlayer.ticketCount} ticket{myPlayer.ticketCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={share}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-violet-400 hover:text-violet-200"
          >
            {copied ? "Copied ✓" : "🔗 Invite players"}
          </button>
          {isCaller && (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-neutral-200">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4 accent-violet-600" />
              Auto draw
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Board + caller */}
        <div className="space-y-4">
          <div className="glass rounded-2xl border border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Last called</p>
                <p className="font-display text-4xl font-bold text-violet-300">
                  {room.lastNumber ?? "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Called</p>
                <p className="font-display text-2xl font-bold text-neutral-100">
                  {room.calledNumbers.length}<span className="text-base text-neutral-500">/90</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-10 gap-1.5">
              {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className={`flex aspect-square items-center justify-center rounded-md text-xs font-bold transition ${
                    n === room.lastNumber
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30"
                      : calledSet.has(n)
                        ? "bg-violet-600/30 text-violet-200"
                        : "bg-white/[0.04] text-neutral-500"
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>

            {room.status === "waiting" && isHost && (
              <div className="mt-5">
                <button
                  onClick={() => void startNow()}
                  className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110"
                >
                  ▶️ Start game now ({room.players.filter((p) => p.paid).length} paid)
                </button>
                <p className="mt-2 text-center text-xs text-neutral-500">
                  Auto-starts at 15 paid tickets — start early with whoever is in.
                </p>
              </div>
            )}

            {room.status === "live" && (
              <div className="mt-5">
                {isCaller ? (
                  <button
                    onClick={() => void doCall()}
                    disabled={calling}
                    className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {calling ? "Calling…" : "🎙️ Call Next Number"}
                  </button>
                ) : (
                  <p className="text-center text-xs text-neutral-400">
                    {room.callerId ? "The caller draws the numbers — watch the board live." : "Caller pending…"}{" "}
                    {me && (
                      <button onClick={() => void takeOver()} className="ml-1 font-semibold text-violet-300 underline-offset-2 hover:underline">
                        Take over as caller
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}

            {room.status === "finished" && (
              <p className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-sm font-semibold text-emerald-300">
                {room.winner
                  ? `🏆 ${room.winner.playerName} won ${room.winner.label}!`
                  : "🏁 Game complete — all 90 numbers were called."}
              </p>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="space-y-4">
          <div className="glass-subtle rounded-2xl border border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Players</p>
            <ul className="mt-3 space-y-2">
              {room.players.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-100">{p.name}</span>
                    {p.id === me && <span className="text-[10px] text-violet-300">you</span>}
                    {p.id === room.callerId && <span className="text-[10px]">🎙️</span>}
                  </div>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-neutral-300">
                      {p.ticketCount} 🎟️
                    </span>
                    {p.paid ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">paid</span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">pending</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* My tickets */}
          {data?.myTickets.length ? (
            <div className="glass rounded-2xl border border-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Your tickets · {me ? room.players.find((p) => p.id === me)?.name ?? "you" : "you"}
              </p>
              <div className="mt-3 space-y-3">
                {data.myTickets.map((grid, gi) => (
                  <TicketCard
                    key={gi}
                    grid={grid}
                    index={gi}
                    total={data.myTickets.length}
                    called={calledSet}
                  />
                ))}
              </div>
            </div>
          ) : (
            !me && (
              <div className="glass-subtle rounded-2xl border border-white/10 p-5 text-center">
                <p className="text-sm text-neutral-400">You are not a player in this room yet.</p>
                <Link
                  href="/play"
                  className="mt-3 inline-block rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-bold text-white"
                >
                  Join now
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* Win popup */}
      {room.status === "finished" && room.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="glass w-full max-w-lg rounded-3xl border border-white/15 p-6 sm:p-8">
            <p className="text-center text-5xl">🏆</p>
            <h2 className="mt-3 text-center font-display text-2xl font-bold text-white">
              {room.winner.playerName} wins {room.winner.label}!
            </h2>
            <p className="mt-1 text-center text-sm text-neutral-400">
              Ticket {room.winner.ticketIndex + 1} · {room.calledNumbers.length} numbers called
            </p>

            <div className="mt-5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Winning ticket
              </p>
              <TicketCard
                grid={room.winner.grid}
                index={room.winner.ticketIndex}
                total={
                  room.players.find((p) => p.id === room.winner?.playerId)?.ticketCount ?? 0
                }
                called={calledSet}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Players ({room.players.length})
              </p>
              <ul className="space-y-1.5">
                {room.players.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-200">
                      {p.name}
                      {p.id === room.winner?.playerId && (
                        <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          WINNER
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-neutral-500">{p.ticketCount} 🎟️</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/play"
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white"
              >
                Play again
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
