import { useCallback, useEffect, useMemo, useState } from 'react';
import { TIER_QUEUE } from '../data';
import { TIER_ART } from '../components/art';
import { DiscordIcon } from '../components/icons';
import { getTiers, joinTier, leaveTier } from '../api';
import type { DiscordProfile, TierState } from '../api';
import type { TierCard } from '../types';

interface TierQueueScreenProps {
  /** Whether a Discord account is linked (the backend owns that truth). */
  linked: boolean;
  user: DiscordProfile | null;
  /** Opens the "login with Discord" gate. */
  onConnect: () => void;
}

interface Notice {
  ok: boolean;
  text: string;
}

/**
 * What joining does next depends on whether the client is open: the Astrix mod
 * watches the launcher's hand-off file, so a running game is queued within a
 * couple of seconds (chat line and Discord DM included), while a launch hands
 * the selection over as it connects.
 */
function joinedNotice(label: string, res: TierState): string {
  if (res.already) return `You are already in the ${label} queue`;
  return res.game_running
    ? `You have joined the ${label} queue \u2014 the server has you in it now`
    : `You have joined the ${label} queue \u2014 the Astrix server does it when you connect`;
}

function leftNotice(label: string, res: TierState): string {
  return res.game_running
    ? `You have left the ${label} queue \u2014 the server dropped it`
    : `You have left the ${label} queue`;
}

/**
 * Astrix Mode — Tier Queue.
 *
 * Eleven tier cards backed by real queue state: the join lives in config.json
 * under the linked Discord account's id (python_launcher/launcher.py), so it
 * survives switching tabs, re-logins and launcher restarts. Entering the tab
 * requires a linked Discord account, and every card says so out loud when one
 * is joined ("You have joined the VANILLA queue").
 *
 * A joined card stops being an invitation: its art dims back and a live clock
 * sitting on the art counts up from the moment of the join — days, hours,
 * minutes and seconds spent waiting in that queue.
 */
export default function TierQueueScreen({ linked, user, onConnect }: TierQueueScreenProps) {
  const [state, setState] = useState<TierState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  /* Drives the wait clocks. One tick a second, and only while something is
     queued — an idle tab costs nothing. */
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setState(await getTiers());
  }, []);

  useEffect(() => {
    load();
  }, [load, linked]);

  // A notice is a moment, not a state: it fades out on its own.
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const joined = useMemo(() => new Set(state?.joined ?? []), [state]);
  const joinedCount = joined.size;

  useEffect(() => {
    if (joinedCount === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [joinedCount]);

  const join = async (card: TierCard) => {
    setBusy(card.id);
    const res = await joinTier(card.id);
    setBusy(null);
    if (!res) {
      setNotice({ ok: false, text: 'The launcher backend is not reachable.' });
      return;
    }
    if (!res.ok) {
      setNotice({ ok: false, text: res.error || 'Could not join that queue.' });
      if (res.needs_discord) onConnect();
      return;
    }
    setState(res);
    setNotice({ ok: true, text: joinedNotice(card.label, res) });
  };

  const leave = async (card: TierCard) => {
    setBusy(card.id);
    const res = await leaveTier(card.id);
    setBusy(null);
    if (!res) {
      setNotice({ ok: false, text: 'The launcher backend is not reachable.' });
      return;
    }
    if (!res.ok) {
      setNotice({ ok: false, text: res.error || 'Could not leave that queue.' });
      return;
    }
    setState(res);
    setNotice({ ok: true, text: leftNotice(card.label, res) });
  };

  return (
    <div className="screen">
      <div className="screen-head">
        <h1 className="screen-title">Tier Queue</h1>
        <p className="screen-sub">
          FlameClient x AstrixPvP — pick a tier to join its queue.
        </p>
      </div>

      {!linked ? (
        <div className="tier-gate">
          <div className="discord-gate-mark">
            <DiscordIcon size={28} />
          </div>
          <h2 className="discord-gate-title">TIER QUEUE NEEDS DISCORD</h2>
          <p className="discord-gate-sub">
            Queues follow a real Discord account, so the tab unlocks once yours is
            connected. It takes a few seconds and only has to be done once.
          </p>
          <button className="discord-gate-cta" onClick={onConnect}>
            <DiscordIcon size={18} />
            LOGIN WITH DISCORD
          </button>
        </div>
      ) : (
        <>
          <div className="tier-bar">
            <div className="tier-account">
              {user?.avatar_url ? (
                <img className="tier-avatar" src={user.avatar_url} alt="" />
              ) : (
                <span className="tier-avatar tier-avatar-fallback">
                  <DiscordIcon size={18} />
                </span>
              )}
              <div className="tier-account-text">
                <span className="tier-account-name">
                  {user?.display_name || user?.username || 'Discord'}
                </span>
                <span className="tier-account-handle">
                  {user?.username ? `@${user.username}` : 'linked'}
                </span>
              </div>
            </div>
            <span className="tier-count">
              {joinedCount === 0 ? 'NOT IN ANY QUEUE' : `IN ${joinedCount} OF ${TIER_QUEUE.length} QUEUES`}
            </span>
          </div>

          {notice && (
            <div className={`tier-notice ${notice.ok ? 'ok' : 'bad'}`} role="status">
              {notice.text}
            </div>
          )}

          <div className="tier-grid">
            {TIER_QUEUE.map((card) => {
              const inQueue = joined.has(card.id);
              const waited = inQueue ? waitFor(state?.joined_at?.[card.id], now) : null;
              return (
                <div key={card.id} className={`tier-card ${inQueue ? 'is-joined' : ''}`}>
                  <img
                    className="tier-card-art"
                    src={TIER_ART[card.id]}
                    alt={card.label}
                    draggable={false}
                  />
                  <span className="tier-card-shade" aria-hidden="true" />
                  <span className="tier-card-name">{card.label}</span>
                  {inQueue ? (
                    <>
                      <span className="tier-card-pill">IN QUEUE</span>
                      {waited && (
                        <span className="tier-card-timer" title={waited.spoken}>
                          <span className="tier-card-timer-label">IN QUEUE FOR</span>
                          <span className="tier-card-timer-value">{waited.clock}</span>
                        </span>
                      )}
                      <button
                        className="tier-card-action leave"
                        onClick={() => leave(card)}
                        disabled={busy === card.id}
                      >
                        {busy === card.id ? '…' : 'LEAVE'}
                      </button>
                    </>
                  ) : (
                    <button
                      className="tier-card-action join"
                      onClick={() => join(card)}
                      disabled={busy === card.id}
                    >
                      {busy === card.id ? 'JOINING…' : 'JOIN QUEUE'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * How long a card has been sitting in its queue, as three strings:
 *  - clock:  what the card shows, ticked once a second
 *  - spoken: the same time in words, for the tooltip (and screen readers)
 * Returns null while the join timestamp is missing, so a stale or hand-edited
 * config.json draws a plain card instead of a wrong clock.
 */
function waitFor(at: number | undefined, now: number) {
  if (!at || !Number.isFinite(at)) return null;
  const total = Math.max(0, Math.floor(now / 1000 - at));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  const clock = (d > 0 ? `${d}d ` : '') + `${two(h)}h ${two(m)}m ${two(s)}s`;
  const speak = (n: number, unit: string) =>
    n > 0 ? `${n} ${unit}${n === 1 ? '' : 's'}` : '';
  const parts = [speak(d, 'day'), speak(h, 'hour'), speak(m, 'minute'), speak(s, 'second')]
    .filter(Boolean)
    .join(' ');
  return { clock, spoken: 'In queue for ' + (parts || 'less than a second') };
}
