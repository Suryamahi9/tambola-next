"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is Tambola Zone really free?",
    a: "Yes. The number caller, auto mode, ticket generator and print features are all completely free — no account, no sign-up, no ads.",
  },
  {
    q: "Do Hindi and Telugu voices need extra downloads?",
    a: "No. Hindi (हिंदी) and Telugu (తెలుగు) number calls are pre-recorded and bundled with the site, so they play on any device — including smart TV browsers — with no plugins.",
  },
  {
    q: "Can I use it on a TV or projector?",
    a: "Absolutely. Open the Game page on any browser and it works. The board, last-number display and auto mode are designed to be read from across the room.",
  },
  {
    q: "Are the generated tickets legal / official?",
    a: "Every ticket follows the standard 3×9 Tambola rules: 15 numbers, 5 per row, 1–3 per column, correct 1–9 to 80–90 column ranges, and ascending order. Full Set mode produces a 6-ticket book covering 1–90 exactly once.",
  },
  {
    q: "What happens if I close the page mid-game?",
    a: "The caller auto-saves your progress in the browser. Reopen the Game page and your called numbers and board are restored exactly as you left them.",
  },
  {
    q: "Does it work offline?",
    a: "Once loaded, the tickets and caller work without internet. Hindi and Telugu audio are bundled locally. English voice uses your device's built-in text-to-speech.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          FAQ
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          Questions, answered
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={faq.q}
              className={`glass-subtle rounded-2xl border transition ${
                isOpen
                  ? "border-violet-500/50"
                  : "border-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{faq.q}</span>
                <span
                  className={`shrink-0 text-violet-600 transition-transform duration-200 dark:text-violet-400 ${isOpen ? "rotate-45" : ""}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <p className="px-5 pb-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
