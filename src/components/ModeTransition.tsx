import { useMemo } from 'react';

interface ModeTransitionProps {
  /** true = switching to Astrix (purple VFX), false = back to Flame (fire VFX) */
  toAstrix: boolean;
}

interface Ember {
  id: number;
  angle: number;
  dist: number;
  size: number;
  delay: number;
  hue: string;
}

const FLAME_HUES = ['#fbbf24', '#f97316', '#dc2626', '#fde047'];
const ASTRIX_HUES = ['#a78bfa', '#7c3aed', '#c084fc', '#8b5cf6'];

/* Full-screen VFX played while the launcher morphs between Flame Client and
   Astrix Mode. Pure CSS animation; the parent mounts it for ~1.5s. */
export default function ModeTransition({ toAstrix }: ModeTransitionProps) {
  const hues = toAstrix ? ASTRIX_HUES : FLAME_HUES;

  const embers = useMemo<Ember[]>(() => {
    const span = Math.min(window.innerWidth, window.innerHeight);
    return Array.from({ length: 42 }, (_, i) => {
      const angle = (i / 42) * Math.PI * 2 + Math.random() * 0.5;
      const dist = span * (0.22 + Math.random() * 0.34);
      return {
        id: i,
        angle,
        dist,
        size: 4 + Math.random() * 7,
        delay: Math.random() * 0.25,
        hue: hues[Math.floor(Math.random() * hues.length)],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toAstrix]);

  return (
    <div className={`mode-fx ${toAstrix ? 'mode-fx-astrix' : 'mode-fx-flame'}`} aria-hidden="true">
      <div className="mode-fx-wipe" />
      <div className="mode-fx-ring mode-fx-ring-1" />
      <div className="mode-fx-ring mode-fx-ring-2" />
      <div className="mode-fx-ring mode-fx-ring-3" />
      {embers.map((e) => (
        <span
          key={e.id}
          className="mode-fx-ember"
          style={{
            width: e.size,
            height: e.size,
            background: e.hue,
            boxShadow: `0 0 ${e.size * 2.5}px ${e.hue}`,
            animationDelay: `${e.delay}s`,
            ['--tx' as string]: `${Math.cos(e.angle) * e.dist}px`,
            ['--ty' as string]: `${Math.sin(e.angle) * e.dist}px`,
          }}
        />
      ))}
      <div className="mode-fx-flash" />
    </div>
  );
}
