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
    QRCode.toDataURL(joinUrl, { width: 400, margin: 1, color: { dark: "#1e1b4b", light: "#ffffff" } })
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
      grad.addColorStop(0, "#4c1d95");
      grad.addColorStop(0.5, "#312e81");
      grad.addColorStop(1, "#831843");
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
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-sm rounded-3xl border border-white/15 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold text-white">Invite players</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-neutral-300 transition hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b0d1a] px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Room code</p>
            <p className="font-mono text-2xl font-bold tracking-[0.25em] text-violet-300">
              {room.code}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Status</p>
            <p className="text-sm font-bold text-emerald-300">
              {paidCount} player{paidCount === 1 ? "" : "s"} in
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center rounded-2xl border border-white/10 bg-white p-3">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt={`QR code to join room ${room.code}`} width={208} height={208} />
          ) : (
            <div className="flex h-[208px] w-[208px] items-center justify-center text-sm text-neutral-500">
              Generating…
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-neutral-500">
          Scan with any phone camera to join instantly
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-violet-400 hover:text-violet-200"
          >
            {copied ? "Copied ✓" : "🔗 Copy link"}
          </button>
          <button
            type="button"
            onClick={waShare}
            className="flex-1 rounded-full bg-emerald-600/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/30"
          >
            💬 WhatsApp
          </button>
        </div>
        <button
          type="button"
          disabled={!qrUrl || downloading}
          onClick={() => void downloadCard()}
          className="mt-2 w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {downloading ? "Building card…" : "⬇ Download invite card"}
        </button>
      </div>
    </div>
  );
}