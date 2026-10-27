interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const base = (size: number | undefined, style?: React.CSSProperties) => ({
  width: size ?? 20,
  height: size ?? 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const GameIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M6.5 6.5h11a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5h-11a5 5 0 0 1-5-5v-2a5 5 0 0 1 5-5z" />
    <path d="M7 10v4M5 12h4" />
    <circle cx="16.5" cy="11" r="0.9" fill="currentColor" />
    <circle cx="18.5" cy="13.5" r="0.9" fill="currentColor" />
  </svg>
);

export const PuzzleIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M9.5 3.5h4.5v3.2a1.6 1.6 0 1 0 3.2 0V3.5h3.3v4.5h-3.2a1.6 1.6 0 1 0 0 3.2h3.2v9.3h-3.3v-3.2a1.6 1.6 0 1 0-3.2 0v3.2H9.5v-3.2a1.6 1.6 0 1 0-3.2 0v3.2H3v-9.3h3.2a1.6 1.6 0 1 0 0-3.2H3V3.5h3.3v3.2a1.6 1.6 0 1 0 3.2 0z" />
  </svg>
);

export const GlobeIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.7 2.4 4 5.3 4 8.5s-1.3 6.1-4 8.5c-2.7-2.4-4-5.3-4-8.5s1.3-6.1 4-8.5z" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z" />
  </svg>
);

export const NewsIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <path d="M8 7.5h8M8 11h8M8 14.5h5" />
  </svg>
);

export const CartIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M3.5 4.5h2l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h7.1a1.6 1.6 0 0 0 1.6-1.2l1.6-6.8H6.2" />
    <circle cx="9.5" cy="20" r="1.3" />
    <circle cx="16.5" cy="20" r="1.3" />
  </svg>
);

export const ShirtIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M4 7.5 8 4l2.2 1.6a2.2 2.2 0 0 0 3.6 0L16 4l4 3.5-2.2 2.8-1.3-.9V20H7.5v-10.6l-1.3.9z" />
  </svg>
);

export const GearIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
  </svg>
);

export const GridIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <rect x="4" y="4" width="6" height="6" rx="1.5" />
    <rect x="14" y="4" width="6" height="6" rx="1.5" />
    <rect x="4" y="14" width="6" height="6" rx="1.5" />
    <rect x="14" y="14" width="6" height="6" rx="1.5" />
  </svg>
);

export const MailIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4.5 7 7.5 6 7.5-6" />
  </svg>
);

export const UserIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" />
  </svg>
);

export const UserPlusIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <circle cx="10" cy="8" r="4" />
    <path d="M2.5 20.5c1.4-3.4 4.2-5 7.5-5 1 0 1.9.1 2.8.4" />
    <path d="M19 12.5v6M16 15.5h6" />
  </svg>
);

export const SendIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="m21 3-7.5 18-3-7.5L3 10.5z" />
    <path d="M21 3 10.5 13.5" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const MinimizeIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M5 12h14" />
  </svg>
);

export const MaximizeIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </svg>
);

export const ChevronDown = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRight = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const FolderIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M3.5 6.5h6l2 2.5h9v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </svg>
);

export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v3.5h-3.5" />
  </svg>
);

export const BoltIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const DotsIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
);

export const PlaneIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="m21 3-7.5 18-3-7.5L3 10.5z" />
    <path d="M21 3 10.5 13.5" />
  </svg>
);

export const ListIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/* Tier Queue (Astrix Mode): a ranked list, i.e. widest tier bar on top. */
export const TierIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <rect x="3.5" y="4" width="17" height="4" rx="1.2" />
    <rect x="3.5" y="10" width="12" height="4" rx="1.2" />
    <rect x="3.5" y="16" width="8" height="4" rx="1.2" />
  </svg>
);

/* The Discord mark, used by the Tier Queue link gate. */
export const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M19.3 5.4A16.6 16.6 0 0 0 15.2 4.1l-.3.6a12.4 12.4 0 0 1 3.5 1.8 15.6 15.6 0 0 0-12.8 0A12.4 12.4 0 0 1 9.1 4.7L8.8 4.1a16.6 16.6 0 0 0-4.1 1.3C2 9.6 1.4 13.6 1.7 17.6a16.7 16.7 0 0 0 5.1 2.6l.6-1a11 11 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 10.2 0l.4.3c-.5.3-1.1.6-1.7.8l.6 1a16.7 16.7 0 0 0 5.1-2.6c.4-4.6-.6-8.6-1.4-12.2zM8.6 15.2c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.8 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"
    />
  </svg>
);

export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M12 2.8 20 6v6c0 4.6-3.2 8-8 9.2C7.2 20 4 16.6 4 12V6z" />
    <path d="m9 12 2.2 2.2L15.5 9.5" />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 4h8A1.5 1.5 0 0 1 13.5 5.5V6" />
  </svg>
);

export const ExternalIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M14 4.5h5.5V10" />
    <path d="M19.5 4.5 11 13" />
    <path d="M19.5 13.5v4a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h4" />
  </svg>
);

export const MusicIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>
);

export const GiftIcon = (p: IconProps) => (
  <svg {...base(p.size, p.style)} className={p.className}>
    <rect x="4" y="9" width="16" height="4" rx="1" />
    <path d="M5 13h14v7H5zM12 9v11M12 9c-2.5-3.4-6.5-2.5-5.5.5M12 9c2.5-3.4 6.5-2.5 5.5.5" />
  </svg>
);

export const FlameLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <path
      d="M16 3c3.2 4.3 7 7.5 7 12.3A7.2 7.2 0 0 1 16 22.6a7.2 7.2 0 0 1-7-7.3C9 10.5 12.8 7.3 16 3z"
      fill="url(#flameGrad)"
    />
    <path
      d="M16 22.6c2.5 0 4.5-2 4.5-4.5 0-2.3-1.4-3.8-2.9-5.5-.6 1.6-1.7 3.1-3.4 4.6-1.6 1.4-2.7 2.6-2.7 3.9 0 1.4.9 1.5 1.6 1.5.8 0 1.5-.4 2.9-.4 1.5 0 2 .4 2 .4z"
      fill="#fbbf24"
    />
    <defs>
      <linearGradient id="flameGrad" x1="9" y1="3" x2="23" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fbbf24" />
        <stop offset="0.55" stopColor="#f97316" />
        <stop offset="1" stopColor="#dc2626" />
      </linearGradient>
    </defs>
  </svg>
);

export const AudioBars = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
    <rect x="2" y="9" width="2.4" height="7" rx="1" fill="#fbbf24" />
    <rect x="6.4" y="5" width="2.4" height="11" rx="1" fill="#f97316" />
    <rect x="10.8" y="2" width="2.4" height="14" rx="1" fill="#f97316" />
    <rect x="15.2" y="7" width="2.4" height="9" rx="1" fill="#dc2626" />
  </svg>
);
