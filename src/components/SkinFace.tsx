import { useEffect, useState } from 'react';
import { getCosmetics } from '../api';

/**
 * The Minecraft account's own head, used as the launcher's avatar.
 *
 * The uploaded skin (Cosmetics → SAVE) is a 64x64 texture whose head front is
 * the 8x8 block at (8, 8), so the face is drawn with that block of the sheet
 * scaled up and clipped to the element — pixel-for-pixel the player's skin,
 * and it works for offline accounts too (mc-heads only knows premium names).
 */
let cachedSkin: string | null = null;
let inflight: Promise<string | null> | null = null;

function loadSkin(): Promise<string | null> {
  if (cachedSkin) return Promise.resolve(cachedSkin);
  if (!inflight) {
    inflight = getCosmetics()
      .then((c) => {
        // Only successful loads are cached: if the backend was still waking up
        // the next mount retries instead of showing a default face forever.
        if (c?.skin_b64) cachedSkin = c.skin_b64;
        return cachedSkin;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export default function SkinFace({ username, size = 26 }: { username: string; size?: number }) {
  const [skin, setSkin] = useState<string | null>(cachedSkin);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSkin().then((b64) => {
      if (alive && b64) setSkin(b64);
    });
    return () => {
      alive = false;
    };
  }, [username]);

  if (skin) {
    return (
      <span
        className="skin-face"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(data:image/png;base64,${skin})`,
          // 64px sheet at 8px per face → 8x the size, offset one face in.
          backgroundSize: `${size * 8}px ${size * 8}px`,
          backgroundPosition: `-${size}px -${size}px`,
        }}
        aria-hidden="true"
      />
    );
  }

  if (!broken) {
    return (
      <img
        className="skin-face"
        src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size * 2}`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span className="skin-face skin-face-fallback" style={{ width: size, height: size }} aria-hidden="true">
      {username.slice(0, 1).toUpperCase()}
    </span>
  );
}
