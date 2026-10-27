import { useCallback, useEffect, useRef, useState } from 'react';
import { DiscordIcon } from './icons';
import { cancelDiscordLink, getDiscord, startDiscordLink } from '../api';
import type { DiscordState } from '../api';

interface DiscordLinkModalProps {
  /** The Discord account just linked — the caller can open the Tier Queue. */
  onLinked: (state: DiscordState) => void;
  onClose: () => void;
}

/**
 * "Login with Discord" gate for Astrix Mode's Tier Queue.
 *
 * The sign-in is Discord's own OAuth page, opened in the real browser: the
 * backend catches the redirect on its own loopback port, so the launcher never
 * sees a password and never stores an access token — only the account's id,
 * name and avatar. While the tab is open this polls /api/discord and calls
 * onLinked the moment the link lands.
 */
export default function DiscordLinkModal({ onLinked, onClose }: DiscordLinkModalProps) {
  const [state, setState] = useState<DiscordState | null>(null);
  const [starting, setStarting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showUris, setShowUris] = useState(false);
  const doneRef = useRef(false);

  const finish = useCallback(
    (d: DiscordState) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onLinked(d);
    },
    [onLinked],
  );

  // Read what is already true before drawing anything: an account that got
  // linked (or a sign-in already waiting) resumes instead of restarting.
  useEffect(() => {
    let alive = true;
    getDiscord().then((d) => {
      if (!alive || !d) return;
      setState(d);
      if (d.linked) finish(d);
      else if (d.pending) setWaiting(true);
    });
    return () => {
      alive = false;
    };
  }, [finish]);

  // Poll while the browser tab is open — the backend flips `linked` the moment
  // Discord's redirect reaches the loopback port.
  useEffect(() => {
    if (!waiting) return;
    let alive = true;
    const id = window.setInterval(async () => {
      const d = await getDiscord();
      if (!alive || !d) return;
      setState(d);
      if (d.linked) {
        finish(d);
        return;
      }
      if (d.error) {
        setWaiting(false);
        setMessage(d.error);
      } else if (!d.pending) {
        setWaiting(false);
        setMessage('The Discord sign-in timed out — try again.');
      }
    }, 1500);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [waiting, finish]);

  // Escape cancels, exactly like the CANCEL button (including the backend
  // wait, so a later redirect cannot link after the user said no).
  const close = useCallback(() => {
    if (waiting) cancelDiscordLink();
    onClose();
  }, [waiting, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const start = async () => {
    setStarting(true);
    setMessage(null);
    const res = await startDiscordLink();
    setStarting(false);
    if (!res) {
      setMessage('The launcher backend is not reachable — start Flame Client normally.');
      return;
    }
    setState(res);
    if (res.linked) {
      finish(res);
      return;
    }
    if (res.ok === false) {
      setMessage(res.error || 'Discord could not be opened.');
      return;
    }
    setWaiting(true);
  };

  const seconds = state?.pending ? state.expires_in : 0;
  const uris = state?.redirect_uris ?? [];

  return (
    <div className="discord-gate-backdrop" onClick={close}>
      <div
        className="discord-gate"
        role="dialog"
        aria-modal="true"
        aria-label="Connect Discord"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="discord-gate-mark">
          <DiscordIcon size={30} />
        </div>
        <h2 className="discord-gate-title">CONNECT DISCORD</h2>
        <p className="discord-gate-sub">
          The Tier Queue is tied to your Discord account. Connect it once and the
          tab opens straight away from then on.
        </p>

        {waiting ? (
          <div className="discord-gate-wait">
            <span className="discord-gate-spinner" />
            <div>
              <b>Waiting for Discord…</b>
              <div className="discord-gate-wait-sub">
                Finish signing in in the browser tab we just opened — the last
                step is FlameClient's own page, which hands it to the launcher
                by itself. If the browser asks about local network access,
                allow it.
                {seconds > 0 && ` This link expires in ${fmt(seconds)}.`}
              </div>
            </div>
          </div>
        ) : (
          <button className="discord-gate-cta" onClick={start} disabled={starting}>
            <DiscordIcon size={18} />
            {starting ? 'OPENING DISCORD…' : 'LOGIN WITH DISCORD'}
          </button>
        )}

        {message && <p className="discord-gate-error">{message}</p>}

        {(waiting || message) && (
          <div className="discord-gate-links">
            <button className="discord-gate-link" onClick={start} disabled={starting}>
              OPEN DISCORD AGAIN
            </button>
            {uris.length > 0 && (
              <button className="discord-gate-link" onClick={() => setShowUris((v) => !v)}>
                {showUris ? 'HIDE REDIRECT URLS' : 'REDIRECT URL NOT REGISTERED?'}
              </button>
            )}
          </div>
        )}

        {showUris && uris.length > 0 && (
          <div className="discord-gate-uris">
            <p>
              Discord only redirects back to URLs registered on the application
              (Developer Portal → OAuth2 → Redirects). Add this one once — the
              page passes the sign-in straight to this launcher:
            </p>
            {uris.map((u) => (
              <code key={u}>{u}</code>
            ))}
          </div>
        )}

        <button className="discord-gate-cancel" onClick={close}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = Math.max(0, total % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
