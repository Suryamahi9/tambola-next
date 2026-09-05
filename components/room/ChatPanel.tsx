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
    <div className="glass-subtle flex flex-col rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Room chat
        </p>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          live · 2s sync
        </span>
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="mt-3 flex max-h-72 min-h-40 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]"
      >
        {messages.length === 0 && (
          <p className="my-auto py-6 text-center text-xs text-neutral-500">
            No messages yet — say hi to the room!
          </p>
        )}

        {messages.map((m) => {
          if (m.kind === "system") {
            return (
              <p
                key={m.id}
                className="flex items-center gap-2 text-center text-[11px] font-medium text-neutral-500"
              >
                <span className="h-px flex-1 bg-white/10" />
                {m.text}
                <span className="h-px flex-1 bg-white/10" />
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
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs">
                    🤖
                  </span>
                ) : (
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      mine
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white"
                        : "bg-white/10 text-neutral-300"
                    }`}
                  >
                    {initials(m.playerName)}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-1.5 text-sm ${
                    isBot
                      ? "rounded-bl-sm border border-white/10 bg-white/[0.05] text-neutral-200"
                      : mine
                        ? "rounded-br-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                        : "rounded-bl-sm bg-white/[0.06] text-neutral-200"
                  }`}
                >
                  {!mine && !isBot && (
                    <p className="mb-0.5 text-[10px] font-semibold text-violet-300">
                      {m.playerName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words leading-snug">
                    {m.text}
                  </p>
                  <p
                    className={`mt-0.5 text-right text-[9px] ${
                      mine ? "text-white/60" : "text-neutral-500"
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
          className="mx-auto -mt-2 mb-1 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-0.5 text-[11px] font-bold text-violet-200"
        >
          {unread} new
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-300">
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
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-violet-400/60"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              className="shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-neutral-500">
            {draft.length}/{MAX_CHAT_LENGTH} · try{" "}
            <span className="font-mono text-neutral-400">/rules</span> or{" "}
            <span className="font-mono text-neutral-400">@bot</span> for the AI announcer
          </p>
        </>
      ) : (
        <p className="mt-3 text-center text-[11px] text-neutral-500">
          Join the room to chat.
        </p>
      )}
    </div>
  );
}
