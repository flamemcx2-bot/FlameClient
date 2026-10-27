import { useRef, useCallback, type ReactNode } from 'react';

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'button';
  style?: React.CSSProperties;
  onClick?: () => void;
  maxTilt?: number;
}

export default function Tilt3D({
  children,
  className,
  as: Tag = 'div',
  style,
  onClick,
  maxTilt = 10,
}: Tilt3DProps) {
  const ref = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--rotate-x', `${-y * maxTilt}deg`);
      el.style.setProperty('--rotate-y', `${x * maxTilt}deg`);
      el.style.setProperty('--mx', `${(x + 0.5).toFixed(3)}`);
      el.style.setProperty('--my', `${(y + 0.5).toFixed(3)}`);
    },
    [maxTilt],
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rotate-x', '0deg');
    el.style.setProperty('--rotate-y', '0deg');
    el.style.setProperty('--mx', '0.5');
    el.style.setProperty('--my', '0.5');
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={style}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Tag>
  );
}