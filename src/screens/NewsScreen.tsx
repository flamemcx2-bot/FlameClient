import { useEffect, useState } from 'react';
import { NEWS, ASTRIX_NEWS } from '../data';
import NewsGrid from '../components/NewsGrid';
import { getNews, openExternal } from '../api';
import type { WebNewsPost } from '../api';

interface NewsScreenProps {
  astrixMode?: boolean;
}

/**
 * FlameClient News (normal mode) / Astrix News (Astrix Mode).
 *
 * Only real published cards are shown — the same list the dashboard's
 * "Latest News" section renders, so nothing can drift and no placeholder or
 * invented articles are ever displayed. Website posts (written in the admin
 * portal) are appended below, banner + title only — clicking one opens the
 * full article on the FlameClient website.
 */
export default function NewsScreen({ astrixMode = false }: NewsScreenProps) {
  const cards = astrixMode ? ASTRIX_NEWS : NEWS;
  const [webPosts, setWebPosts] = useState<WebNewsPost[] | null>(null);

  useEffect(() => {
    if (astrixMode) return;
    let alive = true;
    getNews().then((p) => alive && setWebPosts(p));
    return () => {
      alive = false;
    };
  }, [astrixMode]);

  return (
    <div className="screen">
      <div className="screen-head">
        <h1 className="screen-title">{astrixMode ? 'Astrix News' : 'FlameClient News'}</h1>
        <p className="screen-sub">
          {astrixMode
            ? 'FlameClient x AstrixPvP — partner news, events and server updates'
            : 'Client updates and partner announcements'}
        </p>
      </div>

      {cards.length > 0 ? (
        <NewsGrid cards={cards} large />
      ) : (
        <p className="pack-empty-sub">No news yet — check back soon.</p>
      )}

      {!astrixMode && webPosts !== null && webPosts.length > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title">From the Website</h2>
          </div>
          <div className="news-grid news-grid-lg">
            {webPosts.map((p) => (
              <button
                key={p.id}
                className="news-card news-card-lg web-news-card"
                onClick={() => openExternal(p.url)}
                title={`${p.title} — read on flameclient.web.app`}
              >
                {p.banner && <img className="web-news-banner" src={p.banner} alt="" loading="lazy" />}
                <span className="news-text">
                  <b>{p.title}</b>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
