import type { Metadata } from "next";
import Caller from "@/components/game/Caller";
import { requireMember } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Game — Number Caller",
  description:
    "Professional Tambola / Housie number caller with a 90-number board, manual & auto modes, and voice announcements in English, Hindi and Telugu.",
};

export const dynamic = "force-dynamic";

export default async function GamePage() {
  await requireMember("/game");
  return (
    <div className="w-full px-6 lg:px-10 py-6 flex flex-col gap-6">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 font-label-sm text-label-sm uppercase font-bold tracking-wider text-primary">
          <span className="material-symbols-outlined text-sm">casino</span>
          Live Caller
        </span>
        <h1 className="mt-4 font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight">
          The Number Caller
        </h1>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
          Call numbers in English, हिंदी or తెలుగు. The board updates
          automatically, your game is saved as you play, and you can export a
          report when the night ends.
        </p>
      </div>

      <Caller />

      <div className="glass rounded-2xl border border-white/10 p-6 grid gap-4 sm:grid-cols-3">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-2xl text-tertiary">record_voice_over</span>
          <div>
            <p className="font-label-md text-label-md font-bold text-on-surface">Three languages</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Pre-recorded Hindi &amp; Telugu voice, plus English text-to-speech.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-2xl text-primary">autorenew</span>
          <div>
            <p className="font-label-md text-label-md font-bold text-on-surface">Auto mode</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Set the pace and let the host run the whole game hands-free.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-2xl text-secondary">bolt</span>
          <div>
            <p className="font-label-md text-label-md font-bold text-on-surface">Auto-save</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Close the tab by accident? Your game is waiting right where you left it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
