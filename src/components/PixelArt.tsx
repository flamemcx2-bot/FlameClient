interface PixelArtProps {
  map: string[];
  palette: Record<string, string>;
  size?: number;
  className?: string;
}

/** Renders a grid of characters as crisp pixel art (SVG rects). */
export default function PixelArt({ map, palette, size = 32, className }: PixelArtProps) {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = map[y][x];
      if (ch === '.' || ch === ' ') continue;
      const fill = palette[ch];
      if (!fill) continue;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    }
  }
  return (
    <svg
      className={className}
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={(size * rows) / cols}
      shapeRendering="crispEdges"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}
