"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import TicketCard from "@/components/tickets/TicketCard";
import ChatPanel from "@/components/room/ChatPanel";
import Confetti from "@/components/room/Confetti";
import CallerControls from "@/components/room/CallerControls";
import Leaderboard from "@/components/room/Leaderboard";
import BallMachine from "@/components/room/BallMachine";
import CashPool from "@/components/room/CashPool";
import RoomInviteCard from "@/components/room/RoomInviteCard";
import RoomSettingsEditor from "@/components/room/RoomSettingsEditor";
import { completePatternsOnTickets } from "@/lib/room/wins";
import type { PublicRoom, RoomSettings } from "@/lib/room/types";
import type { Grid } from "@/lib/ticket";

interface RoomData {
  room: PublicRoom;
  me: string | null;
  myTickets: Grid[];
}

const POLL_MS = 2000;

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

/** Brief win fanfare — played when a Bingo claim or prize is confirmed. */
function playBingo() {
  try {
    dingCtx = dingCtx ?? new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = dingCtx!.createOscillator();
      const gain = dingCtx!.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t0 = dingCtx!.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain).connect(dingCtx!.destination);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [calling, setCalling] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [drawSpeedMs, setDrawSpeedMs] = useState(5000);
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
  const winnerIds = new Set(room?.prizes.map((p) => p.playerId) ?? []);
  const calledSet = useMemo(
    () => new Set(room?.calledNumbers ?? []),
    [room?.calledNumbers]
  );

  // Client-side Bingo self-check: which patterns MY tickets currently complete
  // (honours the room's prize settings and prizes already awarded).
  const myComplete = useMemo(() => {
    if (!room || !data?.myTickets.length) return [];
    return completePatternsOnTickets(data.myTickets, calledSet, room);
  }, [data, room, calledSet]);
  const canClaim = myComplete.length > 0 && room?.status === "live";

  async function saveSettings(patch: Partial<RoomSettings>) {
    if (!roomId) return;
    setSettingsSaving(true);
    try {
      await fetch(`/api/rooms/${roomId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      showToast("Prize settings saved");
    } finally {
      setSettingsSaving(false);
    }
  }

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

  async function doCallSpecific(num: number) {
    if (!roomId || pendingCall.current) return;
    pendingCall.current = true;
    setCalling(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: num }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        await refresh();
      } else {
        showToast(json.error ?? "Could not call that number.");
      }
    } finally {
      pendingCall.current = false;
      setCalling(false);
    }
  }

  // Caller auto-draw: every drawSpeedMs while I'm the caller and the game is live.
  useEffect(() => {
    if (!room || room.status !== "live" || room.callerId !== me || !auto) return;
    const iv = setInterval(() => {
      void doCall();
    }, drawSpeedMs);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, room?.status, room?.callerId, me, auto, drawSpeedMs]);

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
        playBingo();
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

  if (loading && !data) {
    return <p className="py-20 text-center font-body-md text-body-md text-on-surface-variant">Connecting to room…</p>;
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="font-headline-md text-headline-md font-semibold text-on-surface">Room not found</p>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">The room may have expired or the link is wrong.</p>
        <Link
          href="/play"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-6 py-2.5 font-headline-sm text-sm font-bold text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.3)]"
        >
          <span className="material-symbols-outlined text-lg">play_arrow</span>
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
      <Confetti prizes={room?.prizes} />
      {inviteOpen && room && <RoomInviteCard room={room} onClose={() => setInviteOpen(false)} />}
      {error && <p className="rounded-lg border border-error/30 bg-error-container/15 px-3 py-2 font-body-sm text-xs text-error">{error}</p>}

      {/* Header */}
      <div className="w-full bg-surface-container-low/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-fixed-dim">
            <span className="material-symbols-outlined text-3xl">stars</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">Party Room</h1>
              <span className="px-3 py-1 rounded-xl bg-surface-container-high font-mono text-sm font-bold tracking-widest text-primary-fixed-dim">
                {room.code}
              </span>
              {room.round > 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-wider font-extrabold shadow-sm">
                  Round {room.round}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant font-label-md text-label-md flex-wrap mt-0.5">
              <span className={`flex items-center gap-1.5 ${
                room.status === "live"
                  ? "text-secondary"
                  : room.status === "finished"
                    ? "text-on-surface-variant"
                    : "text-primary"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  room.status === "live"
                    ? "bg-secondary animate-ping"
                    : room.status === "finished"
                      ? "bg-on-surface-variant"
                      : "bg-primary"
                }`} />
                {statusCopy}
              </span>
              {myPlayer && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span className="text-on-surface-variant">
                    Playing as <strong className="text-primary-fixed-dim font-semibold">{myPlayer.name}</strong> · {myPlayer.ticketCount} ticket{myPlayer.ticketCount === 1 ? "" : "s"}
                  </span>
                </>
              )}
              {!myPlayer && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span className="text-on-surface-variant">Spectating — watch the board live</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-container px-4 py-2 font-label-md text-sm font-semibold text-on-surface-variant">
            <input
              type="checkbox"
              checked={voiceOn}
              onChange={(e) => setVoiceOn(e.target.checked)}
              className="h-4 w-4 accent-primary-container"
            />
            <span className="material-symbols-outlined text-lg">volume_up</span>
            Voice
          </label>
          <button
            onClick={() => setInviteOpen(true)}
            className="rounded-xl bg-secondary-container/20 px-4 py-2 font-label-md text-sm font-semibold text-secondary transition hover:bg-secondary-container/30"
          >
            <span className="material-symbols-outlined text-lg align-middle mr-1">person_add</span>
            Invite players
          </button>
          {isCaller && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-container px-4 py-2 font-label-md text-sm font-semibold text-on-surface-variant">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4 accent-primary-container" />
              <span className="material-symbols-outlined text-lg">bolt</span>
              Auto draw
            </label>
          )}
        </div>
      </div>

      {/* Prizes so far */}
      {room.prizes.length > 0 && (
        <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-4 shadow-xl">
          <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span className="material-symbols-outlined text-sm align-middle mr-1">emoji_events</span>
            Prizes won
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {room.prizes.map((p) => {
              return (
                <span
                  key={p.pattern}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container/20 px-3 py-1 font-label-sm text-xs font-semibold text-secondary"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {p.label} — {p.playerName}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Cash pool */}
      <CashPool room={room} />

      {/* Host prize settings (lobby only) */}
      {room.status === "waiting" && isHost && (
        <RoomSettingsEditor
          settings={room.settings}
          disabled={false}
          saving={settingsSaving}
          onSave={(patch) => void saveSettings(patch)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Board + caller */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-container-low/95 backdrop-blur-xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Last called</p>
                <div className="mt-2">
                  <BallMachine number={room.lastNumber} live={room.status === "live"} />
                </div>
              </div>
              <div className="text-right">
                <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Called</p>
                <p className="font-headline-md text-headline-md font-bold text-primary-fixed-dim">
                  {room.calledNumbers.length}<span className="text-base text-on-surface-variant">/90</span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-10 gap-1">
              {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => {
                const called = calledSet.has(n);
                const isLast = n === room.lastNumber;
                const canPick = isCaller && room.status === "live" && !called && !calling;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={!canPick}
                    onClick={() => canPick && void doCallSpecific(n)}
                    className={`flex aspect-square items-center justify-center rounded-md font-ticket-digit text-xs font-bold transition ${
                      isLast
                        ? "bg-gradient-to-tr from-primary-fixed to-primary-container text-on-primary-container shadow-2xl shadow-primary-container/40"
                        : called
                          ? "bg-primary-container/50 text-primary-fixed-dim"
                          : canPick
                            ? "cursor-pointer bg-surface-container-high text-on-surface-variant hover:scale-110 hover:bg-surface-container-highest hover:text-on-surface active:scale-95"
                            : "bg-surface-container-lowest text-on-surface-variant/60"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            {isCaller && (
              <CallerControls
                calledNumbers={room.calledNumbers}
                isCaller={isCaller}
                live={room.status === "live"}
                speedMs={drawSpeedMs}
                onSpeedChange={setDrawSpeedMs}
              />
            )}

            {room.status === "waiting" && isHost && (
              <div className="mt-5">
                <button
                  onClick={() => void startNow()}
                  disabled={!canStart}
                  className={`w-full rounded-xl px-5 py-3 font-headline-sm text-sm font-bold transition ${
                    canStart
                      ? "bg-gradient-to-r from-primary-container via-primary to-primary-fixed text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.3)] hover:brightness-110"
                      : "cursor-not-allowed bg-surface-container-high text-on-surface-variant/60"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg align-middle mr-1">play_arrow</span>
                  Start game now ({paidTicketCount}/15 minimum)
                </button>
                <p className="mt-2 text-center text-xs text-on-surface-variant">
                  {room.ticketsNeeded > 0
                    ? `Waiting for ${room.ticketsNeeded} more paid ticket${room.ticketsNeeded === 1 ? "" : "s"} to reach 15.`
                    : `You can start anytime — the room fills up to 50 tickets.`}
                </p>
              </div>
            )}

            {room.status === "live" && (
              <div className="mt-5 space-y-3">
                {isCaller && (
                  <p className="text-center text-xs font-medium text-primary-fixed-dim">
                    Tap any highlighted number on the board to call it, or draw randomly ↓
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {isCaller ? (
                    <button
                      onClick={() => void doCall()}
                      disabled={calling}
                      className="flex-1 rounded-xl bg-secondary-container/25 px-5 py-3 text-sm font-bold text-secondary transition hover:bg-secondary-container/40 disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-lg align-middle mr-1">casino</span>
                      {calling ? "Calling…" : "Random draw"}
                    </button>
                  ) : (
                    <div className="flex-1">
                      <p className="text-center text-xs text-on-surface-variant">
                        {room.callerId ? "The caller draws the numbers — watch the board live." : "Caller pending…"}{" "}
                        {me && (
                          <button onClick={() => void takeOver()} className="ml-1 font-semibold text-primary-fixed-dim underline-offset-2 hover:underline">
                            Take over as caller
                          </button>
                        )}
                      </p>
                    </div>
                  )}
                  {me && myPlayer?.paid && (
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => void claimBingo()}
                        disabled={claiming || !canClaim}
                        className={`rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          canClaim
                            ? "bg-gradient-to-r from-primary to-primary-container text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:brightness-110 animate-pulse"
                            : "bg-surface-container-high text-on-surface-variant/60"
                        }`}
                      >
                        {claiming ? "Checking…" : "BINGO!"}
                      </button>
                      {!canClaim && room.status === "live" && (
                        <p className="text-[11px] text-on-surface-variant/70">
                          No complete pattern yet — {90 - room.calledNumbers.length} numbers left
                        </p>
                      )}
                      {canClaim && (
                        <p className="text-[11px] font-semibold text-secondary">
                          {myComplete.map((h) => h.label).join(", ")} ready on your ticket!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {room.status === "finished" && (
              <div className="mt-5 space-y-3">
                <p className="rounded-lg border border-secondary/20 bg-secondary/10 px-3 py-2 text-center text-sm font-semibold text-secondary">
                  <span className="material-symbols-outlined text-lg align-middle mr-1">emoji_events</span>
                  {room.winner
                    ? `${room.winner.playerName} won ${room.winner.label}!`
                    : "Game complete — all 90 numbers were called."}
                </p>
                {me && (
                  <button
                    onClick={() => void nextRound()}
                    className="w-full rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-5 py-3 text-sm font-bold text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.3)] transition hover:brightness-110"
                  >
                    <span className="material-symbols-outlined text-lg align-middle mr-1">refresh</span>
                    Next round — fresh tickets for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <span className="material-symbols-outlined text-sm align-middle mr-1">groups</span>
                Players
              </p>
              <span className="flex items-center gap-1.5 font-label-md text-[11px] font-medium text-on-surface-variant">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                {room.players.length} in room
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {room.players.map((p) => {
                const wins = room.standings[p.id] ?? 0;
                const hasPrize = winnerIds.has(p.id);
                const isCallerPlayer = p.id === room.callerId;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-container px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-sm font-semibold text-on-surface">{p.name}</span>
                      {p.id === me && <span className="text-[10px] font-semibold text-primary-fixed-dim">you</span>}
                      {isCallerPlayer && <span className="material-symbols-outlined text-sm text-primary-fixed-dim">mic</span>}
                      {hasPrize && <span className="material-symbols-outlined text-sm text-primary">emoji_events</span>}
                    </div>
                    <span className="flex items-center gap-1.5">
                      {wins > 0 && (
                        <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 text-[11px] font-bold text-secondary">
                          {wins} win{wins === 1 ? "" : "s"}
                        </span>
                      )}
                      <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                        {p.ticketCount} tickets
                      </span>
                      {p.paid ? (
                        <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 text-[11px] font-semibold text-secondary">paid</span>
                      ) : (
                        <span className="rounded-full bg-primary-container/20 px-2 py-0.5 text-[11px] font-semibold text-primary">pending</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <Leaderboard room={room} />

          <ChatPanel roomId={roomId} room={room} me={me} onSent={refresh} />
        </div>
      </div>

      {/* My tickets — full width so they render at proper size */}
      {data?.myTickets.length ? (
        <div className="rounded-2xl bg-surface-container-low/95 backdrop-blur-xl p-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary animate-pulse" />
            <p className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Your active tickets · {me ? room.players.find((p) => p.id === me)?.name ?? "you" : "you"}
            </p>
            <span className="rounded bg-surface-container-high px-2 py-0.5 font-mono font-label-sm text-[10px] text-secondary-fixed">
              {data.myTickets.length} shown
            </span>
          </div>
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
                  className="w-full rounded-xl bg-surface-container px-3 py-1.5 font-label-md text-[11px] font-semibold text-secondary transition hover:bg-secondary-container/20"
                >
                  <span className="material-symbols-outlined text-base align-middle mr-1">send</span>
                  Send my ticket on WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !me && (
          <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl p-5 text-center shadow-xl">
            <p className="font-body-md text-body-md text-on-surface-variant">You are not a player in this room yet.</p>
            <Link
              href="/play"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-5 py-2 text-sm font-bold text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.3)]"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Join now
            </Link>
          </div>
        )
      )}

      {/* Win popup */}
      {room.status === "finished" && room.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-surface-container-lowest/80 backdrop-blur-2xl p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-low/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <div className="absolute -top-24 left-1/2 w-80 h-80 bg-primary-container/30 rounded-full blur-3xl pointer-events-none -translate-x-1/2" aria-hidden="true" />
            <div className="relative z-[1] flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-on-primary-container shadow-2xl shadow-primary-container/50 animate-bounce">
                <span className="material-symbols-outlined text-4xl">emoji_events</span>
              </div>
              <h2 className="mt-4 font-headline-md text-headline-md font-bold text-primary-fixed-dim">
                {room.winner.playerName} wins {room.winner.label}!
              </h2>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Ticket {room.winner.ticketIndex + 1} · {room.calledNumbers.length} numbers called
              </p>
            </div>

            {room.prizes.length > 1 && (
              <div className="relative z-[1] mt-5 rounded-2xl bg-surface-container p-4">
                <p className="mb-2 font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  All prizes this round
                </p>
                <ul className="space-y-1.5">
                  {room.prizes.map((p) => {
                    return (
                      <li key={p.pattern} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-on-surface">
                          <span className="material-symbols-outlined text-base align-middle mr-1 text-secondary">check_circle</span>
                          {p.label}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {p.playerName} · call {p.calledCount}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="relative z-[1] mt-5">
              <p className="mb-1 font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
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

            <div className="relative z-[1] mt-5 rounded-2xl bg-surface-container p-4">
              <p className="mb-2 font-label-sm text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Players ({room.players.length})
              </p>
              <ul className="space-y-1.5">
                {room.players.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-on-surface">
                      {p.name}
                      {winnerIds.has(p.id) && (
                        <span className="ml-2 rounded-full bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold text-primary-fixed-dim">
                          WINNER
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-on-surface-variant">{p.ticketCount} tickets</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-[1] mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void nextRound()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-6 py-2.5 text-sm font-bold text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.3)]"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Next round
              </button>
              <Link
                href="/play"
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 px-6 py-2.5 text-sm font-bold text-on-surface-variant transition hover:border-primary hover:text-primary-fixed-dim"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                New room
              </Link>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-surface-container-high px-5 py-3 font-body-md text-sm font-medium text-on-surface shadow-2xl backdrop-blur-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
