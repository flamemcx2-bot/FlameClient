import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeScreen from './screens/HomeScreen';
import VersionsScreen from './screens/VersionsScreen';
import ModsScreen from './screens/ModsScreen';
import NewsScreen from './screens/NewsScreen';
import ServersScreen from './screens/ServersScreen';
import ShopScreen from './screens/ShopScreen';
import CosmeticsScreen from './screens/CosmeticsScreen';
import OptimizerScreen from './screens/OptimizerScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import FriendsScreen from './screens/FriendsScreen';
import LoginScreen from './screens/LoginScreen';
import TierQueueScreen from './screens/TierQueueScreen';
import DiscordLinkModal from './components/DiscordLinkModal';
import type { Screen, FriendsData } from './types';
import { DEFAULT_VERSION, LAUNCHER_DISPLAY_VERSION } from './data';
import {
  getStatus,
  getFriends,
  acceptFriend,
  logout,
  getUpdate,
  checkForUpdate,
  installUpdate,
  openDownloadPage,
} from './api';
import type { LauncherStatus, UpdateInfo, DiscordProfile } from './api';
import ModeTransition from './components/ModeTransition';
import UpdateToast from './components/UpdateToast';

interface Toast {
  id: number;
  kind: 'request' | 'dm' | 'playing';
  username: string;
  count?: number;
}

const ASTRIX_KEY = 'flame.astrix-mode';
// Version the user pressed LATER on — we don't nag again for that release.
const UPDATE_LATER_KEY = 'flame.update-skipped';
// Auto update check can be turned off in Settings.
const UPDATE_AUTO_KEY = 'flame.update-check';
const UPDATE_INTERVAL = 15 * 60 * 1000;

function updateAutoEnabled() {
  try {
    return localStorage.getItem(UPDATE_AUTO_KEY) !== '0';
  } catch {
    return true;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [astrixMode, setAstrixMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ASTRIX_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [selectedVersion, setSelectedVersion] = useState(DEFAULT_VERSION);
  const [status, setStatus] = useState<LauncherStatus | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [gameRunning, setGameRunning] = useState(false);
  const [friends, setFriends] = useState<FriendsData | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dmTarget, setDmTarget] = useState<string | null>(null);
  // 'astrix' | 'flame' while the switch VFX plays, null when idle.
  const [modeFx, setModeFx] = useState<null | 'astrix' | 'flame'>(null);

  // Astrix Mode's Tier Queue is gated behind a linked Discord account. The
  // backend is the source of truth; this mirrors it from the status poll.
  const [discord, setDiscord] = useState<DiscordProfile | null>(null);
  const [discordGate, setDiscordGate] = useState(false);

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateSkipped, setUpdateSkipped] = useState<string | null>(() => {
    try {
      return localStorage.getItem(UPDATE_LATER_KEY);
    } catch {
      return null;
    }
  });

  const lastReqRef = useRef<Set<string>>(new Set());
  const lastUnreadRef = useRef<Record<string, number>>({});
  // Friends already seen in-game. null until the first poll lands, so opening
  // the launcher doesn't replay a toast for everyone who is already playing.
  const lastPlayingRef = useRef<Set<string> | null>(null);
  const toastIdRef = useRef(0);
  // Synchronous lock so even same-tick double-clicks can't re-trigger the
  // mode switch while the VFX transition is playing.
  const modeFxLockRef = useRef(false);
  // When the Discord link landed. A status snapshot requested before that
  // moment must not undo it (see the status tick below).
  const linkedAtRef = useRef(0);

  // Astrix Mode hides the Shop / Mods tabs; if we're on one when the mode
  // flips, fall back to the home screen. A VFX transition plays between the
  // two modes and switching is locked while it runs — no spam.
  const toggleAstrixMode = useCallback(() => {
    if (modeFxLockRef.current) return; // transition already in progress
    modeFxLockRef.current = true;
    const toAstrix = !astrixMode;
    setModeFx(toAstrix ? 'astrix' : 'flame');
    setAstrixMode(toAstrix);
    try {
      localStorage.setItem(ASTRIX_KEY, toAstrix ? '1' : '0');
    } catch {
      /* ignore */
    }
    // Shop/Mods only exist outside Astrix Mode; the Tier Queue only exists
    // inside it — leaving either screen behind falls back to the dashboard.
    setScreen((s) =>
      s === 'shop' || s === 'mods' || (!toAstrix && s === 'tierqueue') ? 'home' : s,
    );
    window.setTimeout(() => {
      modeFxLockRef.current = false;
      setModeFx(null);
    }, 1450);
  }, [astrixMode]);

  const navigate = useCallback(
    (s: Screen) => {
      // Shop and Mods don't exist in Astrix Mode.
      if (astrixMode && (s === 'shop' || s === 'mods')) return;
      // The Tier Queue asks for a Discord account before it lets you in — and
      // it asks for real, rather than just refusing: linking lands you in the
      // tab. Without a backend there is nothing to link against, so the tab
      // stays reachable (mock mode).
      if (s === 'tierqueue' && status !== null && !discord) {
        setDiscordGate(true);
        return;
      }
      setScreen(s);
    },
    [astrixMode, status, discord],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (kind: Toast['kind'], username: string, count?: number) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, kind, username, count }]);
      window.setTimeout(() => dismissToast(id), 9000);
    },
    [dismissToast],
  );

  // Fetch friends + fire toasts for new requests / new DMs.
  const refreshFriends = useCallback(
    async (s: LauncherStatus | null) => {
      const fd = await getFriends();
      if (!fd || !fd.ok || !fd.me) return;
      setFriends(fd);
      if (s?.notifications_enabled !== false) {
        for (const r of fd.requests) {
          if (!lastReqRef.current.has(r.username)) {
            pushToast('request', r.username);
          }
        }
        const seen = lastUnreadRef.current;
        for (const [u, n] of Object.entries(fd.dm_unread)) {
          if (n > (seen[u] ?? 0)) {
            pushToast('dm', u, n);
          }
        }
      }
      // "A friend started playing" — one toast per transition into in-game.
      const nowPlaying = new Set(
        fd.friends.filter((f) => f.playing).map((f) => f.username),
      );
      const before = lastPlayingRef.current;
      if (before && s?.notifications_playing !== false) {
        for (const u of nowPlaying) {
          if (!before.has(u)) pushToast('playing', u);
        }
      }
      lastPlayingRef.current = nowPlaying;
      lastReqRef.current = new Set(fd.requests.map((r) => r.username));
      lastUnreadRef.current = { ...fd.dm_unread };
    },
    [pushToast],
  );

  // Poll the backend so auth state stays fresh and we notice when the game
  // exits — that's when the launcher window comes back (it auto-hides on
  // launch, see HomeScreen). Friends + toasts ride on the same tick.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const askedAt = Date.now();
      const s = await getStatus();
      if (!alive || !s) return;
      setStatus(s);
      // Backend reachable: apply its auth state. Backend unreachable: run as a mock (no login).
      if (s.authed) {
        setUsername(s.username);
        refreshFriends(s);
      } else {
        setUsername(null);
        setFriends(null);
        lastReqRef.current = new Set();
        lastUnreadRef.current = {};
        lastPlayingRef.current = null;
      }
      // Ignore a snapshot that was requested before the link completed — it
      // would clear a Discord account the user just connected.
      if (askedAt >= linkedAtRef.current) {
        setDiscord(s.discord_linked ? s.discord_user ?? null : null);
      }
      setGameRunning((prev) => {
        if (!prev && s.game_running) {
          // Game process appeared → hide the launcher window. Launching is
          // asynchronous now, so this is the only reliable moment to hide;
          // the Launch Logs window stays open on its own.
          (window as any).pywebview?.api?.hide?.();
        }
        if (prev && !s.game_running) {
          // Game closed → bring the launcher window back.
          (window as any).pywebview?.api?.show?.();
        }
        return !!s.game_running;
      });
    };
    tick();
    const id = window.setInterval(tick, 3000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [refreshFriends]);

  // ---- Update checker -------------------------------------------------
  // The backend polls the published latest.json feed; here we surface the
  // result as a notification and can download + start the new setup.
  const loadUpdate = useCallback(async (force = false) => {
    const info = force ? await checkForUpdate() : await getUpdate();
    if (info) setUpdateInfo(info);
  }, []);

  const download = updateInfo?.download ?? null;
  const downloading = download?.state === 'downloading';
  const latest = updateInfo?.latest ?? null;
  const showUpdate = !!updateInfo?.available && !!latest && latest !== updateSkipped;

  const skipUpdate = useCallback(() => {
    if (!latest) return;
    setUpdateSkipped(latest);
    try {
      localStorage.setItem(UPDATE_LATER_KEY, latest);
    } catch {
      /* ignore */
    }
  }, [latest]);

  const startUpdate = useCallback(async () => {
    setUpdateBusy(true);
    try {
      await installUpdate();
      await loadUpdate();
    } finally {
      setUpdateBusy(false);
    }
  }, [loadUpdate]);

  useEffect(() => {
    if (!updateAutoEnabled()) return;
    loadUpdate();
    const id = window.setInterval(() => loadUpdate(), UPDATE_INTERVAL);
    const onFocus = () => loadUpdate();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadUpdate]);

  // While the update downloads, poll faster so the progress bar moves.
  useEffect(() => {
    if (!downloading && download?.state !== 'launching') return;
    const id = window.setInterval(() => loadUpdate(), 1000);
    return () => window.clearInterval(id);
  }, [downloading, download?.state, loadUpdate]);

  // Backend unreachable → skip the login gate so the UI still works as a mock.
  const backendUp = status !== null;
  const authed = !backendUp || username !== null;

  // Unlinking (Settings) while sitting on the Tier Queue drops you back to the
  // dashboard — the tab is only reachable with a linked account.
  useEffect(() => {
    if (backendUp && !discord && screen === 'tierqueue') setScreen('home');
  }, [backendUp, discord, screen]);

  const handleLogout = async () => {
    await logout();
    setUsername(null);
    setFriends(null);
    setDmTarget(null);
    lastPlayingRef.current = null;
    setScreen('home');
  };

  // A fresh login starts a brand-new session: reset the previous user's
  // friends data and seen-request/message markers so the new account gets
  // empty lists and correct toasts.
  const handleAuthed = (name: string) => {
    setUsername(name);
    setFriends(null);
    lastReqRef.current = new Set();
    lastUnreadRef.current = {};
    lastPlayingRef.current = null;
    setScreen('home');
    refreshFriends(status);
  };

  const acceptFromToast = async (username: string, toastId: number) => {
    await acceptFriend(username);
    dismissToast(toastId);
    refreshFriends(status);
  };

  const openDmFromToast = (username: string, toastId: number) => {
    dismissToast(toastId);
    setDmTarget(username);
    setScreen('friends');
  };

  // The update notification shows up on the login screen too — a user who
  // hasn't signed in yet should still be told a new build is out.
  const updateCard = showUpdate && updateInfo ? (
    <UpdateToast
      info={updateInfo}
      busy={updateBusy}
      onUpdate={startUpdate}
      onLater={skipUpdate}
      onOpenPage={openDownloadPage}
    />
  ) : null;

  if (backendUp && !authed) {
    return (
      <>
        <LoginScreen onAuthed={handleAuthed} />
        {updateCard && <div className="toast-stack">{updateCard}</div>}
      </>
    );
  }

  return (
    <div
      className={`app ${astrixMode ? 'astrix-mode' : ''} ${
        modeFx ? (modeFx === 'astrix' ? 'astrix-anim' : 'flame-anim') : ''
      }`}
    >
      <Sidebar
        screen={screen}
        onNavigate={navigate}
        friendsPending={friends?.requests.length ?? 0}
        astrixMode={astrixMode}
        version={status?.launcher_display_version ?? LAUNCHER_DISPLAY_VERSION}
        updateVersion={showUpdate ? updateInfo?.latest_display ?? latest : null}
      />
      <div className="app-body">
        <TopBar
          screen={screen}
          onNavigate={navigate}
          selectedVersion={selectedVersion}
          username={username ?? 'PLAYER'}
          onLogout={backendUp ? handleLogout : undefined}
          friendsPending={friends?.requests.length ?? 0}
          onOpenFriends={() => navigate('friends')}
          astrixMode={astrixMode}
          onToggleAstrixMode={toggleAstrixMode}
        />
        <main className="app-main">
          {screen === 'home' && (
            <HomeScreen
              selectedVersion={selectedVersion}
              onSelectVersion={setSelectedVersion}
              onOpenNews={() => navigate('news')}
              astrixMode={astrixMode}
            />
          )}
          {screen === 'versions' && (
            <VersionsScreen
              selectedVersion={selectedVersion}
              onSelect={setSelectedVersion}
              astrixMode={astrixMode}
            />
          )}
          {screen === 'mods' && !astrixMode && <ModsScreen selectedVersion={selectedVersion} />}
          {screen === 'news' && <NewsScreen astrixMode={astrixMode} />}
          {screen === 'servers' && !astrixMode && (
            <ServersScreen selectedVersion={selectedVersion} />
          )}
          {screen === 'friends' && (
            <FriendsScreen
              friends={friends}
              onRefresh={() => refreshFriends(status)}
              dmTarget={dmTarget}
              onClearDmTarget={() => setDmTarget(null)}
            />
          )}
          {screen === 'optimizer' && (
            <OptimizerScreen selectedVersion={selectedVersion} astrixMode={astrixMode} />
          )}
          {screen === 'tierqueue' && astrixMode && (
            <TierQueueScreen
              linked={!!discord}
              user={discord}
              onConnect={() => setDiscordGate(true)}
            />
          )}
          {screen === 'shop' && !astrixMode && <ShopScreen />}
          {screen === 'cosmetics' && (
            <CosmeticsScreen username={username} astrixMode={astrixMode} />
          )}
          {screen === 'settings' && <PreferencesScreen />}
        </main>
      </div>

      {(toasts.length > 0 || updateCard) && (
        <div className="toast-stack">
          {updateCard}
          {toasts.map((t) => (
            <div className="toast" key={t.id}>
              <div className="toast-text">
                <b>{t.username}</b>
                {t.kind === 'request'
                  ? ' sends a friend request to you'
                  : t.kind === 'playing'
                    ? ' started playing Minecraft'
                    : ` sent you ${t.count && t.count > 1 ? `${t.count} messages` : 'a message'}`}
              </div>
              <div className="toast-actions">
                {t.kind === 'request' && (
                  <button
                    className="toast-accept"
                    onClick={() => acceptFromToast(t.username, t.id)}
                  >
                    ACCEPT
                  </button>
                )}
                {t.kind === 'dm' && (
                  <button
                    className="toast-accept"
                    onClick={() => openDmFromToast(t.username, t.id)}
                  >
                    OPEN
                  </button>
                )}
                {t.kind === 'playing' && (
                  <button
                    className="toast-accept"
                    onClick={() => {
                      dismissToast(t.id);
                      navigate('friends');
                    }}
                  >
                    VIEW
                  </button>
                )}
                <button
                  className="toast-x"
                  title="Dismiss"
                  onClick={() => dismissToast(t.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modeFx && <ModeTransition toAstrix={modeFx === 'astrix'} />}

      {discordGate && (
        <DiscordLinkModal
          onLinked={(d) => {
            linkedAtRef.current = Date.now();
            setDiscord(d.user ?? null);
            setDiscordGate(false);
            setScreen('tierqueue');
          }}
          onClose={() => setDiscordGate(false)}
        />
      )}
    </div>
  );
}
