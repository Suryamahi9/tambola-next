"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TicketCard from "@/components/tickets/TicketCard";
import { PATTERNS } from "@/lib/room/wins";
import type { PublicRoom } from "@/lib/room/types";
import type { Grid } from "@/lib/ticket";

interface RoomData {
  room: PublicRoom;
  me: string | null;
  myTickets: Grid[];
}

const POLL_MS = 2000;
const DRAW_MS = 5000;

let dingCtx: AudioContext | null = null;
function playDing() {
  try {
    dingCtx = dingCtx ?? new AudioContext();
    const osc = dingCtx.createOscillator();
    const gain = dingCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1046.5;
    gain.gain.setValueAtTime(0.0001, dingCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, dingCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, dingCtx.currentTime + 0.4);
    osc.connect(gain).connect(dingCtx.destination);
    osc.start();
    osc.stop(dingCtx.currentTime + 0.45);
  } catch {
    /* audio unavailable */
  }
}

function speakNumber(num: number) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(String(num));
  u.lang = "en-IN";
  u.rate = 0.9;
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  window.setTimeout(() => speechSynthesis.speak(u), 200);
}

function waTicketText(grid: Grid, idx: number): string {
  const nums = grid
    .flat()
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
    .join(", ");
  return `🎫 Your Tambola Ticket ${idx + 1}\n\nNumbers:\n${nums}`;
}

export default function RoomView({ roomId }: { roomId: string }) {
  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [calling, setCalling] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pendingCall = useRef(false);
  const lastAnnounced = useRef<number | null>(null);
  const lastRound = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

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
  const winnerIds = new Set(room?.prizes.map((p) => p.playerId) ?? []);

  // Announce newly drawn numbers (ding + voice).
  useEffect(() => {
    if (!room) return;
    if (room.round !== lastRound.current) {
      lastRound.current = room.round;
      lastAnnounced.current = null;
    }
    if (room.status !== "live" || !voiceOn) return;
    const num = room.lastNumber;
    if (num === null || num === lastAnnounced.current) return;
    lastAnnounced.current = num;
    playDing();
    speakNumber(num);
  }, [room, voiceOn]);

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

  async function claimBingo() {
    if (!roomId || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/claim`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        showToast("✅ Bingo! Claim confirmed — refresh the board.");
        await refresh();
      } else {
        showToast(json.error ?? "No complete pattern yet.");
      }
    } finally {
      setClaiming(false);
    }
  }

  async function nextRound() {
    if (!roomId) return;
    const res = await fetch(`/api/rooms/${roomId}/round`, { method: "POST" });
    if (res.ok) await refresh();
  }

  async function shareTicket(grid: Grid, idx: number) {
    const text = waTicketText(grid, idx);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Tambola Ticket", text });
        return;
      }
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* user cancelled */
    }
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
        : room.ticketsNeeded > 0
          ? `Waiting — ${room.ticketsNeeded} more ticket${room.ticketsNeeded === 1 ? "" : "s"} to reach the 15 minimum`
          : "Ready to start — host starts the game";

  const paidTicketCount = room.players.filter((p) => p.paid).reduce((n, p) => n + p.ticketCount, 0);
  const canStart = room.status === "waiting" && isHost && room.ticketsNeeded <= 0;

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
            {room.round > 1 && (
              <span className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-neutral-300">
                Round {room.round}
              </span>
            )}
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
          {myPlayer ? (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              You are playing as <span className="font-semibold text-violet-300">{myPlayer.name}</span> ·{" "}
              {myPlayer.ticketCount} ticket{myPlayer.ticketCount === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">👀 Spectating — you can watch the board live.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-neutral-200">
            <input
              type="checkbox"
              checked={voiceOn}
              onChange={(e) => setVoiceOn(e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            🔊 Voice
          </label>
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

      {/* Prizes so far */}
      {room.prizes.length > 0 && (
        <div className="glass-subtle rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Prizes won</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {room.prizes.map((p) => {
              const meta = PATTERNS.find((x) => x.id === p.pattern);
              return (
                <span
                  key={p.pattern}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                >
                  {meta?.icon ?? "🏆"} {p.label} — {p.playerName}
                </span>
              );
            })}
          </div>
        </div>
      )}

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
                  disabled={!canStart}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold transition ${
                    canStart
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 hover:brightness-110"
                      : "cursor-not-allowed bg-white/5 text-neutral-500"
                  }`}
                >
                  ▶️ Start game now ({paidTicketCount}/15 minimum)
                </button>
                <p className="mt-2 text-center text-xs text-neutral-500">
                  {room.ticketsNeeded > 0
                    ? `Waiting for ${room.ticketsNeeded} more paid ticket${room.ticketsNeeded === 1 ? "" : "s"} to reach 15.`
                    : `You can start anytime — the room fills up to 50 tickets.`}
                </p>
              </div>
            )}

            {room.status === "live" && (
              <div className="mt-5 flex flex-wrap gap-3">
                {isCaller ? (
                  <button
                    onClick={() => void doCall()}
                    disabled={calling}
                    className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {calling ? "Calling…" : "🎙️ Call Next Number"}
                  </button>
                ) : (
                  <div className="flex-1">
                    <p className="text-center text-xs text-neutral-400">
                      {room.callerId ? "The caller draws the numbers — watch the board live." : "Caller pending…"}{" "}
                      {me && (
                        <button onClick={() => void takeOver()} className="ml-1 font-semibold text-violet-300 underline-offset-2 hover:underline">
                          Take over as caller
                        </button>
                      )}
                    </p>
                  </div>
                )}
                {me && myPlayer?.paid && (
                  <button
                    onClick={() => void claimBingo()}
                    disabled={claiming}
                    className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
                  >
                    {claiming ? "Checking…" : "🟢 Bingo!"}
                  </button>
                )}
              </div>
            )}

            {room.status === "finished" && (
              <div className="mt-5 space-y-3">
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-sm font-semibold text-emerald-300">
                  {room.winner
                    ? `🏆 ${room.winner.playerName} won ${room.winner.label}!`
                    : "🏁 Game complete — all 90 numbers were called."}
                </p>
                {me && (
                  <button
                    onClick={() => void nextRound()}
                    className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110"
                  >
                    🔁 Next round — fresh tickets for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="space-y-4">
          <div className="glass-subtle rounded-2xl border border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Players</p>
            <ul className="mt-3 space-y-2">
              {room.players.map((p) => {
                const wins = room.standings[p.id] ?? 0;
                const hasPrize = winnerIds.has(p.id);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-100">{p.name}</span>
                      {p.id === me && <span className="text-[10px] text-violet-300">you</span>}
                      {p.id === room.callerId && <span className="text-[10px]">🎙️</span>}
                      {hasPrize && <span className="text-[10px]">🏆</span>}
                    </div>
                    <span className="flex items-center gap-1.5">
                      {wins > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                          {wins} win{wins === 1 ? "" : "s"}
                        </span>
                      )}
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
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* My tickets — full width so they render at proper size */}
      {data?.myTickets.length ? (
        <div className="glass rounded-2xl border border-white/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Your tickets · {me ? room.players.find((p) => p.id === me)?.name ?? "you" : "you"}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.myTickets.map((grid, gi) => (
              <div key={gi} className="space-y-1.5">
                <TicketCard
                  grid={grid}
                  index={gi}
                  total={data.myTickets.length}
                  called={calledSet}
                />
                <button
                  type="button"
                  onClick={() => void shareTicket(grid, gi)}
                  className="w-full rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-neutral-300 transition hover:border-emerald-400 hover:text-emerald-200"
                >
                  📤 Send my ticket on WhatsApp
                </button>
              </div>
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

            {room.prizes.length > 1 && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  All prizes this round
                </p>
                <ul className="space-y-1.5">
                  {room.prizes.map((p) => {
                    const meta = PATTERNS.find((x) => x.id === p.pattern);
                    return (
                      <li key={p.pattern} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-200">
                          {meta?.icon ?? "🏆"} {p.label}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {p.playerName} · call {p.calledCount}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

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
                      {winnerIds.has(p.id) && (
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
              <button
                type="button"
                onClick={() => void nextRound()}
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white"
              >
                🔁 Next round
              </button>
              <Link
                href="/play"
                className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-bold text-neutral-200 transition hover:border-violet-400 hover:text-violet-200"
              >
                New room
              </Link>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
