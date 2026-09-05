"use client";

import { useCallback, useEffect, useRef } from "react";

type Prize = { playerId: string; label: string; pattern: string };

/** Lightweight confetti burst — pure canvas, zero deps.
 *  Accepts a `prizes` array and automatically fires when a new prize appears. */
export default function Confetti({ prizes }: { prizes?: Prize[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastCount = useRef(prizes?.length ?? 0);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = [
      "#f59e0b", "#ffc174", "#ffddb8", "#4edea3",
      "#00a572", "#6ffbbe", "#d5c3ff", "#e9ddff",
    ];
    const pieces: {
      x: number; y: number; vx: number; vy: number;
      w: number; h: number; color: string;
      rot: number; rotSpeed: number; life: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.6,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 14 - 4,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }

    let raf: number;
    function tick() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.vy += 0.35;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rot += p.rotSpeed;
        p.life -= 0.008;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fire when prizes array grows (new prize awarded).
  useEffect(() => {
    const count = prizes?.length ?? 0;
    if (count > lastCount.current) {
      lastCount.current = count;
      fire();
    }
  }, [prizes, fire]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden="true"
    />
  );
}
