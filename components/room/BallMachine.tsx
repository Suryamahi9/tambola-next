"use client";

/** Animated ball tumbler — shows the drawn number popping out of a mini drum.
 *  The ball is keyed by the number so a new draw retriggers the pop. */
export default function BallMachine({
  number,
  live,
}: {
  number: number | null;
  live: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Drawn ball pop */}
      <div className="relative">
        <div
          key={number ?? "none"}
          className={`tambola-ball animate-pop flex h-16 w-16 items-center justify-center ${
            live ? "" : "opacity-60"
          }`}
        >
          <span className="font-display text-xl font-bold text-violet-950 drop-shadow-sm">
            {number ?? "?"}
          </span>
        </div>
        {live && number !== null && (
          <span className="pointer-events-none absolute -inset-1 -z-10 rounded-full bg-violet-500/30 blur-md" />
        )}
      </div>

      {/* Drum */}
      <div className="tambola-drum flex items-center justify-center gap-1.5" aria-hidden="true">
        <span className="drum-ball drum-ball-pink" />
        <span className="drum-ball drum-ball-amber" />
        <span className="drum-ball drum-ball-blue" />
        <span className="drum-ball drum-ball-emerald" />
      </div>
    </div>
  );
}