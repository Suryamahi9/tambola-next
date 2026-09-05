"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  audioLanguages,
  voiceTones,
  type AudioLang,
  type VoiceTone,
} from "@/lib/site";

const SAVE_KEY = "tambola-game-v2";

interface Particle {
  id: number;
  cx: string;
  cy: string;
  cr: string;
  cd: string;
  color: string;
}

interface GameState {
  mode: "manual" | "auto";
  language: AudioLang;
  tone: VoiceTone;
  speed: number;
  calledNumbers: number[];
  lastNumber: number | null;
}

const DEFAULT_STATE: GameState = {
  mode: "manual",
  language: "en-IN",
  tone: "natural",
  speed: 4000,
  calledNumbers: [],
  lastNumber: null,
};

const BURST_COLORS = [
  "#7c3aed",
  "#d946ef",
  "#22d3ee",
  "#34d399",
  "#facc15",
  "#fb7185",
  "#60a5fa",
];

function makeBurst(seed: number): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + (seed % 7) * 0.15;
    const dist = 60 + Math.random() * 90;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist - 20;
    parts.push({
      id: seed * 100 + i,
      cx: `${Math.round(x)}px`,
      cy: `${Math.round(y)}px`,
      cr: `${Math.round(Math.random() * 540 - 270)}deg`,
      cd: `${Math.round(Math.random() * 120)}ms`,
      color: BURST_COLORS[i % BURST_COLORS.length],
    });
  }
  return parts;
}

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

function speakNumber(num: number, lang: AudioLang, tone: VoiceTone): boolean {
  const toneSpec = voiceTones.find((t) => t.value === tone) ?? voiceTones[0];
  if (lang === "hi-IN" || lang === "te-IN") {
    const sub = lang === "hi-IN" ? "hi" : "te";
    const audio = new Audio(`/audio/${sub}/${num}.mp3`);
    audio.play().catch(() => false);
    return true;
  }
  if (!("speechSynthesis" in window)) return false;
  const utterance = new SpeechSynthesisUtterance(String(num));
  utterance.lang = lang;
  utterance.rate = toneSpec.rate;
  utterance.pitch = toneSpec.pitch;
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  window.setTimeout(() => speechSynthesis.speak(utterance), 200);
  return true;
}

const LANG_NAMES: Record<AudioLang, string> = {
  "en-IN": "English (India)",
  "hi-IN": "Hindi",
  "te-IN": "Telugu",
};

const TONE_NAMES: Record<VoiceTone, string> = {
  natural: "Natural",
  deep: "Deep",
  bright: "Bright",
  quick: "Quick",
};

function buildReportText(state: GameState) {
  const status = state.calledNumbers.length >= 90 ? "Game Over" : "In Progress";
  return {
    meta: [
      `Mode: ${state.mode === "auto" ? "Auto" : "Manual"}`,
      `Voice: ${LANG_NAMES[state.language]} · ${TONE_NAMES[state.tone]}`,
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lastKey, setLastKey] = useState(0);

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
    setLastKey((k) => k + 1);
    setParticles(makeBurst(num));
    if (!speakNumber(num, s.language, s.tone)) setAudioOk(false);
  }, [showToast]);

  const announceNumber = useCallback((num: number) => {
    const s = stateRef.current;
    if (num < 1 || num > 90) return;
    if (!speakNumber(num, s.language, s.tone)) setAudioOk(false);
  }, []);

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
      `Voice: ${LANG_NAMES[s.language]} · ${TONE_NAMES[s.tone]}`,
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
    setState({
      ...DEFAULT_STATE,
      mode: stateRef.current.mode,
      language: stateRef.current.language,
      tone: stateRef.current.tone,
      speed: stateRef.current.speed,
    });
    setParticles([]);
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

  const recentNumbers = state.calledNumbers.slice(-5).reverse();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* LEFT: command deck + showcase + board */}
      <div className="flex flex-col gap-6">

        {/* ── COMMAND DECK ── */}
        <section className="relative w-full bg-surface-container/90 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl overflow-hidden">
          {/* ambient glow */}
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5">

            {/* Left: status + mode segmented control */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Status pill */}
              <div className="flex items-center gap-3 bg-surface-container-lowest/80 px-4 py-2.5 rounded-xl shadow-inner">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                </span>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary uppercase tracking-tight">
                    {status}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">timer</span>
                    <span className="text-secondary font-ticket-digit">
                      {state.calledNumbers.length}/90
                    </span>
                    called
                  </span>
                </div>
              </div>

              {/* Mode segmented control */}
              <div className="flex items-center bg-surface-container-low p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setState((p) => ({ ...p, mode: "auto" }))}
                  className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                    state.mode === "auto"
                      ? "bg-primary text-on-primary-container font-bold shadow-md"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">autorenew</span>
                  Auto Draw
                </button>
                <button
                  type="button"
                  onClick={() => setState((p) => ({ ...p, mode: "manual" }))}
                  className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                    state.mode === "manual"
                      ? "bg-primary text-on-primary-container font-bold shadow-md"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">touch_app</span>
                  Manual
                </button>
                {state.mode === "auto" && (
                  <select
                    value={state.speed}
                    onChange={(e) => setState((p) => ({ ...p, speed: Number(e.target.value) }))}
                    className="ml-2 rounded-lg border border-outline-variant/40 bg-surface-container-high px-3 py-1.5 text-sm font-semibold text-on-surface outline-none focus:border-primary font-label-md"
                  >
                    <option value={8000}>Slow (8s)</option>
                    <option value={6000}>Normal (6s)</option>
                    <option value={4000}>Fast (4s)</option>
                    <option value={2500}>Turbo (2.5s)</option>
                  </select>
                )}
              </div>
            </div>

            {/* Center: Draw button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={state.mode === "auto" ? toggleAuto : callNext}
                disabled={state.mode === "manual" && state.calledNumbers.length >= 90}
                className="relative group px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-container via-primary-fixed-dim to-primary text-on-primary-container font-headline-sm text-headline-sm font-bold shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-40"
              >
                <span className="absolute inset-0 rounded-xl bg-primary/40 blur-xl group-hover:blur-2xl transition-all -z-10" />
                <span className="material-symbols-outlined text-2xl text-on-primary-container">
                  {state.mode === "auto" && autoRunning ? "pause_circle" : "casino"}
                </span>
                <span>
                  {state.mode === "auto"
                    ? autoRunning
                      ? "PAUSE AUTO"
                      : "START AUTO"
                    : "DRAW NEXT NUMBER"}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest/40 font-label-sm text-label-sm text-on-primary-container tracking-wider uppercase">
                  SPACE
                </span>
              </button>
            </div>

            {/* Right: voice + tone + utilities */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Voice selector */}
              <div className="flex items-center gap-2 bg-surface-container-lowest/80 px-3 py-2 rounded-xl">
                <span className="material-symbols-outlined text-tertiary text-lg">record_voice_over</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">Caller Voice</span>
                  <select
                    value={state.language}
                    onChange={(e) => setState((p) => ({ ...p, language: e.target.value as AudioLang }))}
                    className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
                  >
                    {audioLanguages.map((l) => (
                      <option key={l.value} value={l.value} className="bg-surface-container text-on-surface">
                        {l.flag} {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tone pills */}
              <div className="hidden sm:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
                {voiceTones.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setState((p) => ({ ...p, tone: t.value }))}
                    className={`px-2 py-1 rounded font-label-sm text-label-sm transition-all ${
                      state.tone === t.value
                        ? "bg-surface-container-high text-primary font-semibold"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Repeat last + Copy */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={repeatLast}
                  className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                  title="Repeat last number"
                >
                  <span className="material-symbols-outlined text-xl text-primary">replay</span>
                </button>
                <button
                  type="button"
                  onClick={copyCalled}
                  className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                  title="Copy called numbers"
                >
                  <span className="material-symbols-outlined text-xl text-secondary">download</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SHOWCASE: last number + stats + reel ── */}
        <div className="w-full bg-surface-container-low rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -right-16 -top-16 w-60 h-60 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left: glowing sphere */}
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center">
              {/* Ripple rings */}
              <div className="absolute w-36 h-36 rounded-full bg-primary/20 animate-ping opacity-60 pointer-events-none" />
              <div className="absolute w-44 h-44 rounded-full bg-primary-container/10 blur-md pointer-events-none" />
              {/* Particle burst */}
              {state.lastNumber !== null && particles.length > 0 && (
                <>
                  <span className="animate-glow-ring pointer-events-none absolute inset-0 mx-auto my-auto block h-24 w-24 rounded-full border-2 border-primary/80" />
                  {particles.map((p) => (
                    <span
                      key={p.id}
                      className="confetti-particle"
                      style={
                        {
                          left: "50%",
                          top: "50%",
                          background: p.color,
                          "--cx": p.cx,
                          "--cy": p.cy,
                          "--cr": p.cr,
                          "--cd": p.cd,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </>
              )}
              {/* 3D sphere card */}
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary-fixed via-primary-container to-amber-900 shadow-2xl flex flex-col items-center justify-center text-center p-2">
                {/* specular highlight */}
                <div className="absolute top-2 left-6 w-10 h-5 bg-white/40 rounded-full blur-[2px] transform -rotate-45" />
                <p
                  key={state.lastNumber ?? "none"}
                  className="animate-slot-flip font-caller-announcement text-caller-announcement text-on-primary-container font-black tracking-tight drop-shadow-md leading-none select-none"
                >
                  {state.lastNumber ?? "–"}
                </p>
                <span className="font-label-sm text-[9px] font-bold text-on-primary-container/80 tracking-widest uppercase mt-0.5">
                  BALL DRAWN
                </span>
              </div>
            </div>

            {/* Stats + repeat */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">campaign</span>
                  Voice Readout
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                  #{state.calledNumbers.length}
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface leading-tight tracking-tight">
                Last Number
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {state.lastNumber !== null
                  ? `${LANG_NAMES[state.language]} · ${TONE_NAMES[state.tone]}`
                  : "Ready for first ball"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={repeatLast}
                  className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm text-primary">replay</span>
                  Repeat Audio
                </button>
                <span className="flex items-center gap-0.5 text-secondary">
                  <span className="w-1 h-3 bg-secondary rounded animate-pulse" />
                  <span className="w-1 h-5 bg-secondary rounded animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-2 bg-secondary rounded animate-pulse" style={{ animationDelay: "300ms" }} />
                  <span className="w-1 h-4 bg-secondary rounded animate-pulse" style={{ animationDelay: "450ms" }} />
                </span>
              </div>
            </div>
          </div>

          {/* Right: draw reel + progress */}
          <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-4 min-w-[280px]">
            <div className="flex flex-col w-full md:items-end">
              <div className="flex items-center justify-between md:justify-end gap-3 w-full mb-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Draw Reel (Last 5)
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-mono font-semibold">
                  {state.calledNumbers.length}/90
                </span>
              </div>
              <div className="flex items-center gap-2">
                {recentNumbers.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/60 font-body-sm">
                    No draws yet
                  </p>
                ) : (
                  recentNumbers.map((num, i) => (
                    <div
                      key={`${num}-${i}`}
                      className={`w-11 h-11 rounded-xl shadow-md flex items-center justify-center font-ticket-digit text-ticket-digit font-bold transition-all ${
                        i === 0
                          ? "bg-surface-container-highest text-primary"
                          : "bg-surface-container-high text-on-surface"
                      }`}
                    >
                      {num}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Board Saturation</span>
                <span className="text-primary font-bold font-mono">
                  {state.calledNumbers.length} / 90 ({((state.calledNumbers.length / 90) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-container-lowest rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-secondary via-primary to-primary-container rounded-full transition-all duration-500"
                  style={{ width: `${(state.calledNumbers.length / 90) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── MASTER BOARD ── */}
        <div className="w-full bg-surface-container/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">grid_on</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Master Tambola Board (1 – 90)
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gradient-to-br from-primary via-primary-container to-amber-700 shadow-sm" />
                <span className="text-on-surface-variant">Drawn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-secondary shadow-sm" />
                <span className="text-on-surface-variant">Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface-container-highest" />
                <span className="text-on-surface-variant">Uncalled</span>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div
            key={lastKey}
            className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 sm:gap-2 lg:grid-cols-10 min-w-0 select-none"
          >
            {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
              const called = calledSet.has(num);
              const isLast = state.lastNumber === num;
              return (
                <div
                  key={num}
                  className={`flex aspect-square items-center justify-center rounded-lg font-ticket-digit text-ticket-digit font-bold transition-all duration-200 ${
                    isLast
                      ? "animate-board-pop bg-secondary text-on-secondary-container shadow-lg shadow-secondary/30 scale-105 z-10 ring-2 ring-white/50"
                      : called
                        ? "bg-gradient-to-br from-primary-fixed via-primary-container to-amber-700 text-on-primary-container shadow-sm"
                        : "bg-surface-container-high/60 text-on-surface-variant/40 hover:bg-surface-container-highest hover:text-on-surface"
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>

          {/* Micro toolbar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-on-surface-variant pt-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="font-bold text-primary">{90 - state.calledNumbers.length}</span> Balls Remaining
              </span>
              <span className="w-1 h-1 rounded-full bg-surface-container-highest" />
              <span className="flex items-center gap-1">
                <span className="font-bold text-secondary">{state.calledNumbers.length}</span> Drawn
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const uncalledEls = document.querySelectorAll<HTMLElement>("[data-uncalled-flash]");
                  uncalledEls.forEach((el) => {
                    el.classList.add("bg-primary/20", "text-primary");
                    setTimeout(() => el.classList.remove("bg-primary/20", "text-primary"), 1200);
                  });
                }}
                className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors"
              >
                Flash Uncalled
              </button>
            </div>
          </div>
        </div>

        {/* ── AUDIO WARNING ── */}
        {!audioOk && (
          <p className="rounded-xl bg-error-container/20 px-4 py-3 text-xs text-error font-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">volume_off</span>
            Audio unavailable on this device. English voice and Hindi/Telugu
            recordings need a modern browser.
          </p>
        )}

        {/* ── REPORT ROW ── */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={downloadTxt}
            className="rounded-full border border-outline-variant/40 px-5 py-2.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Report (.txt)
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            className="rounded-full border border-outline-variant/40 px-5 py-2.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Report (PDF)
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-full border border-error/40 px-5 py-2.5 text-xs font-semibold text-error transition hover:bg-error-container/20 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Reset Game
          </button>
        </div>
      </div>

      {/* RIGHT: history + shortcuts */}
      <div className="space-y-6">
        <div className="w-full bg-surface-container/90 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">history</span>
            Last Called
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.calledNumbers.length === 0 ? (
              <p className="text-sm text-on-surface-variant font-body-sm">
                No numbers called yet. Press Draw to start!
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
                    className={`animate-chip-in inline-flex h-9 w-9 items-center justify-center rounded-lg font-ticket-digit text-ticket-digit font-bold transition hover:scale-105 ${
                      i === 0
                        ? "bg-primary text-on-primary-container"
                        : "bg-surface-container-high text-on-surface hover:bg-primary/20 hover:text-primary"
                    }`}
                  >
                    {num}
                  </button>
                ))
            )}
          </div>
        </div>

        <div className="w-full bg-surface-container/90 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">keyboard</span>
            Shortcuts
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
            <li className="flex items-center justify-between">
              <span>Next number / start-pause auto</span>
              <kbd className="rounded-md border border-outline-variant/40 bg-surface-container-high px-2 py-1 text-xs font-semibold font-label-sm text-on-surface">
                Space
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Repeat last number</span>
              <kbd className="rounded-md border border-outline-variant/40 bg-surface-container-high px-2 py-1 text-xs font-semibold font-label-sm text-on-surface">
                L
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Reset game</span>
              <kbd className="rounded-md border border-outline-variant/40 bg-surface-container-high px-2 py-1 text-xs font-semibold font-label-sm text-on-surface">
                R
              </kbd>
            </li>
          </ul>
        </div>
      </div>

      {/* ── RESET MODAL ── */}
      {confirmReset && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmReset(false)}
        >
          <div
            className="glass w-full max-w-sm rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Reset the game?
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              This clears all called numbers and starts a fresh game. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-full border border-outline-variant/40 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="flex-1 rounded-full bg-error-container px-5 py-2.5 text-sm font-semibold text-on-error-container transition hover:brightness-110"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-surface-container-high px-5 py-3 text-sm font-medium text-on-surface shadow-2xl backdrop-blur-xl border border-outline-variant/30">
          {toast}
        </div>
      )}
    </div>
  );
}
