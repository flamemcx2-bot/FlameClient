import { useEffect, useMemo, useState } from 'react';
import { NEWS, ASTRIX_NEWS, HERO_VERSIONS, ASTRIX_VERSIONS } from '../data';
import { HeroArt } from '../components/art';
import NewsGrid from '../components/NewsGrid';
import { ChevronDown, CheckIcon } from '../components/icons';
import { getStatus, getVersions, launch, getTask } from '../api';
import type { LauncherStatus, VersionList, TaskState } from '../api';
import {
  GrassIcon,
  DiamondIcon,
  GoldIcon,
  TntIcon,
  CreeperIcon,
} from '../components/Voxel3D';

interface HomeScreenProps {
  selectedVersion: string;
  onSelectVersion: (v: string) => void;
  onOpenNews: () => void;
  astrixMode?: boolean;
}

export default function HomeScreen({
  selectedVersion,
  onSelectVersion,
  onOpenNews,
  astrixMode = false,
}: HomeScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<LauncherStatus | null>(null);
  const [versions, setVersions] = useState<VersionList | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchMsg, setLaunchMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // The backend runs the install + launch in the background, so we follow its
  // task to show real progress here (the same numbers as the log window).
  const [task, setTask] = useState<TaskState | null>(null);
  const [msBannerClosed, setMsBannerClosed] = useState(false);

  useEffect(() => {
    let alive = true;
    getStatus().then((s) => alive && setStatus(s));
    getVersions().then((v) => alive && setVersions(v));
    return () => {
      alive = false;
    };
  }, []);

  // Real version list when the Python backend is live; mock list otherwise.
  // Astrix Mode is locked to 1.21.11 only.
  const versionOptions = useMemo(() => {
    if (astrixMode) return ASTRIX_VERSIONS;
    if (versions && (versions.installed.length || versions.available.length)) {
      return [...new Set([...versions.installed, ...versions.available])];
    }
    return HERO_VERSIONS;
  }, [versions, astrixMode]);

  // Auto-pick a real default version when the backend is present.
  useEffect(() => {
    if (!versions || astrixMode) return;
    const pool = [...versions.available, ...versions.installed];
    if (pool.length && !pool.includes(selectedVersion)) {
      onSelectVersion(versions.default_version && pool.includes(versions.default_version) ? versions.default_version : pool[0]);
    }
  }, [versions, selectedVersion, onSelectVersion, astrixMode]);

  // Astrix Mode only offers 1.21.11 — snap the picker to it while active.
  useEffect(() => {
    if (astrixMode && selectedVersion !== ASTRIX_VERSIONS[0]) {
      onSelectVersion(ASTRIX_VERSIONS[0]);
    }
  }, [astrixMode, selectedVersion, onSelectVersion]);

  const handleLaunch = async () => {
    setLaunching(true);
    setLaunchMsg(null);
    setTask(null);
    const res = await launch(selectedVersion, astrixMode);
    setLaunching(false);
    if (!res) {
      setLaunchMsg({ ok: false, text: 'Launcher backend not reachable — start python_launcher/launcher.py' });
      return;
    }
    if (!res.ok) {
      setLaunchMsg({ ok: false, text: res.error || 'Launch failed' });
      return;
    }
    // Accepted: the work continues on the backend (installing first, if
    // needed). Pick up its task so this line reports real progress, and let
    // App.tsx hide the window once the game process actually appears.
    if (res.seq !== undefined) {
      setTask(await getTask(0));
    } else {
      setLaunchMsg({ ok: true, text: `Launched ${res.version} · pid ${res.pid}` });
    }
  };

  // Follow the task while it runs. Leaving this screen or the task finishing
  // stops the polling on its own.
  const watchSeq = task && task.status === 'running' ? task.seq : null;
  useEffect(() => {
    if (watchSeq === null) return;
    let alive = true;
    const id = window.setInterval(async () => {
      const t = await getTask(0);
      if (alive && t && t.seq === watchSeq) setTask(t);
    }, 800);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [watchSeq]);

  const taskRunning = task?.status === 'running';
  const taskFailed = task?.status === 'error';
  const busy = launching || !!taskRunning;

  const statusText = launching
    ? 'Starting launch…'
    : taskRunning
      ? `${task?.stage || 'Working…'} · ${task?.percent ?? 0}%`
      : taskFailed
        ? task?.error || 'Launch failed'
        : task?.status === 'done'
          ? `Launched ${task.version}${task.pid ? ` · pid ${task.pid}` : ''}`
          : launchMsg
            ? launchMsg.text
            : status?.java
              ? `Java ${status.java.version} · Ready to launch`
              : 'Ready to launch';
  const statusError = (!!launchMsg && !launchMsg.ok) || !!taskFailed;

  const news = astrixMode ? ASTRIX_NEWS : NEWS;

  return (
    <div className="home">
      <section className="hero">
        <HeroArt astrix={astrixMode} />
        {!astrixMode && (
          <div className="hero-voxels">
            <span className="hero-vox hero-vox-1">
              <GrassIcon size={30} depth={3} delay={0.2} />
            </span>
            <span className="hero-vox hero-vox-2">
              <DiamondIcon size={24} depth={2} delay={1.1} />
            </span>
            <span className="hero-vox hero-vox-3">
              <TntIcon size={28} depth={3} delay={0.6} />
            </span>
            <span className="hero-vox hero-vox-4">
              <CreeperIcon size={22} depth={2} delay={1.7} />
            </span>
            <span className="hero-vox hero-vox-5">
              <GoldIcon size={20} depth={1} delay={2.4} />
            </span>
          </div>
        )}
        {status?.account_mode === 'online' && !status?.ms_linked && !msBannerClosed && (
          <div className="ms-link-banner">
            <span>
              Online account — <b>link Microsoft</b> to play on real servers. Use
              Online Mode → LOGIN WITH MICROSOFT (choose {status.username}).
            </span>
            <button className="ms-link-close" onClick={() => setMsBannerClosed(true)} aria-label="Dismiss">✕</button>
          </div>
        )}
        <div className="hero-launch">
          <div className="launch-pill">
            <button
              className="launch-btn"
              title={`Launch ${selectedVersion}`}
              onClick={handleLaunch}
              disabled={busy}
            >
              {busy ? 'LAUNCHING…' : 'LAUNCH'}
            </button>
            <div className="launch-version-wrap">
              <button
                className="launch-version"
                onClick={() => setMenuOpen((o) => !o)}
                title="Select version"
              >
                {selectedVersion}
                <ChevronDown size={16} />
              </button>
              {menuOpen && (
                <>
                  <div className="launch-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="version-menu">
                    {versionOptions.map((v) => (
                      <button
                        key={v}
                        className={`version-menu-item ${v === selectedVersion ? 'selected' : ''}`}
                        onClick={() => {
                          onSelectVersion(v);
                          setMenuOpen(false);
                        }}
                      >
                        {v === selectedVersion && <CheckIcon size={13} />}
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={`launch-status ${statusError ? 'launch-error' : ''}`}>
            <span className={`status-dot ${statusError ? 'error' : ''}`} />
            {statusText}
          </div>
        </div>
      </section>

      <div className="home-grid">
        <section>
          <div className="section-head">
            <h2 className="section-title">Latest News</h2>
            <button className="link" onClick={onOpenNews}>
              View all News
            </button>
          </div>
          <NewsGrid cards={news} />
        </section>
      </div>
    </div>
  );
}
