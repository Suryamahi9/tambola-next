export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10131A]">
        <svg viewBox="0 0 120 120" className="h-10 w-10" aria-hidden="true">
          <defs>
            <radialGradient id="mgt-bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10131A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mgt-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="#10131A" stroke="url(#mgt-gold)" strokeWidth="2.5" strokeDasharray="4 2" />
          <circle cx="60" cy="60" r="48" fill="url(#mgt-bgGlow)" />
          {/* Angled Tambola ticket grid */}
          <rect
            x="34"
            y="38"
            width="52"
            height="34"
            rx="5"
            fill="#1E2230"
            stroke="url(#mgt-gold)"
            strokeWidth="1.8"
            transform="rotate(-6 60 55)"
          />
          <line x1="51" y1="38" x2="51" y2="72" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1" transform="rotate(-6 60 55)" />
          <line x1="68" y1="38" x2="68" y2="72" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1" transform="rotate(-6 60 55)" />
          <line x1="34" y1="55" x2="86" y2="55" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1" transform="rotate(-6 60 55)" />
          {/* Glowing bingo ball */}
          <circle cx="76" cy="74" r="18" fill="url(#mgt-gold)" stroke="#FFFFFF" strokeWidth="1.5" filter="drop-shadow(0 4px 10px rgba(245,158,11,0.6))" />
          <circle cx="76" cy="74" r="13" fill="#0B0E15" />
          <text x="76" y="79" fontFamily="Syne, sans-serif" fontWeight="900" fontSize="13" fill="#FDE68A" textAnchor="middle">
            90
          </text>
          <path d="M42 28 L44 33 L49 35 L44 37 L42 42 L40 37 L35 35 L40 33 Z" fill="#FDE68A" />
        </svg>
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="font-display text-base font-extrabold tracking-tight text-on-surface">
          Grand <span className="text-primary">Tambola</span>
        </span>
        <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Live Housie Nights
        </span>
      </span>
    </span>
  );
}