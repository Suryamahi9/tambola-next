"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicRoom } from "@/lib/room/types";
import { MAX_CHAT_LENGTH } from "@/lib/room/types";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}

function messageClass(kind: "user" | "system" | "ai"): string {
  if (kind === "system") return "justify-center";
  if (kind === "ai") return "justify-start";
  return "justify-end";
}

export default function ChatPanel({
  roomId,
  room,
  me,
  onSent,
}: {
  roomId: string;
  room: PublicRoom;
  me: string | null;
  onSent: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinned, setPinned] = useState(true);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const [prevLatestId, setPrevLatestId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const messages = room.messages;
  const latest = messages.length ? messages[messages.length - 1] : null;

  // Adjust state when a new message arrives: while pinned we follow it, so
  // "seen" advances; while scrolled up we leave it so unread accumulates.
  if (latest && latest.id !== prevLatestId) {
    setPrevLatestId(latest.id);
    if (pinned) setLastSeenId(latest.id);
  }

  // Follow the newest line while the list is pinned to the bottom.
  useEffect(() => {
    const el = listRef.current;
    if (!el || !pinned) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, pinned]);

  // Unread badge = user lines newer than the last one we've seen.
  let unread = 0;
  if (lastSeenId) {
    const seenIdx = messages.findIndex((m) => m.id === lastSeenId);
    unread = messages
      .slice(seenIdx + 1)
      .filter((m) => m.kind === "user" && m.playerId !== me).length;
  }

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    const nowPinned = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    setPinned(nowPinned);
    if (nowPinned && latest) setLastSeenId(latest.id);
  }

  function jumpToLatest() {
    setPinned(true);
    if (latest) setLastSeenId(latest.id);
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }

  async function send() {
    const text = draft.trim().slice(0, MAX_CHAT_LENGTH);
    if (!text || sending || !me) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setDraft("");
        setPinned(true);
        if (latest) setLastSeenId(latest.id);
        onSent();
      } else {
        setError(json.error ?? "Could not send message.");
      }
    } catch {
      setError("Lost connection — try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl bg-surface-container-low/95 backdrop-blur-xl p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-secondary text-xl">forum</span>
          <div className="flex flex-col">
            <p className="font-headline-sm text-base font-bold leading-tight text-on-surface">Salon chat &amp; bot</p>
            <span className="font-label-sm text-[10px] text-on-surface-variant font-mono">Room {room.code} • {room.players.length} connected</span>
          </div>
        </div>
        <span className="flex items-center gap-1.5 font-label-sm text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
          live · 2s sync
        </span>
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="mt-3 flex max-h-72 min-h-40 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]"
      >
        {messages.length === 0 && (
          <p className="my-auto py-6 text-center text-xs text-on-surface-variant">
            No messages yet — say hi to the room!
          </p>
        )}

        {messages.map((m) => {
          if (m.kind === "system") {
            return (
              <p
                key={m.id}
                className="flex items-center gap-2 text-center text-[11px] font-medium text-on-surface-variant"
              >
                <span className="h-px flex-1 bg-outline-variant/50" />
                {m.text}
                <span className="h-px flex-1 bg-outline-variant/50" />
              </p>
            );
          }
          const mine = m.playerId !== null && m.playerId === me;
          const isBot = m.kind === "ai";
          return (
            <div key={m.id} className={`flex w-full ${messageClass(m.kind)}`}>
              <div
                className={`flex max-w-[85%] items-end gap-2 ${
                  isBot || mine ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {isBot ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-container text-on-primary-container">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                  </span>
                ) : (
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      mine
                        ? "bg-gradient-to-br from-primary-container to-primary text-on-primary-container"
                        : "bg-surface-container-high text-on-surface"
                    }`}
                  >
                    {initials(m.playerName)}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-1.5 text-sm ${
                    isBot
                      ? "rounded-bl-sm border border-tertiary-container/30 bg-tertiary-container/15 text-on-surface"
                      : mine
                        ? "rounded-br-sm bg-gradient-to-r from-primary-container via-primary to-primary-fixed text-on-primary-container"
                        : "rounded-bl-sm bg-surface-container-high text-on-surface"
                  }`}
                >
                  {!mine && !isBot && (
                    <p className="mb-0.5 text-[10px] font-semibold text-primary-fixed-dim">
                      {m.playerName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words leading-snug">
                    {m.text}
                  </p>
                  <p
                    className={`mt-0.5 text-right text-[9px] ${
                      mine ? "text-on-primary-container/70" : "text-on-surface-variant/70"
                    }`}
                  >
                    {timeLabel(m.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {unread > 0 && !pinned && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="mx-auto -mt-2 mb-1 rounded-full border border-primary/40 bg-primary-container/20 px-3 py-0.5 text-[11px] font-bold text-primary"
        >
          {unread} new
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-error/30 bg-error-container/15 px-3 py-1.5 text-[11px] text-error">
          {error}
        </p>
      )}

      {me ? (
        <>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHAT_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Type a message… (@bot for help)"
              maxLength={MAX_CHAT_LENGTH}
              className="min-w-0 flex-1 rounded-xl border border-outline-variant/50 bg-surface-container px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none transition focus:border-primary/60"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container transition hover:bg-primary disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-on-surface-variant">
            {draft.length}/{MAX_CHAT_LENGTH} · try{" "}
            <span className="font-mono text-primary-fixed-dim">/rules</span> or{" "}
            <span className="font-mono text-primary-fixed-dim">@bot</span> for the AI announcer
          </p>
        </>
      ) : (
        <p className="mt-3 text-center text-[11px] text-on-surface-variant">
          Join the room to chat.
        </p>
      )}
    </div>
  );
}
