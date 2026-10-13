export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0b0b] shadow-[0_4px_14px_-4px_rgba(212,175,55,0.5)]">
        <svg viewBox="0 0 120 120" className="h-10 w-10" aria-hidden="true">
          <defs>
            <radialGradient id="mgt-bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F7E7A1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0b0b0b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mgt-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9E8" />
              <stop offset="28%" stopColor="#F7E7A1" />
              <stop offset="58%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8C6A18" />
            </linearGradient>
            <linearGradient id="mgt-ball" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FFF9E8" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8C6A18" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="#0b0b0b" stroke="url(#mgt-gold)" strokeWidth="2.5" strokeDasharray="4 2" />
          <circle cx="60" cy="60" r="48" fill="url(#mgt-bgGlow)" />
          {/* Angled Tambola ticket grid */}
          <rect
            x="34"
            y="38"
            width="52"
            height="34"
            rx="5"
            fill="#141414"
            stroke="url(#mgt-gold)"
            strokeWidth="1.8"
            transform="rotate(-6 60 55)"
          />
          <line x1="51" y1="38" x2="51" y2="72" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth="1" transform="rotate(-6 60 55)" />
          <line x1="68" y1="38" x2="68" y2="72" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth="1" transform="rotate(-6 60 55)" />
          <line x1="34" y1="55" x2="86" y2="55" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth="1" transform="rotate(-6 60 55)" />
          {/* Glowing gold bingo ball */}
          <circle cx="76" cy="74" r="18" fill="url(#mgt-ball)" stroke="#FFF9E8" strokeWidth="1.5" filter="drop-shadow(0 4px 10px rgba(212,175,55,0.55))" />
          <circle cx="76" cy="74" r="13" fill="#0b0b0b" />
          <text x="76" y="79" fontFamily="Playfair Display, Georgia, serif" fontWeight="800" fontSize="14" fill="#F7E7A1" textAnchor="middle">
            90
          </text>
          <path d="M42 28 L44 33 L49 35 L44 37 L42 42 L40 37 L35 35 L40 33 Z" fill="#F7E7A1" />
        </svg>
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="font-display text-base font-bold tracking-tight text-on-surface">
          Golden <span className="gold-text">Tambola</span>
        </span>
        <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          Luxury Housie Lounge
        </span>
      </span>
    </span>
  );
}
