import { useEffect, useState } from 'react';
import {
  ChevronDown,
  FolderIcon,
  RefreshIcon,
  BoltIcon,
  CheckIcon,
  CopyIcon,
  DiscordIcon,
} from '../components/icons';
import {
  getStatus,
  updateSettings,
  getUpdate,
  checkForUpdate,
  installUpdate,
  getRpc,
  saveRpc,
  getDiscord,
  startDiscordLink,
  unlinkDiscord,
} from '../api';
import type {
  DiscordState,
  RpcBlock,
  RpcInfo,
  RpcPlaceholder,
  RpcPreview,
  RpcSettings,
  UpdateInfo,
} from '../api';
import { ASTRIX_VERSIONS, DEFAULT_VERSION, LAUNCHER_VERSION } from '../data';

const UPDATE_AUTO_KEY = 'flame.update-check';

function mb(bytes?: number) {
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============ Discord Rich Presence ============
   The presence text is a title + four lines per mode. The backend
   (python_launcher/discord_rpc.py) is the source of truth; the substitution
   below only drives the live preview card, so it mirrors the same tokens. */

const VERSION_TOKEN = /\{minecraft-version\}|\{player-minecraft-version\}|\{version\}/g;
const USERNAME_TOKEN = /\{player-username\}|\{username\}/g;

function substituteLine(template: string, version: string, username: string) {
  return (template || '')
    .replace(VERSION_TOKEN, version)
    .replace(USERNAME_TOKEN, username)
    .replace(/\{minecraft-account-type\}/g, 'Minecraft Cracked')
    .replace(/\{server-ip\}/g, 'Singleplayer')
    .trim();
}

/** What Discord renders: Line 1 is the first row, Lines 2-4 join into the second. */
function composePreview(block: RpcBlock, version: string, username: string): RpcPreview {
  const sub = (v: string) => substituteLine(v, version, username);
  const rows = [sub(block.line2), sub(block.line3), sub(block.line4)].filter(Boolean);
  return {
    title: sub(block.title) || 'FlameClient',
    details: sub(block.line1) || sub(block.title) || 'FlameClient',
    state: rows.join(' • ') || 'Playing Minecraft',
  };
}

function RpcPreviewCard({ preview, appId }: { preview: RpcPreview; appId?: string }) {
  return (
    <div className="rpc-preview">
      <div className="rpc-preview-art" />
      <div className="rpc-preview-body">
        <div className="rpc-preview-title">{preview.title}</div>
        <div className="rpc-preview-line">{preview.details}</div>
        <div className="rpc-preview-line dim">{preview.state}</div>
      </div>
      {appId && <span className="rpc-preview-appid">{appId}</span>}
    </div>
  );
}

function PlaceholderList({
  placeholders,
  onCopy,
  copied,
}: {
  placeholders: RpcPlaceholder[];
  onCopy: (token: string) => void;
  copied: string | null;
}) {
  return (
    <div className="rpc-ph-list">
      {placeholders.map((p) => (
        <button
          key={p.token}
          className="rpc-ph-item"
          title="Copy this placeholder"
          onClick={() => onCopy(p.token)}
        >
          <code>{p.token}</code>
          <span className="rpc-ph-label">{p.label}</span>
          <span className="rpc-ph-copy">{copied === p.token ? 'copied' : 'copy'}</span>
        </button>
      ))}
      <div className="rpc-ph-note">
        Discord shows two text rows: <b>Line 1</b> is the first one and Lines 2–4
        are joined onto the second with a <b>•</b> separator. The Title is used
        when Line 1 is empty.
      </div>
    </div>
  );
}

interface RpcEditorProps {
  heading: string;
  sub: string;
  block: RpcBlock;
  preview: RpcPreview;
  placeholders: RpcPlaceholder[];
  titlePlaceholder: string;
  appId?: string;
  onChange: (key: keyof RpcBlock, value: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

function RpcEditor({
  heading,
  sub,
  block,
  preview,
  placeholders,
  titlePlaceholder,
  appId,
  onChange,
  onSave,
  saving,
  saved,
}: RpcEditorProps) {
  const [showPh, setShowPh] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const field = (label: string, key: keyof RpcBlock) => (
    <label className="rpc-field">
      <span className="rpc-field-label">{label}</span>
      <input
        className="rpc-input"
        value={block[key]}
        maxLength={120}
        placeholder={
          key === 'title' ? titlePlaceholder : key === 'line2' ? 'Playing {version}' : ''
        }
        onChange={(e) => onChange(key, e.target.value)}
      />
    </label>
  );

  const copy = (token: string) => {
    try {
      navigator.clipboard?.writeText(token).catch(() => {});
    } catch {
      /* clipboard unavailable */
    }
    setCopied(token);
    window.setTimeout(() => setCopied((c) => (c === token ? null : c)), 1200);
  };

  return (
    <div className="rpc-editor">
      <div className="rpc-editor-head">
        <div>
          <div className="setting-label-row">{heading}</div>
          <div className="setting-sub">{sub}</div>
        </div>
        <RpcPreviewCard preview={preview} appId={appId} />
      </div>

      <div className="rpc-grid">
        {field('Title', 'title')}
        {field('Line 1', 'line1')}
        {field('Line 2', 'line2')}
        {field('Line 3', 'line3')}
        {field('Line 4', 'line4')}
      </div>

      {showPh && (
        <PlaceholderList placeholders={placeholders} onCopy={copy} copied={copied} />
      )}

      <div className="rpc-actions">
        <button
          className={`rpc-btn ${showPh ? 'on' : ''}`}
          onClick={() => setShowPh((v) => !v)}
        >
          PLACEHOLDERS
        </button>
        <button className="rpc-btn rpc-save" onClick={onSave} disabled={saving}>
          {saving ? 'SAVING…' : saved ? 'SAVED ✓' : 'SAVE RPC'}
        </button>
      </div>
    </div>
  );
}

export default function PreferencesScreen() {
  const [advanced, setAdvanced] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [mem, setMem] = useState(4.3);
  const maxMem = 32.6;
  const fill = Math.round((mem / maxMem) * 100);
  const [dmNotifs, setDmNotifs] = useState(true);
  const [playingNotifs, setPlayingNotifs] = useState(true);
  const [launchLogs, setLaunchLogs] = useState(true);
  const [mcDir, setMcDir] = useState<string | null>(null);
  const [launcherVersion, setLauncherVersion] = useState(LAUNCHER_VERSION);
  const [autoCheck, setAutoCheck] = useState(() => {
    try {
      return localStorage.getItem(UPDATE_AUTO_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateInfo | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  // Customisable Discord Rich Presence (backend: python_launcher/discord_rpc.py).
  const [rpc, setRpc] = useState<RpcSettings | null>(null);
  const [rpcInfo, setRpcInfo] = useState<RpcInfo | null>(null);
  const [rpcPrev, setRpcPrev] = useState({ version: DEFAULT_VERSION, username: 'Player' });
  const [rpcSaving, setRpcSaving] = useState<'flame' | 'astrix' | null>(null);
  const [rpcSaved, setRpcSaved] = useState<'flame' | 'astrix' | null>(null);
  // Discord account link — Astrix Mode's Tier Queue is gated behind it.
  const [discord, setDiscord] = useState<DiscordState | null>(null);
  const [discordBusy, setDiscordBusy] = useState(false);
  const [discordMsg, setDiscordMsg] = useState<string | null>(null);

  useEffect(() => {
    getStatus().then((s) => {
      if (!s) return;
      if (s.notifications_enabled !== undefined) setDmNotifs(s.notifications_enabled);
      if (s.notifications_playing !== undefined) setPlayingNotifs(s.notifications_playing);
      if (s.show_launch_logs !== undefined) setLaunchLogs(s.show_launch_logs);
      if (s.minecraft_dir) setMcDir(s.minecraft_dir);
      if (s.launcher_display_version) setLauncherVersion(s.launcher_display_version);
      setRpcPrev((p) => ({ ...p, username: s.username || p.username }));
    });
    getUpdate().then((u) => {
      if (u) setUpdateState(u);
    });
    getRpc().then((info) => {
      if (!info || !info.settings) return;
      setRpcInfo(info);
      setRpc(info.settings);
    });
    getDiscord().then((d) => {
      if (d) setDiscord(d);
    });
  }, []);

  // A sign-in started here finishes in the browser — poll until it lands so the
  // block flips on its own instead of waiting for the user to come back.
  useEffect(() => {
    if (!discord?.pending) return;
    const id = window.setInterval(() => {
      getDiscord().then((d) => {
        if (d) setDiscord(d);
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, [discord?.pending]);

  // While an update downloads, poll so the progress line keeps moving.
  useEffect(() => {
    if (!installing) return;
    const id = window.setInterval(() => {
      getUpdate().then((u) => {
        if (u) setUpdateState(u);
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [installing]);

  const toggleAutoCheck = () => {
    const next = !autoCheck;
    setAutoCheck(next);
    try {
      localStorage.setItem(UPDATE_AUTO_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const runCheck = async () => {
    setChecking(true);
    setUpdateMsg(null);
    const u = await checkForUpdate();
    setChecking(false);
    if (!u) {
      setUpdateMsg('Could not reach the update server — check your connection.');
      return;
    }
    setUpdateState(u);
    if (u.available) {
      setUpdateMsg(`FlameClient ${u.latest_display ?? u.latest} is available.`);
    } else {
      setUpdateMsg(u.check_error ? 'Update check failed — you appear to be offline.' : 'You are up to date.');
    }
  };

  const runUpdate = async () => {
    setInstalling(true);
    setUpdateMsg(null);
    const res = await installUpdate();
    const u = await getUpdate();
    if (u) setUpdateState(u);
    if (res && res.ok === false) {
      setInstalling(false);
      setUpdateMsg(res.error || 'The update could not be started — use the download page.');
      return;
    }
    setUpdateMsg('Downloading the update — the setup will open when it is ready.');
  };

  const toggleDmNotifs = async () => {
    const next = !dmNotifs;
    setDmNotifs(next);
    await updateSettings({ notifications_enabled: next });
  };

  // Separate from DMs: some people want to hear about messages but not about
  // everyone going in-game. Both are stored by the backend, not just held here.
  const togglePlayingNotifs = async () => {
    const next = !playingNotifs;
    setPlayingNotifs(next);
    await updateSettings({ notifications_playing: next });
  };

  // The backend owns this setting: it decides whether to open the log window
  // when an install/launch/update starts.
  const toggleLaunchLogs = async () => {
    const next = !launchLogs;
    setLaunchLogs(next);
    await updateSettings({ show_launch_logs: next });
  };

  const editRpc = (mode: 'flame' | 'astrix', key: keyof RpcBlock, value: string) => {
    setRpc((prev) => {
      if (!prev) return prev;
      if (mode === 'flame') return { ...prev, [key]: value };
      return { ...prev, astrix: { ...prev.astrix, [key]: value } };
    });
    setRpcSaved(null);
  };

  const runRpcSave = async (mode: 'flame' | 'astrix') => {
    if (!rpc) return;
    setRpcSaving(mode);
    const res = await saveRpc(rpc);
    setRpcSaving(null);
    if (!res || res.ok === false) return;
    if (res.settings) setRpc(res.settings);
    if (res.preview) setRpcInfo((info) => (info ? { ...info, preview: res.preview! } : info));
    setRpcSaved(mode);
    window.setTimeout(() => setRpcSaved((s) => (s === mode ? null : s)), 2600);
  };

  const runDiscordLink = async () => {
    setDiscordBusy(true);
    setDiscordMsg(null);
    const res = await startDiscordLink();
    setDiscordBusy(false);
    if (!res) {
      setDiscordMsg('The launcher backend is not reachable.');
      return;
    }
    setDiscord(res);
    if (res.ok === false) setDiscordMsg(res.error || 'Discord could not be opened.');
  };

  const runDiscordUnlink = async () => {
    setDiscordBusy(true);
    setDiscordMsg(null);
    const res = await unlinkDiscord();
    setDiscordBusy(false);
    if (res) setDiscord(res);
  };

  const rpcPlaceholders = rpcInfo?.placeholders ?? [];

  return (
    <div className="prefs-layout">
      <section className="prefs-panel">
        <div className="prefs-head">
          <h1 className="screen-title" style={{ margin: 0, fontSize: 22 }}>
            Preferences
          </h1>
          <button className="toggle-wrap" onClick={() => setAdvanced(!advanced)}>
            <span>ADVANCED MODE</span>
            <span className={`toggle ${advanced ? 'on' : ''}`} />
          </button>
        </div>

        <div className="subhead">Game Settings</div>

        {/* Branch */}
        <div className="setting">
          <div>
            <div className="setting-label-row">
              Branch
              {advanced && <span className="badge badge-advanced">Advanced</span>}
            </div>
            <div className="setting-sub">Select which branch of the game you want to play</div>
          </div>
          <div className="control-row">
            <button className="input input-wide">
              master
              <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
            </button>
            <button className="icon-btn" title="Reload">
              <RefreshIcon size={16} />
            </button>
            <button className="icon-btn" title="Options">
              <FolderIcon size={16} />
            </button>
          </div>
        </div>

        {/* Memory */}
        <div className="setting">
          <div>
            <div className="setting-label-row">Allocated Memory</div>
            <div className="setting-sub">
              How much memory should we allocate to the game instance
            </div>
          </div>
          <div className="memory-row">
            <div className="slider-wrap">
              <input
                type="range"
                className="mem-slider"
                min={0.5}
                max={maxMem}
                step={0.1}
                value={mem}
                onChange={(e) => setMem(parseFloat(e.target.value))}
                style={{ ['--fill' as string]: `${fill}%` }}
              />
              <div className="slider-labels">
                <span>4.2GB</span>
                <span>32.6GB</span>
              </div>
            </div>
            <button className="detect-btn">
              <BoltIcon size={15} />
              Detect Recommended
            </button>
            <div className="memory-box">
              <b>{mem.toFixed(1)}GB</b>
              <span>{(maxMem - mem).toFixed(1)}GB left to allocate</span>
            </div>
          </div>
        </div>

        {/* Resolution */}
        <div className="setting">
          <div>
            <div className="setting-label-row">Game Resolution</div>
            <div className="setting-sub">Set the resolution of the game instance</div>
          </div>
          <div>
            <div className="control-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn-ghost" style={{ padding: '8px 13px' }}>
                View Presets
              </button>
            </div>
            <div className="control-row" style={{ marginTop: 9 }}>
              <input className="input" defaultValue="854" />
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>X</span>
              <input className="input" defaultValue="480" />
            </div>
          </div>
        </div>

        <div className="setting" style={{ paddingTop: 12, paddingBottom: 6 }}>
          <div />
          <button className="checkbox-row" onClick={() => setFullscreen(!fullscreen)}>
            <span className={`checkbox ${fullscreen ? 'on' : ''}`}>
              {fullscreen && <CheckIcon size={12} />}
            </span>
            Launch in Fullscreen?
          </button>
        </div>

        {/* After launch */}
        <div className="setting">
          <div>
            <div className="setting-label-row">After Game Launch</div>
            <div className="setting-sub">
              Select which action your launcher should take on launch
            </div>
          </div>
          <div className="control-row">
            <button className="input input-wide" style={{ minWidth: 110 }}>
              Hide
              <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        </div>

        {/* Directory */}
        <div className="setting">
          <div>
            <div className="setting-label-row">
              Game Directory
              {advanced && <span className="badge badge-advanced">Advanced</span>}
            </div>
            <div className="setting-sub">
              Select which directory to launch Minecraft from
            </div>
            <div className="setting-sub">
              Current directory:{' '}
              <span className="path-pill">
                <FolderIcon size={12} />
                {mcDir ?? 'Loading…'}
              </span>
            </div>
          </div>
          <div className="control-row">
            <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <RefreshIcon size={14} />
              Reset to Minecraft Default
            </button>
            <button
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <FolderIcon size={14} />
              Change directory
            </button>
          </div>
        </div>

        <div className="subhead">Launcher Settings</div>

        {/* Language */}
        <div className="setting">
          <div>
            <div className="setting-label-row">
              Language
              <span className="badge badge-new">New</span>
            </div>
            <div className="setting-sub">Select the language of the launcher</div>
          </div>
          <div className="control-row">
            <button className="input input-wide" style={{ minWidth: 130 }}>
              <span
                style={{
                  width: 20,
                  height: 14,
                  borderRadius: 3,
                  background:
                    'linear-gradient(180deg,#f8fafc 0 50%,#dc2626 50% 100%)',
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              />
              English
              <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        </div>

        {/* Playing notifications */}
        <div className="setting">
          <div>
            <div className="setting-label-row">
              Playing Notifications
              <span className="badge badge-new">New</span>
            </div>
            <div className="setting-sub">
              Sends a notification when a friend starts playing Minecraft
            </div>
          </div>
          <div className="control-row">
            <button className="checkbox-row" onClick={togglePlayingNotifs}>
              <span className={`checkbox ${playingNotifs ? 'on' : ''}`}>
                {playingNotifs && <CheckIcon size={12} />}
              </span>
              {playingNotifs ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* DM notifications */}
        <div className="setting">
          <div>
            <div className="setting-label-row">
              DM Notifications
              <span className="badge badge-new">New</span>
            </div>
            <div className="setting-sub">
              Show a pop-up when a friend sends you a direct message
            </div>
          </div>
          <div className="control-row">
            <button className="checkbox-row" onClick={toggleDmNotifs}>
              <span className={`checkbox ${dmNotifs ? 'on' : ''}`}>
                {dmNotifs && <CheckIcon size={12} />}
              </span>
              {dmNotifs ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Launch logs window */}
        <div className="setting">
          <div>
            <div className="setting-label-row">
              Launch Logs Window
              <span className="badge badge-new">New</span>
            </div>
            <div className="setting-sub">
              Open a separate window with a live log and progress bar while a version
              downloads, launches or updates
            </div>
          </div>
          <div className="control-row">
            <button className="checkbox-row" onClick={toggleLaunchLogs}>
              <span className={`checkbox ${launchLogs ? 'on' : ''}`}>
                {launchLogs && <CheckIcon size={12} />}
              </span>
              {launchLogs ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Discord Rich Presence — customisable title + 4 lines per mode */}
        <div className="subhead">Discord Rich Presence</div>

        {!rpc && (
          <div className="setting">
            <div className="setting-sub">
              Custom Rich Presence is available while the FlameClient backend is
              running.
            </div>
          </div>
        )}

        {rpc && (
          <>
            <RpcEditor
              heading="Flame Mode"
              sub="What your Discord profile shows while FlameClient is open"
              block={rpc}
              preview={composePreview(rpc, rpcPrev.version, rpcPrev.username)}
              placeholders={rpcPlaceholders}
              titlePlaceholder="FlameClient"
              onChange={(k, v) => editRpc('flame', k, v)}
              onSave={() => runRpcSave('flame')}
              saving={rpcSaving === 'flame'}
              saved={rpcSaved === 'flame'}
            />

            <div className="subhead">Astrix Mode RPC</div>
            <RpcEditor
              heading="FlameClient X AstrixPvP"
              sub={`Astrix Mode posts from its own Discord application — application id: ${rpc.astrix.application_id}`}
              block={rpc.astrix}
              preview={composePreview(rpc.astrix, ASTRIX_VERSIONS[0], rpcPrev.username)}
              placeholders={rpcPlaceholders}
              titlePlaceholder="FlameClient X AstrixPvP"
              appId={rpc.astrix.application_id}
              onChange={(k, v) => editRpc('astrix', k, v)}
              onSave={() => runRpcSave('astrix')}
              saving={rpcSaving === 'astrix'}
              saved={rpcSaved === 'astrix'}
            />
          </>
        )}

        {/* Discord account link — unlocks Astrix Mode's Tier Queue */}
        <div className="subhead">Discord Account</div>

        <div className="setting">
          <div>
            <div className="setting-label-row">
              Discord Account
              <span className="badge badge-new">New</span>
            </div>
            <div className="setting-sub">
              {discord?.linked
                ? "Astrix Mode's Tier Queue queues follow this account, and connecting here also links it on AstrixPvP — no /link needed in game."
                : 'Connect a Discord account to unlock the Tier Queue in Astrix Mode.'}
            </div>
          </div>
          <div className="control-row">
            {discord?.linked ? (
              <button className="rpc-btn" onClick={runDiscordUnlink} disabled={discordBusy}>
                {discordBusy ? 'UNLINKING…' : 'UNLINK'}
              </button>
            ) : (
              <button
                className="rpc-btn rpc-save discord-connect-btn"
                onClick={runDiscordLink}
                disabled={discordBusy}
              >
                <DiscordIcon size={15} />
                {discordBusy ? 'OPENING DISCORD…' : 'CONNECT DISCORD'}
              </button>
            )}
          </div>
        </div>

        {discord?.linked && discord.user && (
          <div className="discord-linked-row">
            {discord.user.avatar_url && (
              <img className="tier-avatar" src={discord.user.avatar_url} alt="" />
            )}
            <div className="tier-account-text">
              <span className="tier-account-name">
                {discord.user.display_name || discord.user.username}
              </span>
              <span className="tier-account-handle">@{discord.user.username}</span>
            </div>
          </div>
        )}

        {discord && !discord.linked && (
          <div className="discord-uris">
            <p className="setting-sub">
              Discord returns you to the FlameClient website, which hands the
              sign-in to the launcher on this PC. That URL has to be listed under
              OAuth2 → Redirects on application <b>{discord.client_id}</b> (add it
              once — it never changes):
            </p>
            {discord.redirect_uris.map((u) => (
              <code key={u}>{u}</code>
            ))}
            {discord.pending && (
              <p className="discord-uris-wait">Waiting for Discord… finish in the browser tab.</p>
            )}
            {(discordMsg || discord.error) && (
              <p className="discord-gate-error">{discordMsg || discord.error}</p>
            )}
          </div>
        )}
      </section>

      <aside className="prefs-side">
        <section className="panel" style={{ padding: 16 }}>
          <div className="section-head" style={{ marginBottom: 12 }}>
            <h2 className="section-title">Resources</h2>
          </div>
          <div className="resources-grid">
            <button className="resource-btn">Support</button>
            <button className="resource-btn">Common Questions</button>
            <button className="resource-btn">Terms of Service</button>
            <button className="resource-btn">Privacy Policy</button>
            <button className="resource-btn full">3rd Party Licenses</button>
            <button className="resource-btn full">Open Logs in File Explorer</button>
          </div>
        </section>

        <section className="panel" style={{ padding: '6px 16px 12px' }}>
          <div className="section-head" style={{ marginBottom: 2 }}>
            <h2 className="section-title" style={{ fontSize: 12 }}>Info</h2>
          </div>
          <div className="update-row">
            <button className="checkbox-row" style={{ marginTop: 8 }} onClick={toggleAutoCheck}>
              <span className={`checkbox ${autoCheck ? 'on' : ''}`}>
                {autoCheck && <CheckIcon size={12} />}
              </span>
              Check for Updates automatically
            </button>
            <button className="update-check-btn" onClick={runCheck} disabled={checking || installing}>
              <RefreshIcon size={13} />
              {checking ? 'CHECKING…' : 'CHECK NOW'}
            </button>
          </div>

          {(updateState?.available || updateMsg || installing) && (
            <div className={`update-status ${updateState?.available ? 'available' : ''}`}>
              <div className="update-status-text">
                {installing && updateState?.download?.state === 'downloading'
                  ? `Downloading update… ${mb(updateState.download.received)}` +
                    (updateState.download.total ? ` / ${mb(updateState.download.total)}` : '')
                  : updateMsg ||
                    (updateState?.available
                      ? `FlameClient ${updateState.latest_display ?? updateState.latest} is available (you have ${launcherVersion}).`
                      : '')}
              </div>
              {updateState?.available && (
                <button
                  className="toast-accept"
                  disabled={installing || updateState.download?.state === 'downloading'}
                  onClick={runUpdate}
                >
                  {installing ? 'UPDATING…' : 'UPDATE NOW'}
                </button>
              )}
            </div>
          )}

          {[
            { label: 'Version', value: launcherVersion },
            { label: 'Install ID', value: '5bcbd015-c2f4-4e9a-8d6b-7a21f9c3e1d2' },
            { label: 'Session ID', value: 'c1e8a2a9-c2f4-41e0-b5f2-0d8a73b6e9f1' },
          ].map((row) => (
            <div key={row.label} className="info-row">
              <span>{row.label}</span>
              <span className="info-value">
                {row.value.length > 17 ? `${row.value.slice(0, 17)}…` : row.value}
                <button className="copy-btn" title="Copy">
                  <CopyIcon size={14} />
                </button>
              </span>
            </div>
          ))}
        </section>

        <p className="footnote">© 2026 Flame Client, LLC</p>
      </aside>
    </div>
  );
}
