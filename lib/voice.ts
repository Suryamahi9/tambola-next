/** Preloaded recorded number packs (Hindi / Telugu MP3s).
 *
 * The caller used to build `new Audio(url)` per draw, so every number paid a
 * fresh network fetch + decode before any sound came out — that's the Telugu
 * lag. Clips are fetched and decoded into AudioBuffers up front instead, and
 * played with an AudioBufferSourceNode, so a draw speaks in the same tick.
 *
 * Client-only: import from "use client" components. */

export type PackLang = "hi-IN" | "te-IN";

const SUB_DIR: Record<PackLang, string> = { "hi-IN": "hi", "te-IN": "te" };

const buffers = new Map<PackLang, Map<number, AudioBuffer>>();
const inFlight = new Set<string>();
let audioCtx: AudioContext | null = null;

export const isPackLang = (lang: string): lang is PackLang =>
  lang === "hi-IN" || lang === "te-IN";

const packUrl = (lang: PackLang, num: number) =>
  `/audio/${SUB_DIR[lang]}/${num}.mp3`;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    try {
      audioCtx = new AC();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/** decodeAudioData with both promise and callback shapes handled. */
function decode(c: AudioContext, data: ArrayBuffer): Promise<AudioBuffer | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (buf: AudioBuffer | null) => {
      if (settled) return;
      settled = true;
      resolve(buf);
    };
    try {
      const p = c.decodeAudioData(data, done, () => done(null));
      if (p && typeof p.then === "function") {
        p.then(done).catch(() => done(null));
      }
    } catch {
      done(null);
    }
  });
}

async function loadBuffer(
  lang: PackLang,
  num: number
): Promise<AudioBuffer | null> {
  const c = ctx();
  if (!c) return null;
  try {
    const res = await fetch(packUrl(lang, num));
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    return await decode(c, data);
  } catch {
    return null;
  }
}

function packFor(lang: PackLang): Map<number, AudioBuffer> {
  let pack = buffers.get(lang);
  if (!pack) {
    pack = new Map();
    buffers.set(lang, pack);
  }
  return pack;
}

/** Warm + decode all 90 clips for a language (12 in parallel).
 *  Safe to call repeatedly — loaded and in-flight clips are skipped. */
export function preloadVoicePack(lang: PackLang): void {
  if (typeof window === "undefined") return;
  const pack = packFor(lang);
  const pending: number[] = [];
  for (let n = 1; n <= 90; n++) {
    const key = `${lang}:${n}`;
    if (!pack.has(n) && !inFlight.has(key)) pending.push(n);
  }
  if (pending.length === 0) return;
  let i = 0;
  const worker = async () => {
    while (i < pending.length) {
      const num = pending[i++];
      const key = `${lang}:${num}`;
      inFlight.add(key);
      try {
        const buf = await loadBuffer(lang, num);
        if (buf) pack.set(num, buf);
      } finally {
        inFlight.delete(key);
      }
    }
  };
  void Promise.all(Array.from({ length: 12 }, worker));
}

function cacheInBackground(lang: PackLang, num: number): void {
  const pack = packFor(lang);
  const key = `${lang}:${num}`;
  if (pack.has(num) || inFlight.has(key)) return;
  inFlight.add(key);
  void loadBuffer(lang, num)
    .then((buf) => {
      if (buf) pack.set(num, buf);
    })
    .finally(() => {
      inFlight.delete(key);
    });
}

/** Pitch factor (1 = untouched) → Web Audio detune cents. Clamped to a sane range. */
function clampPitch(pitch: number): number {
  if (!isFinite(pitch)) return 1;
  return Math.min(2, Math.max(0.25, pitch));
}

/** Play a clip instantly from the warm pack; streams (and warms) if missing.
 *  `pitch` shifts the recording with the detune param (1 = untouched). Detune
 *  resamples, so a higher pitch also plays a touch faster — same as TTS. */
export function speakRecorded(lang: PackLang, num: number, pitch = 1): boolean {
  if (typeof window === "undefined") return false;
  const p = clampPitch(pitch);
  const buf = buffers.get(lang)?.get(num);
  const c = ctx();
  if (buf && c) {
    // A suspended context (no gesture yet) resumes within the click handler
    // that got us here; queued sources start the moment it does.
    if (c.state === "suspended") void c.resume().catch(() => undefined);
    try {
      const src = c.createBufferSource();
      src.buffer = buf;
      if (p !== 1) src.detune.value = Math.round(1200 * Math.log2(p));
      src.connect(c.destination);
      src.start(0);
      return true;
    } catch {
      /* fall through to streaming */
    }
  }
  const live = new Audio(packUrl(lang, num));
  if (p !== 1) {
    // Media elements keep pitch when playbackRate changes unless told otherwise.
    (live as HTMLMediaElement & { preservePitch?: boolean }).preservePitch = false;
    live.playbackRate = p;
  }
  void live.play().catch(() => undefined);
  cacheInBackground(lang, num);
  return true;
}

/** Exact duration in seconds of a warm clip (as it will actually play, i.e.
 *  after the pitch shift), or null when not loaded yet. */
export function recordedDuration(
  lang: PackLang,
  num: number,
  pitch = 1
): number | null {
  const buf = buffers.get(lang)?.get(num);
  if (!buf || !isFinite(buf.duration) || buf.duration <= 0) return null;
  return buf.duration / clampPitch(pitch);
}
