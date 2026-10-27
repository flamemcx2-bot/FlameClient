import type { CSSProperties, ReactNode } from 'react';

/* =====================================================================
   Voxel3D — true-3D isometric Minecraft-style icons.
   Cubes are built from three clip-path faces (top / left / right) so
   they render as real 3D blocks that can float and parallax with the
   card tilt. Every icon ships inside a <VoxelIcon> wrapper that adds a
   bobbing float animation, a soft ground shadow, and mouse-parallax
   depth (driven by --mx/--my set on the Tilt3D parent).
   ===================================================================== */

/* ---------------- Primitive: one isometric cube ---------------- */

interface CubeProps {
  top?: string;
  left?: string;
  right?: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function Cube({
  top,
  left,
  right,
  size = 16,
  style,
  className,
}: CubeProps) {
  return (
    <span
      className={`voxel-cube${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, ...style }}
    >
      <span className="cube-face cube-top" style={{ background: top }} />
      <span className="cube-face cube-left" style={{ background: left }} />
      <span className="cube-face cube-right" style={{ background: right }} />
    </span>
  );
}

/* ---------------- Floating wrapper: bob + shadow + parallax ---------------- */

interface VoxelIconProps {
  children: ReactNode;
  /** Slot size (px). Required for composites that position cubes absolutely. */
  width?: number;
  height?: number;
  /** Parallax strength (0 disables). Higher = more movement with card tilt. */
  depth?: number;
  /** Float animation delay in seconds (stagger multiple icons). */
  delay?: number;
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function VoxelIcon({
  children,
  width,
  height,
  depth = 2,
  delay = 0,
  shadow = true,
  className,
  style,
}: VoxelIconProps) {
  return (
    <span
      className={`voxel-slot${className ? ` ${className}` : ''}`}
      style={{ width, height, ...style }}
    >
      {shadow && <span className="voxel-shadow" />}
      <span className="voxel-float" style={{ animationDelay: `${delay}s` }}>
        <span
          className="voxel-parallax parallax"
          style={{ '--depth': depth } as CSSProperties}
        >
          {children}
        </span>
      </span>
    </span>
  );
}

/* ---------------- Shared props for item builders ---------------- */

interface BlockProps {
  depth?: number;
  delay?: number;
  shadow?: boolean;
  style?: CSSProperties;
  className?: string;
}

/* ---------------- Block textures ---------------- */

const GRASS_SIDE = (base: string) => `linear-gradient(${base} 0 26%, #8a5a33 26%)`;

/* NOTE: use `ellipse P% P% at X% Y%` — Chromium rejects `circle P% at X% Y%`.
   Positions are in full-square coords; the right face only spans x 50-100%
   and its top edge slopes from (100,25) to (50,50), so pattern rows sit
   below that edge: eyes ~y52, mouth ~y68-76. */
const CREEPER_FACE =
  'radial-gradient(ellipse 13% 13% at 63% 52%, #0b1808 97%, transparent 100%),' +
  'radial-gradient(ellipse 13% 13% at 87% 52%, #0b1808 97%, transparent 100%),' +
  'radial-gradient(ellipse 8% 8% at 66% 68%, #0b1808 97%, transparent 100%),' +
  'radial-gradient(ellipse 8% 8% at 75% 76%, #0b1808 97%, transparent 100%),' +
  'radial-gradient(ellipse 8% 8% at 84% 68%, #0b1808 97%, transparent 100%),' +
  '#3f8c2f';

const NETHER_VEINS = (base: string) =>
  'radial-gradient(ellipse 26% 26% at 32% 38%, #e26a26 55%, transparent 60%),' +
  'radial-gradient(ellipse 18% 18% at 68% 62%, #ff9b3f 55%, transparent 62%),' +
  'radial-gradient(ellipse 12% 12% at 50% 22%, #d9481f 60%, transparent 62%),' +
  base;

const SERVER_FACE = (base: string) =>
  'radial-gradient(ellipse 15% 15% at 78% 48%, #3df0ad 92%, transparent 100%),' +
  'radial-gradient(ellipse 15% 15% at 78% 72%, #3df0ad 92%, transparent 100%),' +
  base;

/* ---------------- Single-block icons ---------------- */

interface BlockBuilderProps extends BlockProps {
  /** Cube edge length in px. */
  size?: number;
}

export function GrassIcon({ size = 26, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top="#74c850"
        right={GRASS_SIDE('#5da63f')}
        left={GRASS_SIDE('#47812f')}
      />
    </VoxelIcon>
  );
}

export function DiamondIcon({ size = 26, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top="#57d9ee"
        right="#23a3c2"
        left="#17718e"
      />
    </VoxelIcon>
  );
}

export function GoldIcon({ size = 26, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top="#ffd75e"
        right="#f2b32c"
        left="#b87f1e"
      />
    </VoxelIcon>
  );
}

export function TntIcon({ size = 26, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top="#c9423a"
        right="linear-gradient(#c23b30 0 36%, #efe3c4 36% 48%, #c23b30 48%)"
        left="linear-gradient(#a02c24 0 36%, #cfc19e 36% 48%, #a02c24 48%)"
      />
    </VoxelIcon>
  );
}

export function CreeperIcon({ size = 26, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top="#4da338"
        right={CREEPER_FACE}
        left="#2c6621"
      />
    </VoxelIcon>
  );
}

export function NetherIcon({ size = 26, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top={NETHER_VEINS('#a8321d')}
        right={NETHER_VEINS('#7c1f12')}
        left={NETHER_VEINS('#5c130b')}
      />
    </VoxelIcon>
  );
}

export function WorldIcon({ size = 26, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top="linear-gradient(#74c850 0 30%, #5da63f 30% 100%)"
        right="#1f7fb8"
        left="#145a86"
      />
    </VoxelIcon>
  );
}

export function ChestIcon({ size = 28, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size + 8} {...props}>
      <Cube
        size={size}
        top="#8a5a33"
        right={
          'radial-gradient(ellipse 8% 8% at 75% 55%, #f6d26b 95%, transparent 100%),' +
          'linear-gradient(90deg, transparent 62%, #e0a53c 62% 88%, transparent 88%),' +
          '#5d3a1e'
        }
        left="linear-gradient(90deg, transparent 12%, #c08c33 12% 38%, transparent 38%) #462b13"
      />
    </VoxelIcon>
  );
}

export function PresentIcon({ size = 30, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 10} height={size + 10} {...props}>
      <Cube
        size={size}
        top="linear-gradient(135deg, transparent 42%, #f6c445 42% 58%, transparent 58%) #d93b34"
        right="linear-gradient(90deg, transparent 62%, #f6c445 62% 88%, transparent 88%) #c02f28"
        left="linear-gradient(90deg, transparent 12%, #f6c445 12% 38%, transparent 38%) #a3241e"
      />
      <Cube
        size={11}
        top="#f6c445"
        right="#e0a53c"
        left="#b87f1e"
        style={{ position: 'absolute', left: size / 2 - 4, top: -5 }}
      />
    </VoxelIcon>
  );
}

export function DragonEggIcon({ size = 28, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 12} height={size + 12} {...props}>
      <Cube
        size={size}
        top="#8f5fe8"
        right="#6f45bd"
        left="#4c2b80"
      />
      <Cube
        size={size * 0.45}
        top="#9a6cf0"
        right="#7c51cf"
        left="#57339a"
        style={{ position: 'absolute', left: size / 2 - size * 0.22, top: -size * 0.28 }}
      />
    </VoxelIcon>
  );
}

export function ServerIcon({ size = 24, ...props }: BlockBuilderProps) {
  return (
    <VoxelIcon width={size + 8} height={size * 2 + 8} {...props}>
      <Cube
        size={size}
        top="#262638"
        right={SERVER_FACE('#16161d')}
        left={SERVER_FACE('#0d0d12')}
        style={{ position: 'absolute', left: 4, top: 0 }}
      />
      <Cube
        size={size}
        top="#262638"
        right={SERVER_FACE('#16161d')}
        left={SERVER_FACE('#0d0d12')}
        style={{ position: 'absolute', left: 4, top: size + 4 }}
      />
    </VoxelIcon>
  );
}

/* ---------------- Composed item icons ---------------- */

export function SwordIcon(props: BlockProps) {
  const blade = { top: '#57d9ee', right: '#23a3c2', left: '#17718e' };
  return (
    <VoxelIcon width={44} height={56} {...props}>
      <Cube {...blade} size={14} style={{ position: 'absolute', left: 4, top: 0 }} />
      <Cube {...blade} size={14} style={{ position: 'absolute', left: 15, top: 11 }} />
      <Cube {...blade} size={14} style={{ position: 'absolute', left: 26, top: 22 }} />
      <Cube
        size={14}
        top="#2a2a38"
        right="#1c1c26"
        left="#101017"
        style={{ position: 'absolute', left: 15, top: 33 }}
      />
      <Cube
        size={14}
        top="#7a4b2a"
        right="#5d3a1e"
        left="#402713"
        style={{ position: 'absolute', left: 15, top: 44 }}
      />
    </VoxelIcon>
  );
}

export function PickaxeIcon(props: BlockProps) {
  const head = { top: '#9aa2b4', right: '#747c90', left: '#4e5567' };
  const handle = { top: '#8a5a33', right: '#6e4526', left: '#4c2d15' };
  return (
    <VoxelIcon width={46} height={52} {...props}>
      <Cube {...head} size={14} style={{ position: 'absolute', left: 2, top: 2 }} />
      <Cube {...head} size={14} style={{ position: 'absolute', left: 30, top: 2 }} />
      <Cube {...handle} size={14} style={{ position: 'absolute', left: 16, top: 16 }} />
      <Cube {...handle} size={14} style={{ position: 'absolute', left: 16, top: 30 }} />
      <Cube {...handle} size={14} style={{ position: 'absolute', left: 16, top: 44 }} />
    </VoxelIcon>
  );
}

export function TridentIcon(props: BlockProps) {
  const t = { top: '#57d9ee', right: '#23a3c2', left: '#17718e' };
  const step = 12;
  return (
    <VoxelIcon width={48} height={56} {...props}>
      {[0, 1, 2].map((i) => (
        <Cube
          key={`prong-${i}`}
          {...t}
          size={12}
          style={{ position: 'absolute', left: 4 + i * 28, top: 0 }}
        />
      ))}
      {[1, 2, 3].map((i) => (
        <Cube
          key={`shaft-${i}`}
          {...t}
          size={12}
          style={{ position: 'absolute', left: 18, top: i * step }}
        />
      ))}
    </VoxelIcon>
  );
}

/* ---------------- Shop cosmetics (3D models) ---------------- */

const pos = (left: number, top: number): CSSProperties => ({ position: 'absolute', left, top });

function CapeShape(colors: { top: string; right: string; left: string }) {
  return [
    [24, 2],
    [18, 14],
    [30, 14],
    [12, 26],
    [24, 26],
    [36, 26],
    [12, 38],
    [24, 38],
    [36, 38],
    [18, 50],
    [30, 50],
  ].map(([l, t], i) => (
    <Cube key={`cape-${i}`} {...colors} size={12} style={pos(l, t)} />
  ));
}

function WingsShape(colors: { top: string; right: string; left: string }) {
  return [
    [26, 2],
    [26, 16],
    [20, 28],
    [32, 28],
    [14, 40],
    [26, 40],
    [38, 40],
    [50, 40],
  ].map(([l, t], i) => (
    <Cube key={`wing-${i}`} {...colors} size={12} style={pos(l, t)} />
  ));
}

export function EmberCapeIcon(props: BlockProps) {
  return (
    <VoxelIcon width={60} height={64} {...props}>
      {CapeShape({ top: '#fb923c', right: '#ea580c', left: '#9a3412' })}
    </VoxelIcon>
  );
}

export function NetherWingsIcon(props: BlockProps) {
  return (
    <VoxelIcon width={62} height={54} {...props}>
      {WingsShape({ top: '#ef4444', right: '#991b1b', left: '#450a0a' })}
      <Cube size={12} top="#f97316" right="#c2410c" left="#7c2d12" style={pos(26, 28)} />
    </VoxelIcon>
  );
}

export function WingsIcon(props: BlockProps) {
  return (
    <VoxelIcon width={62} height={54} {...props}>
      {WingsShape({ top: '#f8fafc', right: '#cbd5e1', left: '#64748b' })}
    </VoxelIcon>
  );
}

export function HaloIcon(props: BlockProps) {
  const gold = { top: '#fbbf24', right: '#d97706', left: '#92400e' };
  return (
    <VoxelIcon width={58} height={58} {...props}>
      {[
        [14, 14],
        [26, 14],
        [38, 14],
        [44, 26],
        [38, 38],
        [26, 38],
        [14, 38],
        [8, 26],
      ].map(([l, t], i) => (
        <Cube key={`halo-${i}`} {...gold} size={12} style={pos(l, t)} />
      ))}
    </VoxelIcon>
  );
}

export function BadgeIcon(props: BlockProps) {
  const star =
    'radial-gradient(ellipse 5% 5% at 66% 44%, #fff7d6 95%, transparent 100%),' +
    'radial-gradient(ellipse 5% 5% at 88% 44%, #fff7d6 95%, transparent 100%),' +
    'radial-gradient(ellipse 5% 5% at 66% 66%, #fff7d6 95%, transparent 100%),' +
    'radial-gradient(ellipse 5% 5% at 88% 66%, #fff7d6 95%, transparent 100%),' +
    '#f2b32c';
  return (
    <VoxelIcon width={58} height={62} {...props}>
      <Cube
        size={18}
        top="#ffd75e"
        right={star}
        left="#b87f1e"
        style={pos(20, 12)}
      />
      <Cube
        size={10}
        top="#c2410c"
        right="#9a3412"
        left="#57150a"
        style={pos(24, 42)}
      />
    </VoxelIcon>
  );
}

export function CrownIcon(props: BlockProps) {
  const gold = { top: '#fbbf24', right: '#d97706', left: '#92400e' };
  const flame = { top: '#fb923c', right: '#ea580c', left: '#9a3412' };
  return (
    <VoxelIcon width={58} height={62} {...props}>
      <Cube {...flame} size={10} style={pos(15, 20)} />
      <Cube {...flame} size={12} style={pos(23, 8)} />
      <Cube {...flame} size={10} style={pos(33, 20)} />
      <Cube {...gold} size={12} style={pos(13, 36)} />
      <Cube {...gold} size={12} style={pos(25, 36)} />
      <Cube {...gold} size={12} style={pos(37, 36)} />
    </VoxelIcon>
  );
}
