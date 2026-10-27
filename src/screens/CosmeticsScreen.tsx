import { useCallback, useEffect, useRef, useState } from 'react';
import { getCosmetics, saveCosmetics } from '../api';
import type { CosmeticsInfo } from '../api';
import { DEFAULT_SKIN_B64, DEFAULT_CAPE_B64 } from '../assets/cosmetics';

/* ---------------------------------------------------------------------------
 * Cosmetics — upload your skin & cape, preview them on an animated 3D player
 * model, and save. The launcher writes the PNGs per username and every launch
 * passes their paths to the game as `-Dflameclient.*` arguments, which the
 * bundled FlameClient mod reads to replace the local player's skin and cape.
 * Astrix Mode accepts the skin only, so its locked loadout stays competitive.
 * -------------------------------------------------------------------------*/

const S = 6; // CSS pixels per Minecraft texture pixel

type UV = [u: number, v: number, w: number, h: number];

interface PartDef {
  key: string;
  w: number; // minecraft px
  h: number;
  d: number;
  x: number; // position inside the 96x192 model box (css px)
  y: number;
  faces: Record<'front' | 'back' | 'right' | 'left' | 'top' | 'bottom', UV>;
  swing?: 'arm' | 'leg';
}

// Standard 64x64 skin UV map. For legacy 64x32 skins the left limbs reuse the
// right-limb coordinates (they don't exist in the legacy layout).
const HEAD: PartDef['faces'] = {
  top: [8, 0, 8, 8], bottom: [16, 0, 8, 8], right: [0, 8, 8, 8],
  front: [8, 8, 8, 8], left: [16, 8, 8, 8], back: [24, 8, 8, 8],
};
const BODY: PartDef['faces'] = {
  top: [20, 16, 8, 4], bottom: [28, 16, 8, 4], right: [16, 20, 4, 12],
  front: [20, 20, 8, 12], left: [28, 20, 4, 12], back: [32, 20, 8, 12],
};
const ARM_R: PartDef['faces'] = {
  top: [44, 16, 4, 4], bottom: [48, 16, 4, 4], right: [40, 20, 4, 12],
  front: [44, 20, 4, 12], left: [48, 20, 4, 12], back: [52, 20, 4, 12],
};
const ARM_L: PartDef['faces'] = {
  top: [36, 48, 4, 4], bottom: [40, 48, 4, 4], right: [32, 52, 4, 12],
  front: [36, 52, 4, 12], left: [40, 52, 4, 12], back: [44, 52, 4, 12],
};
const LEG_R: PartDef['faces'] = {
  top: [4, 16, 4, 4], bottom: [8, 16, 4, 4], right: [0, 20, 4, 12],
  front: [4, 20, 4, 12], left: [8, 20, 4, 12], back: [12, 20, 4, 12],
};
const LEG_L: PartDef['faces'] = {
  top: [20, 48, 4, 4], bottom: [24, 48, 4, 4], right: [16, 52, 4, 12],
  front: [20, 52, 4, 12], left: [24, 52, 4, 12], back: [28, 52, 4, 12],
};

const PARTS: PartDef[] = [
  { key: 'head', w: 8, h: 8, d: 8, x: 24, y: 0, faces: HEAD },
  { key: 'body', w: 8, h: 12, d: 4, x: 24, y: 48, faces: BODY },
  { key: 'armR', w: 4, h: 12, d: 4, x: 0, y: 48, faces: ARM_R, swing: 'arm' },
  { key: 'armL', w: 4, h: 12, d: 4, x: 72, y: 48, faces: ARM_L, swing: 'arm' },
  { key: 'legR', w: 4, h: 12, d: 4, x: 24, y: 120, faces: LEG_R, swing: 'leg' },
  { key: 'legL', w: 4, h: 12, d: 4, x: 48, y: 120, faces: LEG_L, swing: 'leg' },
];

const dataUrl = (b64: string) => (b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function faceTransform(side: PartDef['faces'] extends Record<infer K, UV> ? K : never, w: number, h: number, d: number) {
  const W = w * S, H = h * S, D = d * S;
  switch (side) {
    case 'front':
      return { transform: `translateZ(${D / 2}px)`, width: W, height: H, left: 0, top: 0 };
    case 'back':
      return { transform: `rotateY(180deg) translateZ(${D / 2}px)`, width: W, height: H, left: 0, top: 0 };
    case 'right':
      return { transform: `rotateY(90deg) translateZ(${W / 2}px)`, width: D, height: H, left: (W - D) / 2, top: 0 };
    case 'left':
      return { transform: `rotateY(-90deg) translateZ(${W / 2}px)`, width: D, height: H, left: (W - D) / 2, top: 0 };
    case 'top':
      return { transform: `rotateX(90deg) translateZ(${H / 2}px)`, width: W, height: D, left: 0, top: (H - D) / 2 };
    default: // bottom
      return { transform: `rotateX(-90deg) translateZ(${H / 2}px)`, width: W, height: D, left: 0, top: (H - D) / 2 };
  }
}

export default function CosmeticsScreen({ username, astrixMode = false }: {
  username?: string | null;
  /** Astrix Mode keeps a locked, competitive loadout: the skin uploader is the
   * only cosmetic it accepts, so the cape card and cape are hidden there. */
  astrixMode?: boolean;
}) {
  const [info, setInfo] = useState<CosmeticsInfo | null>(null);
  const [skinSrc, setSkinSrc] = useState<string>(dataUrl(DEFAULT_SKIN_B64));
  const [capeSrc, setCapeSrc] = useState<string>(dataUrl(DEFAULT_CAPE_B64));
  const [skinLegacy, setSkinLegacy] = useState(false);
  const [skinDirty, setSkinDirty] = useState(false);
  const [capeDirty, setCapeDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const skinFileRef = useRef<HTMLInputElement>(null);
  const capeFileRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const capeUpperRef = useRef<HTMLDivElement>(null);
  const capeLowerRef = useRef<HTMLDivElement>(null);
  const limbRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rot = useRef({ rx: -12, ry: -25, drag: false, lastX: 0, lastY: 0, idleAt: 0 });

  // Load saved cosmetics once (fallback: flame defaults).
  useEffect(() => {
    let alive = true;
    getCosmetics().then((res) => {
      if (!alive || !res) return;
      setInfo(res);
      if (res.skin_b64) setSkinDirty(false), setSkinSrc(dataUrl(res.skin_b64));
      if (res.cape_b64) setCapeDirty(false), setCapeSrc(dataUrl(res.cape_b64));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Detect legacy 64x32 skins whenever the skin texture changes.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setSkinLegacy(img.height === 32 && img.width === 64);
    img.src = skinSrc;
  }, [skinSrc]);

  // Animation loop: idle Y-spin + limb swing + cape sway; drag overrides spin.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const r = rot.current;
      const now = performance.now();
      if (!r.drag && now > r.idleAt) r.ry += 0.28;
      if (modelRef.current) {
        modelRef.current.style.transform = `rotateX(${r.rx}deg) rotateY(${r.ry}deg)`;
      }
      const swing = Math.sin(now / 420) * 8;
      const armR = limbRefs.current.armR, armL = limbRefs.current.armL;
      const legR = limbRefs.current.legR, legL = limbRefs.current.legL;
      if (armR) armR.style.transform = `rotateX(${swing}deg)`;
      if (armL) armL.style.transform = `rotateX(${-swing}deg)`;
      if (legR) legR.style.transform = `rotateX(${-swing}deg)`;
      if (legL) legL.style.transform = `rotateX(${swing}deg)`;
      // Cape: two hinged segments draped away from the back (negative X-tilt
      // = the fabric curves backward as it falls), with a gentle sway.
      const sway = Math.sin(now / 700);
      if (capeUpperRef.current) {
        capeUpperRef.current.style.transform = `translateZ(-13px) rotateX(${-10 + sway * 2}deg)`;
      }
      if (capeLowerRef.current) {
        capeLowerRef.current.style.transform = `rotateX(${-14 + sway * 3}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = rot.current;
    r.drag = true;
    r.lastX = e.clientX;
    r.lastY = e.clientY;
    r.idleAt = Number.POSITIVE_INFINITY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = rot.current;
    if (!r.drag) return;
    r.ry += (e.clientX - r.lastX) * 0.5;
    r.rx = clamp(r.rx - (e.clientY - r.lastY) * 0.4, -38, 38);
    r.lastX = e.clientX;
    r.lastY = e.clientY;
  }, []);

  const endDrag = useCallback(() => {
    const r = rot.current;
    r.drag = false;
    r.idleAt = performance.now() + 2500; // resume the idle spin after a pause
  }, []);

  const pickFile = (kind: 'skin' | 'cape') => {
    (kind === 'skin' ? skinFileRef : capeFileRef).current?.click();
  };

  const onFile = (kind: 'skin' | 'cape') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.type !== 'image/png' && !f.name.toLowerCase().endsWith('.png')) {
      setStatus({ ok: false, text: 'Please choose a .png file.' });
      return;
    }
    if (f.size > 1_200_000) {
      setStatus({ ok: false, text: 'Image is too large — keep it under ~1 MB.' });
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const url = String(fr.result);
      if (kind === 'skin') {
        setSkinSrc(url);
        setSkinDirty(true);
      } else {
        setCapeSrc(url);
        setCapeDirty(true);
      }
      setStatus({ ok: true, text: `${kind === 'skin' ? 'Skin' : 'Cape'} loaded — hit SAVE to apply it in-game.` });
    };
    fr.readAsDataURL(f);
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    setStatus(null);
    const strip = (d: string) => (d.startsWith('data:') ? d.split(',')[1] : d);
    const res = await saveCosmetics(skinDirty ? strip(skinSrc) : null, capeDirty ? strip(capeSrc) : null);
    setSaving(false);
    if (!res) {
      setStatus({ ok: false, text: 'Could not reach the launcher backend.' });
      return;
    }
    if (!res.ok) {
      setStatus({ ok: false, text: res.error || 'Save failed.' });
      return;
    }
    const what = res.saved?.length ? res.saved.join(' & ') : 'cosmetics';
    setStatus({
      ok: true,
      text: `Saved! Your ${what} now load in-game as ${info?.username || username || 'your player'}.`,
    });
    setSkinDirty(false);
    setCapeDirty(false);
  };

  const texSize = skinLegacy ? { w: 64, h: 32 } : { w: 64, h: 64 };
  const faceUV = (part: PartDef, side: keyof PartDef['faces']): UV => {
    // Legacy skins have no left-limb texture — reuse the right-limb one.
    if (skinLegacy && (part.key === 'armL' || part.key === 'legL')) {
      return (part.key === 'armL' ? ARM_R : LEG_R)[side];
    }
    return part.faces[side];
  };

  return (
    <div className="screen cosmetics-screen">
      <header className="screen-head">
        <h1>COSMETICS</h1>
        <p>
          {astrixMode
            ? 'Upload your skin, check it on the 3D preview, then hit SAVE. Astrix Mode applies your skin only.'
            : 'Upload your skin & cape, watch them on the 3D preview, then hit SAVE.'}{
            ' '}Saved cosmetics load in-game on 1.21.11 · 1.21.1 · 1.21 · 1.20.1 · 1.20 and in Astrix Mode.
        </p>
      </header>

      <div className="cosmetics-grid">
        <section
          className="p3d-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <div className="p3d-perspective">
            <div className="p3d-model" ref={modelRef}>
              {PARTS.map((p) => (
                <div
                  key={p.key}
                  className={`p3d-part${p.swing ? ' p3d-limb' : ''}`}
                  ref={(el) => {
                    if (p.swing) limbRefs.current[p.key] = el;
                  }}
                  style={{ width: p.w * S, height: p.h * S, left: p.x, top: p.y }}
                >
                  {(Object.keys(p.faces) as (keyof PartDef['faces'])[]).map((side) => {
                    const uv = faceUV(p, side);
                    const ft = faceTransform(side, p.w, p.h, p.d);
                    return (
                      <div
                        key={side}
                        className="p3d-face"
                        style={{
                          ...ft,
                          backgroundImage: `url(${skinSrc})`,
                          backgroundSize: `${texSize.w * S}px ${texSize.h * S}px`,
                          backgroundPosition: `${-uv[0] * S}px ${-uv[1] * S}px`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
              {/* Cape: two hinged 3D segments (3px thick) draping away from
                  the back — the bend keeps it reading as cloth from every
                  angle instead of a flat sword-like plane. Astrix Mode only
                  draws the skin. */}
              {!astrixMode && <div className="p3d-cape-seg" ref={capeUpperRef} style={{ width: 60, height: 48, left: 18, top: 50 }}>
                <div
                  className="p3d-face"
                  style={{
                    width: 60, height: 48, left: 0, top: 0, transform: 'translateZ(1.5px)',
                    backgroundImage: `url(${capeSrc})`,
                    backgroundSize: '192px 96px',
                    backgroundPosition: '-3px -3px',
                  }}
                />
                <div
                  className="p3d-face"
                  style={{
                    width: 60, height: 48, left: 0, top: 0, transform: 'rotateY(180deg) translateZ(1.5px)',
                    backgroundImage: `url(${capeSrc})`,
                    backgroundSize: '192px 96px',
                    backgroundPosition: '-3px -3px',
                  }}
                />
                <div className="p3d-cape-seg" ref={capeLowerRef} style={{ width: 60, height: 48, left: 0, top: 48 }}>
                  <div
                    className="p3d-face"
                    style={{
                      width: 60, height: 48, left: 0, top: 0, transform: 'translateZ(1.5px)',
                      backgroundImage: `url(${capeSrc})`,
                      backgroundSize: '192px 96px',
                      backgroundPosition: '-3px -51px',
                    }}
                  />
                  <div
                    className="p3d-face"
                    style={{
                      width: 60, height: 48, left: 0, top: 0, transform: 'rotateY(180deg) translateZ(1.5px)',
                      backgroundImage: `url(${capeSrc})`,
                      backgroundSize: '192px 96px',
                      backgroundPosition: '-3px -51px',
                    }}
                  />
                </div>
              </div>}
            </div>
            <div className="p3d-shadow" />
          </div>
          <span className="p3d-hint">DRAG TO ROTATE</span>
        </section>

        <aside className="cosmetics-panel">
          <div className="cosmetic-card">
            <div className="cosmetic-info">
              <b>SKIN</b>
              <span>Standard 64×64 (or 64×32) .png</span>
              {skinDirty && <em>unsaved</em>}
            </div>
            <button className="cosmetic-upload" onClick={() => pickFile('skin')}>
              UPLOAD
            </button>
            <input
              ref={skinFileRef}
              type="file"
              accept="image/png"
              style={{ display: 'none' }}
              onChange={onFile('skin')}
            />
          </div>

          {!astrixMode && (
            <div className="cosmetic-card">
              <div className="cosmetic-info">
                <b>CAPE</b>
                <span>Standard 64×32 .png</span>
                {capeDirty && <em>unsaved</em>}
              </div>
              <button className="cosmetic-upload" onClick={() => pickFile('cape')}>
                UPLOAD
              </button>
              <input
                ref={capeFileRef}
                type="file"
                accept="image/png"
                style={{ display: 'none' }}
                onChange={onFile('cape')}
              />
            </div>
          )}

          <button className="cosmetic-save" onClick={onSave} disabled={saving}>
            {saving ? 'SAVING…' : 'SAVE'}
          </button>

          {status && <div className={`cosmetic-status ${status.ok ? 'ok' : 'err'}`}>{status.text}</div>}

          <p className="cosmetics-note">
            Cosmetics are saved for <b>{info?.username || username || 'your account'}</b> only and load through the
            built-in skin engine — FlameClient&apos;s own mod reads the files the launcher hands the game at start-up,
            on every version and in Astrix Mode. No third-party skin loader is downloaded.
          </p>
        </aside>
      </div>
    </div>
  );
}
