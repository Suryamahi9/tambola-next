"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioLanguages, type AudioLang } from "@/lib/site";

const SAVE_KEY = "tambola-game-v2";

interface GameState {
  mode: "manual" | "auto";
  language: AudioLang;
  speed: number;
  calledNumbers: number[];
  lastNumber: number | null;
}

const DEFAULT_STATE: GameState = {
  mode: "manual",
  language: "en-IN",
  speed: 4000,
  calledNumbers: [],
  lastNumber: null,
};

function loadState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GameState;
    if (!Array.isArray(data.calledNumbers)) return null;
    return {
      ...DEFAULT_STATE,
      ...data,
      lastNumber: data.lastNumber ?? null,
    };
  } catch {
    return null;
  }
}

function speakNumber(num: number, lang: AudioLang): boolean {
  const audio = new Audio(`/audio/${lang === "hi-IN" ? "hi" : "te"}/${num}.mp3`);
  if (lang === "hi-IN" || lang === "te-IN") {
    audio.play().catch(() => false);
    return true;
  }
  if (!("speechSynthesis" in window)) return false;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(num));
  utterance.lang = lang;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
  return true;
}

const LANG_NAMES: Record<AudioLang, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "te-IN": "Telugu",
};

function buildReportText(state: GameState) {
  const status = state.calledNumbers.length >= 90 ? "Game Over" : "In Progress";
  return {
    meta: [
      `Mode: ${state.mode === "auto" ? "Auto" : "Manual"}`,
      `Audio Language: ${LANG_NAMES[state.language]}`,
      `Status: ${status}`,
    ],
    stats: [
      `Numbers Called: ${state.calledNumbers.length} / 90`,
      `Remaining: ${90 - state.calledNumbers.length}`,
      `Last Number: ${state.lastNumber ?? "—"}`,
    ],
    numbers: state.calledNumbers.join(", "),
  };
}

export default function Caller() {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [autoRunning, setAutoRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [audioOk, setAudioOk] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Restore a saved game after mount so server and client first renders match.
  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    const id = window.requestAnimationFrame(() => setState(saved));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const callNext = useCallback(() => {
    const s = stateRef.current;
    if (s.calledNumbers.length >= 90) {
      showToast("🏆 Game Over! Full house called!");
      return;
    }
    const calledSet = new Set(s.calledNumbers);
    const remaining = Array.from({ length: 90 }, (_, i) => i + 1).filter(
      (n) => !calledSet.has(n)
    );
    const num = remaining[Math.floor(Math.random() * remaining.length)];
    setState((prev) => ({
      ...prev,
      calledNumbers: [...prev.calledNumbers, num],
      lastNumber: num,
    }));
    if (!speakNumber(num, s.language)) setAudioOk(false);
  }, [showToast]);

  const announceNumber = useCallback((num: number) => {
    const s = stateRef.current;
    if (num < 1 || num > 90) return;
    if (!speakNumber(num, s.language)) setAudioOk(false);
  }, []);

  const undoLast = useCallback(() => {
    const s = stateRef.current;
    if (s.calledNumbers.length === 0) {
      showToast("Nothing to undo");
      return;
    }
    setState((prev) => {
      const called = [...prev.calledNumbers];
      called.pop();
      return { ...prev, calledNumbers: called, lastNumber: called[called.length - 1] ?? null };
    });
    showToast("Last call undone");
  }, [showToast]);

  const toggleAuto = useCallback(() => {
    const s = stateRef.current;
    if (autoRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setAutoRunning(false);
      return;
    }
    if (s.calledNumbers.length >= 90) {
      showToast("Game over — reset to play again");
      return;
    }
    setAutoRunning(true);
    callNext();
    timerRef.current = setInterval(() => {
      const cur = stateRef.current;
      if (cur.calledNumbers.length >= 90) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setAutoRunning(false);
        showToast("🏆 Game Over! Full house called!");
        return;
      }
      callNext();
    }, s.speed);
  }, [autoRunning, callNext, showToast]);

  const stopAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setAutoRunning(false);
  }, []);

  useEffect(() => () => stopAuto(), [stopAuto]);

  const repeatLast = useCallback(() => {
    const s = stateRef.current;
    if (s.lastNumber === null) {
      showToast("No number called yet");
      return;
    }
    announceNumber(s.lastNumber);
  }, [announceNumber, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        const s = stateRef.current;
        if (s.mode === "auto") toggleAuto();
        else callNext();
      }
      if (e.code === "KeyR") setConfirmReset(true);
      if (e.code === "KeyU" || e.code === "KeyZ") undoLast();
      if (e.code === "KeyL") repeatLast();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyCalled = useCallback(() => {
    const s = stateRef.current;
    if (s.calledNumbers.length === 0) {
      showToast("No numbers called yet");
      return;
    }
    navigator.clipboard
      .writeText(s.calledNumbers.join(", "))
      .then(() => showToast(`Copied ${s.calledNumbers.length} numbers`))
      .catch(() => showToast("Copy failed — select manually"));
  }, [showToast]);

  const downloadTxt = useCallback(() => {
    const s = stateRef.current;
    if (s.calledNumbers.length === 0) {
      showToast("No numbers called yet");
      return;
    }
    const lines = [
      "=======================================",
      "          TAMBOLA GAME REPORT",
      "=======================================",
      "",
      `Generated: ${new Date().toLocaleString()}`,
      `Mode: ${s.mode === "auto" ? "Auto" : "Manual"}`,
      `Audio Language: ${LANG_NAMES[s.language]}`,
      `Status: ${s.calledNumbers.length >= 90 ? "Game Over" : "In Progress"}`,
      "",
      `Numbers Called: ${s.calledNumbers.length} / 90`,
      `Remaining: ${90 - s.calledNumbers.length}`,
      `Last Number: ${s.lastNumber ?? "—"}`,
      "",
      "Called Numbers (in order):",
      s.calledNumbers.join(", "),
      "",
      "=======================================",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambola-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Report downloaded");
  }, [showToast]);

  const downloadPdf = useCallback(async () => {
    const s = stateRef.current;
    if (s.calledNumbers.length === 0) {
      showToast("No numbers called yet");
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;

      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, pageWidth, 34, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("TAMBOLA GAME REPORT", pageWidth / 2, 16, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), pageWidth / 2, 25, { align: "center" });

      const { meta, stats, numbers } = buildReportText(s);

      let y = 46;
      doc.setTextColor(30, 27, 46);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Game Details", margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      meta.forEach((line) => {
        doc.text(line, margin, y);
        y += 6;
      });

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Statistics", margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      stats.forEach((line) => {
        doc.text(line, margin, y);
        y += 6;
      });

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Called Numbers (in order)", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(numbers, contentWidth);
      wrapped.forEach((line: string) => {
        if (y > 285) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6;
      });

      doc.save(`tambola-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("PDF report downloaded");
    } catch {
      showToast("PDF unavailable — use Download Report instead");
    }
  }, [showToast]);

  const resetGame = useCallback(() => {
    stopAuto();
    setState({ ...DEFAULT_STATE, mode: stateRef.current.mode, language: stateRef.current.language, speed: stateRef.current.speed });
    setConfirmReset(false);
    showToast("Game reset");
  }, [stopAuto, showToast]);

  const status = state.calledNumbers.length >= 90
    ? "Game Over"
    : autoRunning
      ? "Auto Running"
      : state.calledNumbers.length > 0
        ? "In Progress"
        : "Ready";

  const calledSet = new Set(state.calledNumbers);

  const decadeStats = (() => {
    const buckets: { label: string; total: number; called: number; remaining: number[] }[] = [];
    for (let b = 0; b <= 8; b++) {
      const lo = b === 0 ? 1 : b * 10;
      const hi = b === 8 ? 90 : b * 10 + 9;
      const all: number[] = [];
      for (let n = lo; n <= hi; n++) all.push(n);
      const remaining = all.filter((n) => !calledSet.has(n));
      buckets.push({
        label: b === 0 ? "1–9" : `${lo}–${hi}`,
        total: all.length,
        called: all.length - remaining.length,
        remaining,
      });
    }
    return buckets;
  })();
  const hotDecade =
    decadeStats.reduce((a, b) => (b.remaining.length < a.remaining.length ? b : a), decadeStats[0]);
  const longestRun = (() => {
    let best = 0;
    let cur = 0;
    for (let n = 1; n <= 90; n++) {
      if (calledSet.has(n)) {
        cur++;
        best = Math.max(best, cur);
      } else cur = 0;
    }
    return best;
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* LEFT: controls + last number + board */}
      <div>
        <div className="glass rounded-2xl border border-white/10 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setState((p) => ({ ...p, mode: "manual" }))}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  state.mode === "manual"
                    ? "bg-violet-600 text-white"
                    : "text-neutral-600 dark:text-neutral-300"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setState((p) => ({ ...p, mode: "auto" }))}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  state.mode === "auto"
                    ? "bg-violet-600 text-white"
                    : "text-neutral-600 dark:text-neutral-300"
                }`}
              >
                Auto
              </button>
            </div>

            {state.mode === "auto" && (
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                Speed
                <select
                  value={state.speed}
                  onChange={(e) => setState((p) => ({ ...p, speed: Number(e.target.value) }))}
                  className="rounded-lg border border-white/15 bg-[#0b0d1a] px-3 py-1.5 text-sm font-semibold text-neutral-100 outline-none focus:border-violet-500"
                >
                  <option value={8000}>Slow (8s)</option>
                  <option value={6000}>Normal (6s)</option>
                  <option value={4000}>Fast (4s)</option>
                  <option value={2500}>Turbo (2.5s)</option>
                </select>
              </label>
            )}

            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              Voice
              <select
                value={state.language}
                onChange={(e) => setState((p) => ({ ...p, language: e.target.value as AudioLang }))}
                className="rounded-lg border border-white/15 bg-[#0b0d1a] px-3 py-1.5 text-sm font-semibold text-neutral-100 outline-none focus:border-violet-500"
              >
                {audioLanguages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex items-center gap-6">
            <div className="flex-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Last Number
              </p>
              <p
                key={state.lastNumber ?? "none"}
                className="animate-pop mt-1 font-display text-6xl font-bold text-transparent sm:text-7xl"
                style={{
                  backgroundImage: "linear-gradient(135deg, #7c3aed, #d946ef)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                {state.lastNumber ?? "–"}
              </p>
            </div>
            <div className="h-16 w-px bg-neutral-200 dark:bg-neutral-800" />
            <div className="grid flex-1 grid-cols-2 gap-3">
              <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/60">
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {state.calledNumbers.length} / 90
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Called
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/60">
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {90 - state.calledNumbers.length}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Remaining
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {state.mode === "manual" ? (
              <button
                type="button"
                onClick={callNext}
                disabled={state.calledNumbers.length >= 90}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-violet-600/40 transition hover:brightness-110 disabled:opacity-40"
              >
                <kbd className="rounded border border-white/30 px-1.5 text-[10px]">SPACE</kbd>
                Next Number
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleAuto}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-violet-600/40 transition hover:brightness-110"
              >
                <kbd className="rounded border border-white/30 px-1.5 text-[10px]">SPACE</kbd>
                {autoRunning ? "⏸ Pause Auto" : "⏵ Start Auto"}
              </button>
            )}
            <button
              type="button"
              onClick={undoLast}
              disabled={state.calledNumbers.length === 0}
              className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200"
            >
              ↩ Undo
            </button>
            <button
              type="button"
              onClick={repeatLast}
              className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-200"
            >
              🔁 Repeat
            </button>
            <button
              type="button"
              onClick={copyCalled}
              className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-200"
            >
              📋 Copy
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={downloadTxt}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-200"
            >
              ⬇ Report (.txt)
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:border-violet-500 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-200"
            >
              ⬇ Report (PDF)
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="rounded-full border border-red-300 px-5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Reset Game
            </button>
          </div>

          {!audioOk && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              ⚠️ Audio unavailable on this device. English voice and Hindi/Telugu
              recordings need a modern browser.
            </p>
          )}
        </div>

        {/* BOARD */}
        <div className="glass mt-6 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-neutral-100">
              Number Board
            </h2>
            <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-semibold text-violet-300">
              {status}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2 lg:grid-cols-10">
            {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
              const called = calledSet.has(num);
              const isLast = state.lastNumber === num;
              return (
                <div
                  key={num}
                  className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold transition ${
                    isLast
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white ring-2 ring-violet-400 ring-offset-1 ring-offset-neutral-900"
                      : called
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: history + hints */}
      <div className="space-y-6">
        <div className="glass rounded-2xl border border-white/10 p-5">
          <h3 className="font-display text-lg font-bold text-neutral-100">
            Last Called
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.calledNumbers.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No numbers called yet. Press Next Number to start!
              </p>
            ) : (
              state.calledNumbers
                .slice(-18)
                .reverse()
                .map((num, i) => (
                  <button
                    key={`${num}-${i}`}
                    type="button"
                    onClick={() => announceNumber(num)}
                    title={`Announce ${num} again`}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition hover:scale-105 ${
                      i === 0
                        ? "bg-violet-600 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-violet-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-violet-900/40"
                    }`}
                  >
                    {num}
                  </button>
                ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-neutral-100">
              Numbers to Watch
            </h3>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              {hotDecade.label} · {hotDecade.remaining.length} left
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            The decade with the fewest numbers called so far — keep an eye on it.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {hotDecade.remaining.length === 0 ? (
              <p className="text-sm text-neutral-500">All caught up — nothing to watch!</p>
            ) : (
              hotDecade.remaining.map((n) => (
                <span
                  key={n}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {n}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-5">
          <h3 className="font-display text-lg font-bold text-neutral-100">
            Game Stats
          </h3>
          <div className="mt-4 space-y-3">
            {decadeStats.map((b) => {
              const pct = Math.round((b.called / b.total) * 100);
              return (
                <div key={b.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-300">{b.label}</span>
                    <span className="text-neutral-500">
                      {b.called}/{b.total}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/60">
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{longestRun}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Longest run
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/60">
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {state.calledNumbers.length > 0 ? Math.round((state.calledNumbers.length / 90) * 100) : 0}%
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Board covered
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-5">
          <h3 className="font-display text-lg font-bold text-neutral-100">
            Shortcuts
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
            <li className="flex items-center justify-between">
              <span>Next number / start-pause auto</span>
              <kbd className="rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800">
                Space
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Repeat last number</span>
              <kbd className="rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800">
                L
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Undo last call</span>
              <kbd className="rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800">
                U
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Reset game</span>
              <kbd className="rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800">
                R
              </kbd>
            </li>
          </ul>
        </div>
      </div>

      {confirmReset && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmReset(false)}
        >
          <div
            className="glass w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-bold text-neutral-100">
              Reset the game?
            </h3>
            <p className="mt-2 text-sm text-neutral-400">
              This clears all called numbers and starts a fresh game. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-violet-400 hover:text-violet-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="flex-1 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Reset
              </button>
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
