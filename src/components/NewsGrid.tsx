import { useCallback, useEffect, useState } from 'react';
import Tilt3D from './Tilt3D';
import { CloseIcon } from './icons';
import type { NewsCard } from '../types';
import {
  NEWS_ART_IMAGE,
  Flame210Art,
  Flame101Art,
  AstrixPartnerArt,
  CodeonHostingArt,
  AstrixDiscordArt,
  AstrixHostingArt,
  AstrixServerArt,
  AstrixTierlistArt,
} from './art';

/**
 * One card renderer for every news surface: the dashboard's "Latest News" and
 * the News tab. Both read the same card list from `data.ts` so they can never
 * drift apart — and every card now uses real artwork, so no floating voxel
 * icons are layered on top of the images.
 */
const NEWS_ART: Record<string, React.ComponentType<{ className?: string }>> = {
  'flame-2-1-0': Flame210Art,
  'astrix-partners': AstrixPartnerArt,
  'flame-1-0-1': Flame101Art,
  'codeon-hosting': CodeonHostingArt,
  'astrix-discord': AstrixDiscordArt,
  'astrix-hosting': AstrixHostingArt,
  'astrix-server': AstrixServerArt,
  'astrix-tierlist': AstrixTierlistArt,
};

interface NewsGridProps {
  cards: NewsCard[];
  /** Bigger tiles for the full News page. */
  large?: boolean;
}

export default function NewsGrid({ cards, large = false }: NewsGridProps) {
  // Card currently shown enlarged, or null when the lightbox is closed.
  const [zoomed, setZoomed] = useState<NewsCard | null>(null);
  const close = useCallback(() => setZoomed(null), []);

  // Escape closes the enlarged view. Bound only while it is open.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, close]);

  return (
    <>
      <div className={`news-grid ${large ? 'news-grid-lg' : ''}`}>
        {cards.map((n) => {
          const Art = NEWS_ART[n.art];
          return (
            <Tilt3D
              key={n.id}
              as="button"
              className={`news-card ${large ? 'news-card-lg' : ''}`}
              maxTilt={8}
              onClick={() => setZoomed(n)}
            >
              {Art ? <Art /> : null}
              {n.badge && <span className="news-badge">{n.badge}</span>}
              <span className="news-text">
                <span className="news-title">{n.title}</span>
                {n.subtitle && <span className="news-sub">{n.subtitle}</span>}
              </span>
            </Tilt3D>
          );
        })}
      </div>

      {zoomed && (
        <div
          className="overlay news-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${zoomed.title} ${zoomed.subtitle ?? ''}`.trim()}
          onClick={close}
        >
          <button className="modal-close" onClick={close} title="Close" aria-label="Close">
            <CloseIcon size={18} />
          </button>
          <img
            className="news-lightbox-img"
            src={NEWS_ART_IMAGE[zoomed.art]}
            alt={`${zoomed.title} ${zoomed.subtitle ?? ''}`.trim()}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
