"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  audioLanguages,
  voiceTones,
  type AudioLang,
  type VoiceTone,
} from "@/lib/site";
import {
  isPackLang,
  preloadVoicePack,
  recordedDuration,
  speakRecorded,
  type PackLang,
} from "@/lib/voice";

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
  /** "" = studio recording for Hindi/Telugu, device default elsewhere. */
  voiceURI: string;
  /** 0.5–2 spoken/recording pitch. 1 = the voice's natural pitch. */
  pitch: number;
  tone: VoiceTone;
  speed: number;
  calledNumbers: number[];
  lastNumber: number | null;
  nickname: string;
  tag: string;
  voiceCuesOn: boolean;
  wheelMode: boolean;
  heatmap: boolean;
}

function randomTag(): string {
  return `#${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
}

const DEFAULT_STATE: GameState = {
  mode: "manual",
  language: "en-IN",
  voiceURI: "",
  pitch: 1,
  tone: "natural",
  speed: 4000,
  calledNumbers: [],
  lastNumber: null,
  nickname: "Host",
  // Empty on the server; a random session tag is assigned after mount so the
  // server and client first renders match (avoids a hydration mismatch).
  tag: "",
  voiceCuesOn: false,
  wheelMode: false,
  heatmap: false,
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
      voiceCuesOn: false,
      lastNumber: data.lastNumber ?? null,
    };
  } catch {
    return null;
  }
}

/** Studio recording instead of TTS: Hindi/Telugu packs until a system voice is picked. */
function usesRecording(lang: AudioLang, voiceURI: string): lang is PackLang {
  return isPackLang(lang) && voiceURI === "";
}

/** Resolve a saved voiceURI against the (lazily populated) voice list. */
function voiceFor(voiceURI: string): SpeechSynthesisVoice | null {
  if (!voiceURI || !("speechSynthesis" in window)) return null;
  return (
    window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI) ??
    null
  );
}

function speakNumber(
  num: number,
  lang: AudioLang,
  tone: VoiceTone,
  voiceURI: string,
  pitch: number
): boolean {
  const toneSpec = voiceTones.find((t) => t.value === tone) ?? voiceTones[0];
  if (usesRecording(lang, voiceURI)) return speakRecorded(lang, num, pitch);
  if (!("speechSynthesis" in window)) return false;
  const utterance = new SpeechSynthesisUtterance(String(num));
  utterance.lang = lang;
  utterance.rate = toneSpec.rate;
  utterance.pitch = pitch;
  const voice = voiceFor(voiceURI);
  if (voice) utterance.voice = voice;
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  window.setTimeout(() => speechSynthesis.speak(utterance), 200);
  return true;
}

/** Phrase spoken after the number itself (Smart voice cues), queued behind it. */
function speakPhrase(
  text: string,
  lang: AudioLang,
  tone: VoiceTone,
  pitch: number,
  delayMs = 1300,
  voiceURI = ""
) {
  if (!("speechSynthesis" in window)) return;
  const toneSpec = voiceTones.find((t) => t.value === tone) ?? voiceTones[0];
  const voice = voiceFor(voiceURI);
  window.setTimeout(() => {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = toneSpec.rate;
    u.pitch = pitch;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }, delayMs);
}

/** Contextual line announced after milestones. Returns null when silent. */
function cueFor(len: number, lang: AudioLang): string | null {
  if (len >= 90) return lang === "hi-IN" ? "Full house! Game over." : lang === "te-IN" ? "Full house! Aame aipoyindi." : "Full house! That's the game.";
  if (len === 89) return lang === "hi-IN" ? "Antim ball!" : lang === "te-IN" ? "Chivari ball!" : "Last ball!";
  if (len === 5) return lang === "hi-IN" ? "Jaldi five!" : lang === "te-IN" ? "Toli aidu!" : "Early five!";
  if (len === 10) return lang === "hi-IN" ? "Das ho gaye!" : lang === "te-IN" ? "Padi aipoyayi!" : "Ten called!";
  if (len === 45) return lang === "hi-IN" ? "Adhe chalis!" : lang === "te-IN" ? "Nalabhai atrai!" : "Forty-five — halfway past!";
  if (len === 50) return lang === "hi-IN" ? "Pachas! Adha ghar baaki." : lang === "te-IN" ? "Yabhai! Sagam aipoyindi." : "Fifty! Halfway there.";
  if (len % 10 === 0) {
    return lang === "hi-IN" ? `${len} ho gaye!` : lang === "te-IN" ? `${len} aipoyayi!` : `${len} called!`;
  }
  return null;
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

/** Short label for whatever voice is currently active. */
function voiceLabel(state: GameState): string {
  if (usesRecording(state.language, state.voiceURI)) return "Studio Recording";
  const v = voiceFor(state.voiceURI);
  return v ? v.name : "Device default";
}

function buildReportText(state: GameState) {
  const status = state.calledNumbers.length >= 90 ? "Game Over" : "In Progress";
  return {
    meta: [
      `Caller: ${state.nickname.trim() || "Host"} ${state.tag}`,
      `Mode: ${state.mode === "auto" ? "Auto" : "Manual"}`,
      `Voice: ${LANG_NAMES[state.language]} · ${voiceLabel(state)} · ${TONE_NAMES[state.tone]} · Pitch ${state.pitch.toFixed(2)}x`,
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
  const [spinNum, setSpinNum] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  const spinTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Restore a saved game after mount so server and client first renders match.
  useEffect(() => {
    const saved = loadState();
    const id = window.requestAnimationFrame(() =>
      setState(
        saved
          ? { ...saved, tag: saved.tag || randomTag() }
          : { ...DEFAULT_STATE, tag: randomTag() }
      )
    );
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Warm the recorded number packs (Hindi + Telugu) into memory so a draw
  // speaks on the same tick instead of waiting on a per-number fetch.
  useEffect(() => {
    preloadVoicePack("te-IN");
    preloadVoicePack("hi-IN");
  }, []);

  // Device voices arrive asynchronously (Chrome), so keep the list fresh.
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener("voiceschanged", load);
    const t1 = window.setTimeout(load, 400);
    const t2 = window.setTimeout(load, 1500);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Voices for the active language first, everything else after, so every
  // language (recorded packs included) can still switch to any installed voice.
  const { voiceMatch, voiceRest, voiceKnown } = useMemo(() => {
    const prefix = state.language.slice(0, 2).toLowerCase();
    const match: SpeechSynthesisVoice[] = [];
    const rest: SpeechSynthesisVoice[] = [];
    const seen = new Set<string>();
    for (const v of voices) {
      // Some platforms list the same voice more than once; keep the first so
      // the selector's option keys stay unique.
      if (seen.has(v.voiceURI)) continue;
      seen.add(v.voiceURI);
      const ok = v.lang.replace("_", "-").toLowerCase().startsWith(prefix);
      (ok ? match : rest).push(v);
    }
    return {
      voiceMatch: match,
      voiceRest: rest,
      voiceKnown: seen,
    };
  }, [voices, state.language]);

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

  /** Commit a drawn number to state + voice cues. */
  const commitNumber = useCallback((num: number) => {
    const s = stateRef.current;
    const newLen = s.calledNumbers.length + 1;
    setState((prev) => ({
      ...prev,
      calledNumbers: [...prev.calledNumbers, num],
      lastNumber: num,
    }));
    setLastKey((k) => k + 1);
    setParticles(makeBurst(num));
    if (!speakNumber(num, s.language, s.tone, s.voiceURI, s.pitch)) setAudioOk(false);
    if (false) {
      const cue = cueFor(newLen, s.language);
      if (cue) {
        // Recorded packs: fire the cue when the clip actually ends instead of
        // guessing a fixed wait (English TTS still uses the 1300 ms default).
        // A shifted pitch also shortens/lengthens the clip, so duration follows.
        const dur = usesRecording(s.language, s.voiceURI)
          ? recordedDuration(s.language, num, s.pitch)
          : null;
        speakPhrase(cue, s.language, s.tone, s.pitch, dur ? (dur + 0.2) * 1000 : 1300, s.voiceURI);
      }
    }
  }, []);

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
    commitNumber(num);
  }, [commitNumber, showToast]);

  // Raffle wheel: spin through random numbers, land on the winner, then call it.
  const spinWheel = useCallback(() => {
    if (spinTimerRef.current) return;
    const s = stateRef.current;
    if (s.calledNumbers.length >= 90) {
      showToast("🏆 Game Over! Full house called!");
      return;
    }
    const calledSet = new Set(s.calledNumbers);
    const remaining = Array.from({ length: 90 }, (_, i) => i + 1).filter(
      (n) => !calledSet.has(n)
    );
    const final = remaining[Math.floor(Math.random() * remaining.length)];

    let ticks = 0;
    spinTimerRef.current = setInterval(() => {
      ticks += 1;
      const live = stateRef.current.calledNumbers;
      const liveSet = new Set(live);
      const pool = Array.from({ length: 90 }, (_, i) => i + 1).filter(
        (n) => !liveSet.has(n)
      );
      if (pool.length === 0) return;
      const shown =
        ticks % 5 === 0
          ? final
          : pool[Math.floor(Math.random() * pool.length)];
      setSpinNum(shown);
      if (ticks >= 5) {
        if (spinTimerRef.current) clearInterval(spinTimerRef.current);
        spinTimerRef.current = null;
        setSpinNum(final);
        spinTimeoutRef.current = window.setTimeout(() => {
          spinTimeoutRef.current = null;
          setSpinNum(null);
          commitNumber(final);
        }, 500);
      }
    }, 90);
  }, [commitNumber, showToast]);

  const announceNumber = useCallback((num: number) => {
    const s = stateRef.current;
    if (num < 1 || num > 90) return;
    if (!speakNumber(num, s.language, s.tone, s.voiceURI, s.pitch)) setAudioOk(false);
  }, []);

  /** Handler bound to the big Draw button (manual mode). */
  const drawManual = useCallback(() => {
    const s = stateRef.current;
    if (s.wheelMode) {
      spinWheel();
      return;
    }
    callNext();
  }, [spinWheel, callNext]);

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

  const clearSpin = useCallback(() => {
    if (spinTimerRef.current) clearInterval(spinTimerRef.current);
    spinTimerRef.current = null;
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = null;
    setSpinNum(null);
  }, []);

  useEffect(
    () => () => {
      stopAuto();
      clearSpin();
    },
    [stopAuto, clearSpin]
  );

  const repeatLast = useCallback(() => {
    const s = stateRef.current;
    if (s.lastNumber === null) {
      showToast("No number called yet");
      return;
    }
    announceNumber(s.lastNumber);
  }, [announceNumber, showToast]);

  const undoLast = useCallback(() => {
    const s = stateRef.current;
    if (s.calledNumbers.length === 0) {
      showToast("No numbers called yet");
      return;
    }
    const prev = s.calledNumbers.slice(0, -1);
    const newLast = prev.length > 0 ? prev[prev.length - 1] : null;
    setState((p) => ({
      ...p,
      calledNumbers: prev,
      lastNumber: newLast,
    }));
    showToast("Undid last call");
  }, [showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        const s = stateRef.current;
        if (s.mode === "auto") toggleAuto();
        else drawManual();
      }
      if (e.code === "KeyR") setConfirmReset(true);
      if (e.code === "KeyL") repeatLast();
      if (e.code === "KeyZ" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undoLast();
      }
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
      `Caller: ${s.nickname.trim() || "Host"} ${s.tag}`,
      `Mode: ${s.mode === "auto" ? "Auto" : "Manual"}`,
      `Voice: ${LANG_NAMES[s.language]} · ${voiceLabel(s)} · ${TONE_NAMES[s.tone]} · Pitch ${s.pitch.toFixed(2)}x`,
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
    clearSpin();
    setState({
      ...DEFAULT_STATE,
      mode: stateRef.current.mode,
      language: stateRef.current.language,
      voiceURI: stateRef.current.voiceURI,
      pitch: stateRef.current.pitch,
      tone: stateRef.current.tone,
      speed: stateRef.current.speed,
      tag: randomTag(),
    });
    setParticles([]);
    setConfirmReset(false);
    showToast("Game reset");
  }, [stopAuto, clearSpin, showToast]);

  const status = state.calledNumbers.length >= 90
    ? "Game Over"
    : autoRunning
      ? "Auto Running"
      : state.calledNumbers.length > 0
        ? "In Progress"
        : "Ready";

  const calledSet = new Set(state.calledNumbers);

  // Board heatmap: fraction of each decade (1–9, 10–19, …, 80–90) already drawn.
  const decadeHeat = Array.from({ length: 9 }, (_, dec) => {
    const start = dec === 0 ? 1 : dec * 10;
    const end = Math.min((dec + 1) * 10, 90);
    let called = 0;
    let total = 0;
    for (let n = start; n <= end; n++) {
      total += 1;
      if (calledSet.has(n)) called += 1;
    }
    return total === 0 ? 0 : called / total;
  });

  const recentNumbers = state.calledNumbers.slice(-5).reverse();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1fr_340px]">
      {/* LEFT: command deck + showcase + board */}
      <div className="flex min-w-0 flex-col gap-6">

        {/* ── COMMAND DECK ── */}
        <section className="relative w-full bg-surface-container/90 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl overflow-hidden">
          {/* ambient glow */}
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex min-w-0 flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5">

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

              {/* Caller identity + session tag */}
              <div className="flex items-center gap-2.5 bg-surface-container-lowest/80 px-3 py-2 rounded-xl">
                <span className="material-symbols-outlined text-tertiary text-lg">badge</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">Caller</span>
                  <input
                    value={state.nickname}
                    onChange={(e) => setState((p) => ({ ...p, nickname: e.target.value.slice(0, 24) }))}
                    className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none w-28"
                    aria-label="Caller nickname"
                  />
                </div>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-mono text-[10px] font-bold text-secondary-variant tracking-wider">
                  {state.tag}
                </span>
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
            <div className="flex min-w-0 items-center justify-center">
              <button
                type="button"
                onClick={state.mode === "auto" ? toggleAuto : drawManual}
                disabled={
                  state.mode === "manual" &&
                  (state.calledNumbers.length >= 90 || spinNum !== null)
                }
                className="relative group px-5 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-container via-primary-fixed-dim to-primary text-on-primary-container font-headline-sm text-headline-sm font-bold shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2.5 disabled:opacity-40"
              >
                <span className="absolute inset-0 rounded-xl bg-primary/40 blur-xl group-hover:blur-2xl transition-all -z-10" />
                <span className="material-symbols-outlined text-2xl text-on-primary-container">
                  {state.mode === "auto"
                    ? autoRunning
                      ? "pause_circle"
                      : "casino"
                    : state.wheelMode
                      ? "casino"
                      : "ad_units"}
                </span>
                <span>
                  {state.mode === "auto"
                    ? autoRunning
                      ? "PAUSE AUTO"
                      : "START AUTO"
                    : state.wheelMode
                      ? "SPIN WHEEL"
                      : "DRAW NEXT NUMBER"}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest/40 font-label-sm text-label-sm text-on-primary-container tracking-wider uppercase">
                  SPACE
                </span>
              </button>
            </div>

            {/* Right: voice + tone + utilities */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Voice selector: language + specific voice */}
              <div className="flex items-center gap-2 bg-surface-container-lowest/80 px-3 py-2 rounded-xl">
                <span className="material-symbols-outlined text-tertiary text-lg">record_voice_over</span>
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">Caller Voice</span>
                  <select
                    value={state.language}
                    onChange={(e) =>
                      setState((p) => ({
                        ...p,
                        language: e.target.value as AudioLang,
                        // A picked voice belongs to the language it was listed under.
                        voiceURI: "",
                      }))
                    }
                    className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
                  >
                    {audioLanguages.map((l) => (
                      <option key={l.value} value={l.value} className="bg-surface-container text-on-surface">
                        {l.flag} {l.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={state.voiceURI}
                    onChange={(e) => setState((p) => ({ ...p, voiceURI: e.target.value }))}
                    className="bg-transparent font-label-sm text-label-sm text-on-surface-variant focus:outline-none cursor-pointer max-w-[200px]"
                    aria-label="Voice"
                    title="Voice used to call the numbers"
                  >
                    <option value="" className="bg-surface-container text-on-surface">
                      {isPackLang(state.language)
                        ? "Studio recording (default)"
                        : "Device default voice"}
                    </option>
                    {state.voiceURI && !voiceKnown.has(state.voiceURI) && (
                      <option value={state.voiceURI} className="bg-surface-container text-on-surface">
                        Saved voice (loading…)
                      </option>
                    )}
                    {voiceMatch.length > 0 && (
                      <optgroup label={`${LANG_NAMES[state.language]} voices`}>
                        {voiceMatch.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI} className="bg-surface-container text-on-surface">
                            {v.name} · {v.lang}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {voiceRest.length > 0 && (
                      <optgroup label="Other installed voices">
                        {voiceRest.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI} className="bg-surface-container text-on-surface">
                            {v.name} · {v.lang}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Pitch */}
              <div className="flex items-center gap-2 bg-surface-container-lowest/80 px-3 py-2 rounded-xl">
                <span className="material-symbols-outlined text-tertiary text-lg">graphic_eq</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Pitch{" "}
                    <span className="text-secondary font-bold">{state.pitch.toFixed(2)}x</span>
                  </span>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={state.pitch}
                    onChange={(e) => setState((p) => ({ ...p, pitch: Number(e.target.value) }))}
                    onDoubleClick={() => setState((p) => ({ ...p, pitch: 1 }))}
                    className="w-28 cursor-pointer accent-primary"
                    aria-label="Voice pitch (double-click to reset)"
                    title="Voice pitch — applies to every language, recordings included. Double-click to reset."
                  />
                </div>
              </div>

              {/* Tone pills */}
              <div className="hidden sm:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
                {voiceTones.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setState((p) => ({ ...p, tone: t.value, pitch: t.pitch }))}
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
                  onClick={undoLast}
                  className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                  title="Undo last call (Ctrl+Z)"
                >
                  <span className="material-symbols-outlined text-xl text-tertiary">undo</span>
                </button>
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
                <button
                  type="button"
                  onClick={() => setState((p) => ({ ...p, wheelMode: !p.wheelMode }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    state.wheelMode
                      ? "bg-primary-container/25 text-on-primary-container ring-1 ring-primary-fixed-dim/50"
                      : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
                  }`}
                  title="Wheel / raffle draw mode"
                >
                  <span className="material-symbols-outlined text-xl">casino</span>
                </button>
                {/* Smart voice cues removed per request */}
              </div>
            </div>
          </div>
        </section>

        {/* ── SHOWCASE: last number + stats + reel ── */}
        <div className="w-full bg-surface-container-low rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -right-16 -top-16 w-60 h-60 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left: glowing sphere */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative flex items-center justify-center">
              {/* Ripple rings */}
              <div className="absolute w-36 h-36 rounded-full bg-primary/20 animate-ping opacity-60 pointer-events-none" />
              <div className="absolute w-44 h-44 rounded-full bg-primary-container/10 blur-md pointer-events-none" />
              {/* Particle burst */}
              {state.lastNumber !== null && particles.length > 0 && (
                <>
                  <span className="pop-halo-ring pointer-events-none absolute inset-0 mx-auto my-auto block h-24 w-24 rounded-full border-2 border-primary/40" aria-hidden="true" />
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
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary-fixed via-primary-container to-amber-900 shadow-2xl flex flex-col items-center justify-center text-center p-2 pop-halo">
                {/* specular highlight */}
                <div className="absolute top-2 left-6 w-10 h-5 bg-white/40 rounded-full blur-[2px] transform -rotate-45 pointer-events-none" />
                <span className="pop-halo-ring border border-primary/40" aria-hidden="true" />
                <p
                  key={spinNum ?? state.lastNumber ?? "none"}
                  className="animate-slot-flip font-caller-announcement text-caller-announcement text-on-primary-container font-black tracking-tight drop-shadow-md leading-none select-none"
                >
                  {spinNum ?? state.lastNumber ?? "–"}
                </p>
                <span
                  className={`font-label-sm text-[9px] font-bold tracking-widest uppercase mt-0.5 ${
                    spinNum !== null
                      ? "text-amber-200 animate-pulse"
                      : "text-on-primary-container/80"
                  }`}
                >
                  {spinNum !== null ? "WHEEL SPINNING…" : "BALL DRAWN"}
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
                  ? `${LANG_NAMES[state.language]} · ${voiceLabel(state)} · ${TONE_NAMES[state.tone]} · ${state.pitch.toFixed(2)}x`
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
              const dec = num === 90 ? 8 : Math.floor((num - 1) / 10);
              const heat = state.heatmap && !called && !isLast ? decadeHeat[dec] : 0;
              return (
                <div
                  key={num}
                  style={
                    state.heatmap && !called && !isLast
                      ? {
                          backgroundColor: `rgba(245,158,11,${(0.03 + heat * 0.4).toFixed(3)})`,
                        }
                      : undefined
                  }
                  className={`flex aspect-square items-center justify-center rounded-lg font-ticket-digit text-ticket-digit font-bold transition-all duration-200 ${
                    isLast
                      ? "animate-board-pop bg-secondary text-on-secondary-container shadow-lg shadow-secondary/30 scale-105 z-10 ring-2 ring-white/50"
                      : called
                        ? "bg-gradient-to-br from-primary-fixed via-primary-container to-amber-700 text-on-primary-container shadow-sm"
                        : state.heatmap
                          ? "bg-surface-container-high/60 text-on-surface-variant/50"
                          : "bg-surface-container-high/60 text-on-surface-variant/40 hover:bg-surface-container-highest hover:text-on-surface"
                  }`}
                  title={
                    state.heatmap && !called
                      ? `${decadeHeat[dec] === 0 ? "No" : Math.round(decadeHeat[dec] * 10)} of 10 numbers drawn in this row`
                      : undefined
                  }
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
                onClick={() => setState((p) => ({ ...p, heatmap: !p.heatmap }))}
                className={`px-2.5 py-1 rounded transition-colors ${
                  state.heatmap
                    ? "bg-primary/20 text-primary"
                    : "bg-surface-container-high hover:bg-surface-bright text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-sm align-middle -mt-0.5 mr-1">local_fire_department</span>
                Heatmap
              </button>
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

          {/* Heatmap legend */}
          {state.heatmap && (
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-on-surface-variant">
              <span className="font-label-md text-label-md font-semibold uppercase tracking-wider">
                Decade coverage
              </span>
              <div className="flex items-center gap-0.5">
                {decadeHeat.map((h, i) => (
                  <span
                    key={i}
                    className={`h-5 w-8 rounded flex items-center justify-center font-ticket-digit text-[11px] font-bold ${
                      h >= 0.8
                        ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950"
                        : h >= 0.5
                          ? "bg-gradient-to-br from-amber-400/80 to-amber-600/80 text-amber-50"
                          : h > 0
                            ? "bg-gradient-to-br from-surface-container-highest to-surface-container-high text-on-surface-variant"
                            : "bg-surface-container-lowest text-on-surface-variant/40"
                    }`}
                    title={`${i === 0 ? 1 : i * 10}–${i === 8 ? 90 : (i + 1) * 10}: ${Math.round(h * 100)}% drawn`}
                  >
                    {Math.round(h * 100)}
                  </span>
                ))}
              </div>
              <span className="text-on-surface-variant/70">% drawn per row (01–90)</span>
            </div>
          )}
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
      <div className="space-y-6 min-w-0">
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
