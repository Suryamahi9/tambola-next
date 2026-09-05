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
      <div className="relative flex-shrink-0">
        <div
          key={number ?? "none"}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-primary-fixed to-primary-container shadow-2xl shadow-primary-container/40 animate-pop ${
            live ? "" : "opacity-70"
          }`}
        >
          <span className="font-caller-announcement text-2xl font-black text-on-primary-container leading-none">
            {number ?? "?"}
          </span>
        </div>
        {live && number !== null && (
          <>
            <span className="pointer-events-none absolute -inset-1 -z-10 rounded-full bg-primary-container/30 blur-md" />
            <span className="pointer-events-none absolute -inset-2 -z-20 rounded-full bg-primary-container/10 blur-xl" />
          </>
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