import { useId } from 'react';
import { VoxelIcon } from './Voxel3D';

/* =====================================================================
   ShopModels — fully shaped 3D models for the shop (SVG "3D renders"):
   smooth silhouettes, isometric shading, gradients and highlights —
   not block-by-block voxels.
   ===================================================================== */

interface ModelProps {
  depth?: number;
  delay?: number;
  style?: React.CSSProperties;
}

/* ---------------- Ember Cape ---------------- */

export function EmberCapeModel({ depth = 3, delay = 0, style }: ModelProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <VoxelIcon width={66} height={90} depth={depth} delay={delay} style={style}>
      <svg width="66" height="90" viewBox="0 0 100 112">
        <defs>
          <linearGradient id={`${uid}-cape`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd08a" />
            <stop offset="0.35" stopColor="#f97316" />
            <stop offset="0.75" stopColor="#c2410c" />
            <stop offset="1" stopColor="#7c2d12" />
          </linearGradient>
          <linearGradient id={`${uid}-fold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3" />
            <stop offset="1" stopColor="#0006" />
          </linearGradient>
          <linearGradient id={`${uid}-clasp`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd75e" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* draped cape body */}
        <path
          d="M40 18 Q50 11 60 18 Q64 34 72 44 Q84 58 88 72 Q92 92 76 100 Q50 110 24 100 Q8 92 12 72 Q16 58 28 44 Q36 34 40 18 Z"
          fill={`url(#${uid}-cape)`}
        />
        {/* folds */}
        <path d="M42 22 Q38 52 30 76 Q26 88 32 98" stroke={`url(#${uid}-fold)`} strokeWidth="3.5" fill="none" opacity="0.5" />
        <path d="M58 22 Q62 52 70 76 Q74 88 68 98" stroke={`url(#${uid}-fold)`} strokeWidth="3" fill="none" opacity="0.4" />
        <path d="M50 18 Q50 52 50 84 Q50 98 50 104" stroke="#00000026" strokeWidth="2" fill="none" />
        {/* raised collar (top surface hint) */}
        <path d="M42 20 Q50 12 58 20 L56 27 Q50 22 44 27 Z" fill="#ffb56b" opacity="0.9" />
        {/* clasp */}
        <ellipse cx="50" cy="24" rx="4.5" ry="3" fill={`url(#${uid}-clasp)`} stroke="#92400e" strokeWidth="1" />
        {/* hem highlight */}
        <path d="M24 100 Q50 110 76 100" stroke="#ffd08a" strokeWidth="2.5" fill="none" opacity="0.6" />
      </svg>
    </VoxelIcon>
  );
}

/* ---------------- Flame Halo ---------------- */

export function FlameHaloModel({ depth = 3, delay = 0.4, style }: ModelProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <VoxelIcon width={76} height={66} depth={depth} delay={delay} style={style}>
      <svg width="76" height="66" viewBox="0 0 100 88">
        <defs>
          <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fb923c" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="1" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe082" />
            <stop offset="0.55" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
          <mask id={`${uid}-hole`}>
            <rect width="100" height="88" fill="#fff" />
            <ellipse cx="50" cy="46" rx="23" ry="9.5" fill="#000" />
          </mask>
        </defs>

        <ellipse cx="50" cy="50" rx="44" ry="24" fill={`url(#${uid}-glow)`} />
        {/* torus ring with a punched hole */}
        <ellipse cx="50" cy="46" rx="34" ry="15" fill={`url(#${uid}-ring)`} mask={`url(#${uid}-hole)`} />
        {/* inner-bottom shading for 3D depth */}
        <path d="M27 46 A 23 9.5 0 0 0 73 46 A 34 15 0 0 1 27 46 Z" fill="#0000004d" />
        {/* top highlight */}
        <path d="M20 42 A 34 15 0 0 1 80 42" stroke="#fff6" strokeWidth="3" fill="none" />
        {/* sparkles */}
        <path d="M14 30 L16 34 L20 36 L16 38 L14 42 L12 38 L8 36 L12 34 Z" fill="#ffe082" />
        <path d="M84 26 L85.6 29.2 L89 31 L85.6 32.8 L84 36 L82.4 32.8 L79 31 L82.4 29.2 Z" fill="#ffd75e" />
        <path d="M90 56 L91.2 58.4 L94 60 L91.2 61.6 L90 64 L88.8 61.6 L86 60 L88.8 58.4 Z" fill="#fbbf24" opacity="0.85" />
      </svg>
    </VoxelIcon>
  );
}

/* ---------------- Wings (shared shape) ---------------- */

function WingShape({ uid, grad, edge }: { uid: string; grad: string; edge: string }) {
  return (
    <g>
      {/* right wing */}
      <g fill={`url(#${uid}-${grad})`} stroke={edge} strokeWidth="1.6">
        <path d="M46 64 Q28 40 10 10 Q26 20 44 28 Q56 44 56 60 Z" />
        <path d="M40 68 Q22 50 8 28 Q24 34 38 44 Q48 56 48 68 Z" />
        <path d="M36 72 Q20 58 10 44 Q24 48 34 54 Q42 64 42 72 Z" />
      </g>
      {/* left wing (mirror) */}
      <g fill={`url(#${uid}-${grad})`} stroke={edge} strokeWidth="1.6">
        <path d="M54 64 Q72 40 90 10 Q74 20 56 28 Q44 44 44 60 Z" />
        <path d="M60 68 Q78 50 92 28 Q76 34 62 44 Q52 56 52 68 Z" />
        <path d="M64 72 Q80 58 90 44 Q76 48 66 54 Q58 64 58 72 Z" />
      </g>
      {/* feather tips */}
      <g fill="#ffffff99">
        <path d="M10 10 L14 14 L12 8 Z" />
        <path d="M90 10 L86 14 L88 8 Z" />
      </g>
    </g>
  );
}

export function PixelWingsModel({ depth = 3, delay = 0.8, style }: ModelProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <VoxelIcon width={92} height={72} depth={depth} delay={delay} style={style}>
      <svg width="92" height="72" viewBox="0 0 100 80">
        <defs>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        <WingShape uid={uid} grad="wing" edge="#64748b66" />
        {/* back mount */}
        <ellipse cx="50" cy="66" rx="12" ry="6" fill="#cbd5e1" stroke="#64748b66" strokeWidth="1.5" />
      </svg>
    </VoxelIcon>
  );
}

export function NetherWingsModel({ depth = 3, delay = 1.2, style }: ModelProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <VoxelIcon width={92} height={72} depth={depth} delay={delay} style={style}>
      <svg width="92" height="72" viewBox="0 0 100 80">
        <defs>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f87171" />
            <stop offset="0.45" stopColor="#b91c1c" />
            <stop offset="1" stopColor="#450a0a" />
          </linearGradient>
        </defs>
        <WingShape uid={uid} grad="wing" edge="#7f1d1d99" />
        <ellipse cx="50" cy="66" rx="12" ry="6" fill="#7f1d1d" stroke="#450a0a99" strokeWidth="1.5" />
      </svg>
    </VoxelIcon>
  );
}

/* ---------------- Gold Badge ---------------- */

export function GoldBadgeModel({ depth = 3, delay = 1.6, style }: ModelProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <VoxelIcon width={60} height={70} depth={depth} delay={delay} style={style}>
      <svg width="60" height="70" viewBox="0 0 100 116">
        <defs>
          <radialGradient id={`${uid}-gold`} cx="0.38" cy="0.3" r="0.95">
            <stop offset="0" stopColor="#ffe9a8" />
            <stop offset="0.4" stopColor="#fbbf24" />
            <stop offset="0.8" stopColor="#d97706" />
            <stop offset="1" stopColor="#92400e" />
          </radialGradient>
          <radialGradient id={`${uid}-star`} cx="0.4" cy="0.35" r="0.9">
            <stop offset="0" stopColor="#fff7d6" />
            <stop offset="0.6" stopColor="#ffd75e" />
            <stop offset="1" stopColor="#d97706" />
          </radialGradient>
        </defs>

        {/* ring / clasp */}
        <circle cx="50" cy="22" r="6" fill={`url(#${uid}-gold)`} stroke="#92400e" strokeWidth="1.5" />
        <path d="M50 28 Q50 36 50 40" stroke="#d97706" strokeWidth="3.5" fill="none" />
        {/* medallion */}
        <ellipse cx="50" cy="68" rx="28" ry="32" fill={`url(#${uid}-gold)`} stroke="#92400e" strokeWidth="2.5" />
        <ellipse cx="50" cy="68" rx="20" ry="23" fill="none" stroke="#b45309" strokeWidth="1.5" opacity="0.85" />
        {/* embossed star */}
        <path
          d="M50 51 L53.2 59.6 L62.4 59.9 L55.1 65.7 L57.6 74.5 L50 69.4 L42.4 74.5 L44.9 65.7 L37.6 59.9 L46.8 59.6 Z"
          fill={`url(#${uid}-star)`}
          stroke="#92400e"
          strokeWidth="1.4"
        />
        {/* gloss highlight */}
        <ellipse cx="40" cy="52" rx="7" ry="13" fill="#ffffff" opacity="0.4" transform="rotate(-24 40 52)" />
      </svg>
    </VoxelIcon>
  );
}

/* ---------------- Crown of Flames ---------------- */

export function CrownOfFlamesModel({ depth = 3, delay = 2, style }: ModelProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <VoxelIcon width={78} height={78} depth={depth} delay={delay} style={style}>
      <svg width="78" height="78" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe082" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id={`${uid}-flame`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#dc2626" />
            <stop offset="0.55" stopColor="#f97316" />
            <stop offset="1" stopColor="#fde047" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="50" cy="42" rx="42" ry="30" fill={`url(#${uid}-glow)`} />
        {/* flames */}
        <path d="M28 30 C 23 18 26 10 28 7 C 30 10 33 18 28 30 Z" fill={`url(#${uid}-flame)`} />
        <path d="M50 22 C 45 8 48 -1 50 -4 C 52 -1 55 8 50 22 Z" fill={`url(#${uid}-flame)`} />
        <path d="M72 30 C 67 18 70 10 72 7 C 74 10 77 18 72 30 Z" fill={`url(#${uid}-flame)`} />
        {/* peaks */}
        <path d="M18 54 L 28 32 L 38 54 Z" fill={`url(#${uid}-gold)`} stroke="#92400e" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M42 49 L 50 20 L 58 49 Z" fill={`url(#${uid}-gold)`} stroke="#92400e" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M62 54 L 72 32 L 82 54 Z" fill={`url(#${uid}-gold)`} stroke="#92400e" strokeWidth="1.4" strokeLinejoin="round" />
        {/* band */}
        <path
          d="M14 66 L 14 54 Q 33 46 50 46 Q 67 46 86 54 L 86 66 Q 50 76 14 66 Z"
          fill={`url(#${uid}-gold)`}
          stroke="#92400e"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* gems */}
        <circle cx="28" cy="50" r="3.6" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
        <circle cx="50" cy="44" r="4.2" fill="#f97316" stroke="#9a3412" strokeWidth="1" />
        <circle cx="72" cy="50" r="3.6" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        {/* band highlight */}
        <path d="M18 54 Q 33 46 50 46" stroke="#ffe9a8" strokeWidth="2" fill="none" opacity="0.8" />
      </svg>
    </VoxelIcon>
  );
}
