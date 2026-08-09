import type { Metadata } from "next";
import Caller from "@/components/game/Caller";

export const metadata: Metadata = {
  title: "Game — Number Caller",
  description:
    "Professional Tambola / Housie number caller with a 90-number board, manual & auto modes, and voice announcements in English, Hindi and Telugu.",
};

export default function GamePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          Live Game
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          The Number Caller
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Call numbers in English, हिंदी or తెలుగు. The board updates
          automatically, your game is saved as you play, and you can export a
          report when the night ends.
        </p>
      </div>

      <div className="mt-8">
        <Caller />
      </div>

      <div className="glass mt-12 grid gap-4 rounded-2xl border border-white/10 p-6 sm:grid-cols-3">
        <div className="flex gap-3">
          <span className="text-2xl">🎙️</span>
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">Three languages</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Pre-recorded Hindi & Telugu voice, plus English text-to-speech.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">Auto mode</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Set the pace and let the host run the whole game hands-free.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-2xl">💾</span>
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">Auto-save</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Close the tab by accident? Your game is waiting right where you left it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
