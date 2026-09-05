"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { PublicRoom } from "@/lib/room/types";

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function apiOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** Modal invite card: room code, QR link, player count + downloadable PNG. */
export default function RoomInviteCard({
  room,
  onClose,
}: {
  room: PublicRoom;
  onClose: () => void;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinUrl = `${apiOrigin()}/room/${room.id}`;
  const paidCount = room.players.filter((p) => p.paid).length;
  const potPaise = room.players
    .filter((p) => p.paid)
    .reduce((n, p) => n + p.ticketCount, 0) * room.pricePerTicket;
  const host = room.players[0];

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(joinUrl, { width: 400, margin: 1, color: { dark: "#0b0e15", light: "#ffffff" } })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {
        if (active) setQrUrl(null);
      });
    return () => {
      active = false;
    };
  }, [joinUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function waShare() {
    const text = encodeURIComponent(`🎉 Tambola party room — code ${room.code}. Join me!\n${joinUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function downloadCard() {
    if (!qrUrl) return;
    setDownloading(true);
    try {
      const card = document.createElement("canvas");
      card.width = 720;
      card.height = 1040;
      const ctx = card.getContext("2d")!;

      const grad = ctx.createLinearGradient(0, 0, 720, 1040);
      grad.addColorStop(0, "#0b0e15");
      grad.addColorStop(0.55, "#1d1f27");
      grad.addColorStop(1, "#3a2a12");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1040);

      const qr = new Image();
      await new Promise<void>((res, rej) => {
        qr.onload = () => res();
        qr.onerror = () => rej(new Error("qr"));
        qr.src = qrUrl;
      });

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 76px 'Trebuchet MS', sans-serif";
      ctx.fillText("🎉 TAMBOLA PARTY", 360, 150);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 150px 'Courier New', monospace";
      ctx.fillText(room.code, 360, 330);

      ctx.fillStyle = "#fde68a";
      ctx.font = "24px 'Trebuchet MS', sans-serif";
      ctx.fillText("Tap the QR or enter the code on the game page", 360, 380);

      const qrSize = 400;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(160, 430, qrSize, qrSize, 28);
      ctx.fill();
      ctx.drawImage(qr, 180, 450, 360, 360);

      ctx.fillStyle = "#ffffff";
      ctx.font = "36px 'Trebuchet MS', sans-serif";
      ctx.fillText(`${paidCount} player${paidCount === 1 ? "" : "s"} · ${formatRupees(potPaise)} pot`, 360, 900);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "24px 'Trebuchet MS', sans-serif";
      ctx.fillText(`Hosted by ${host?.name ?? "Host"} · unique numbers, real caller`, 360, 950);
      ctx.fillText(`tambola.zone`, 360, 1000);

      const blob = await new Promise<Blob | null>((res) => card.toBlob(res, "image/png"));
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tambola-${room.code}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-2xl p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-surface-container-low/95 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-20 left-1/2 w-64 h-64 bg-primary-container/25 rounded-full blur-3xl pointer-events-none -translate-x-1/2" aria-hidden="true" />
        <div className="relative z-[1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">link</span>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface">Invite players</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3">
            <div>
              <p className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">Room code</p>
              <p className="font-mono text-2xl font-bold tracking-[0.25em] text-primary-fixed-dim">
                {room.code}
              </p>
            </div>
            <div className="text-right">
              <p className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">Status</p>
              <p className="text-sm font-bold text-secondary">
                {paidCount} player{paidCount === 1 ? "" : "s"} in
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center rounded-2xl border border-white/10 bg-white p-3">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt={`QR code to join room ${room.code}`} width={208} height={208} />
            ) : (
              <div className="flex h-[208px] w-[208px] items-center justify-center text-sm text-on-surface-variant">
                Generating…
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-on-surface-variant">
            Scan with any phone camera to join instantly
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary-container/20 px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-secondary-container/30"
            >
              <span className="material-symbols-outlined text-lg">{copied ? "check_circle" : "content_copy"}</span>
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={waShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-highest hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              WhatsApp
            </button>
          </div>
          <button
            type="button"
            disabled={!qrUrl || downloading}
            onClick={() => void downloadCard()}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-fixed px-4 py-2.5 text-sm font-bold text-on-primary-container shadow-[0_0_24px_rgba(245,158,11,0.3)] transition hover:brightness-110 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg align-middle mr-1">download</span>
            {downloading ? "Building card…" : "Download invite card"}
          </button>
        </div>
      </div>
    </div>
  );
}