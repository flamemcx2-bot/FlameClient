import { useCallback, useEffect, useRef, useState } from 'react';
import { BoltIcon, CheckIcon, RefreshIcon, ShieldIcon, CloseIcon, DotsIcon } from '../components/icons';
import {
  getOptimizer,
  getPing,
  patchOptimizer,
  applyOptimizer,
  revertOptimizer,
  elevateOptimizer,
  benchmarkDns,
  applyDns,
  restoreDns,
  applyTcpTweaks,
  revertTcpTweaks,
  setPingTarget,
  endProcess,
} from '../api';
import type {
  OptimizerStatus,
  OptimizerSettings,
  PingSnapshot,
  ResolverResult,
  GcProfile,
  PriorityClass,
} from '../api';

interface Props {
  selectedVersion: string;
  astrixMode: boolean;
}

const POLL_MS = 4000;
const PING_MS = 1500;

function gb(mb?: number | null) {
  if (!mb) return '—';
  return `${(mb / 1024).toFixed(1)} GB`;
}

/** Sparkline for the live latency graph (pure SVG, no dependencies). */
function LatencyGraph({ ping }: { ping: PingSnapshot }) {
  const samples = ping.samples.slice(-90);
  const values = samples.map((s) => (typeof s.ms === 'number' ? s.ms : null));
  const known = values.filter((v): v is number => v !== null);
  if (!samples.length || !known.length) {
    return (
      <div className="opt-graph opt-graph-empty">
        <span>Waiting for the first ping…</span>
      </div>
    );
  }
  const max = Math.max(...known, 20) * 1.15;
  const min = Math.min(...known, 0);
  const span = Math.max(1, max - min);
  const w = 100;
  const h = 34;
  const step = samples.length > 1 ? w / (samples.length - 1) : 0;
  const points: string[] = [];
  values.forEach((v, i) => {
    if (v === null) return;
    const x = i * step;
    const y = h - ((v - min) / span) * h;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  });
  const avg = ping.stats.avg ?? 0;
  const stroke = avg < 40 ? '#4ade80' : avg < 90 ? '#fbbf24' : '#ef4444';
  return (
    <div className="opt-graph">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="Latency history">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="opt-graph-meta">
        <span>
          last <b>{ping.stats.last ?? '—'} ms</b>
        </span>
        <span>
          avg <b>{ping.stats.avg ?? '—'} ms</b>
        </span>
        <span>
          jitter <b>{ping.stats.jitter ?? '—'} ms</b>
        </span>
        {typeof ping.stats.loss === 'number' && ping.stats.loss > 0 && (
          <span className="opt-loss">
            loss <b>{ping.stats.loss}%</b>
          </span>
        )}
        <span className="opt-graph-mode">{ping.mode === 'tcp' ? 'tcp fallback' : 'server ping'}</span>
      </div>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`toggle ${on ? 'on' : ''}`}
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
    />
  );
}

export default function OptimizerScreen({ selectedVersion, astrixMode }: Props) {
  const [status, setStatus] = useState<OptimizerStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<ResolverResult[] | null>(null);
  const [customHost, setCustomHost] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const s = await getOptimizer(selectedVersion, astrixMode);
    if (mounted.current && s) setStatus(s);
  }, [selectedVersion, astrixMode]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [refresh]);

  // Live latency: a faster tick just for the graph.
  useEffect(() => {
    const id = window.setInterval(async () => {
      const p = await getPing();
      if (mounted.current && p && status) setStatus((prev) => (prev ? { ...prev, ping: p } : prev));
    }, PING_MS);
    return () => window.clearInterval(id);
  }, [status]);

  const settings: OptimizerSettings | undefined = status?.settings;

  const patch = async (change: Partial<OptimizerSettings>) => {
    setStatus((prev) => (prev && prev.settings ? { ...prev, settings: { ...prev.settings, ...change } } : prev));
    await patchOptimizer(change);
    refresh();
  };

  const run = async (key: string, fn: () => Promise<any>, done?: (result: any) => void) => {
    setBusy(key);
    setMessage(null);
    try {
      const result = await fn();
      if (result && result.ok === false) setMessage(result.error || 'That did not work.');
      else if (done) done(result);
    } finally {
      setBusy(null);
      refresh();
    }
  };

  if (!status) {
    return (
      <div className="screen">
        <div className="screen-head">
          <h1 className="screen-title">Optimizer &amp; Game Booster</h1>
          <p className="screen-sub">Reading your machine…</p>
        </div>
      </div>
    );
  }

  if (status.ok === false) {
    return (
      <div className="screen">
        <div className="screen-head">
          <h1 className="screen-title">Optimizer &amp; Game Booster</h1>
          <p className="screen-sub">{status.error || 'The optimizer is unavailable.'}</p>
        </div>
      </div>
    );
  }

  const hw = status.hardware;
  const fps = status.fps;
  const jvm = status.jvm_plan;
  const last = status.last_launch;
  const javaMissing = !status.java.path;

  return (
    <div className="screen opt-screen">
      <div className="screen-head opt-head">
        <div>
          <h1 className="screen-title">
            Optimizer &amp; Game Booster
            <span className="opt-badge">
              <BoltIcon size={13} /> {fps ? `${fps.gain_percent >= 0 ? '+' : ''}${fps.gain_percent}% EST.` : 'READY'}
            </span>
          </h1>
          <p className="screen-sub">
            {hw.cpu} · {hw.gpu} · {gb(hw.ram_total_mb)} RAM · {hw.os}
            {hw.power_plan ? ` · Power plan: ${hw.power_plan}` : ''}
          </p>
        </div>
        <div className="opt-head-actions">
          <button
            className="btn-primary"
            disabled={busy !== null}
            onClick={() =>
              run('apply', () => applyOptimizer(selectedVersion, astrixMode), (r) => {
                setReportOpen(true);
                setMessage(
                  r?.report?.applied?.length
                    ? `Applied ${r.report.applied.length} optimisation(s).`
                    : 'Nothing to change — you are already optimised.',
                );
              })
            }
          >
            {busy === 'apply' ? 'APPLYING…' : 'SCAN & OPTIMIZE'}
          </button>
          <button
            className="btn-ghost"
            disabled={busy !== null}
            onClick={() =>
              run('revert', () => revertOptimizer(), (r) => {
                const done = (r?.actions || []).join(', ') || 'nothing was changed';
                // Warnings matter here: e.g. a registry restore that needs admin.
                const warn = (r?.warnings || []).filter(Boolean).join(' ');
                setMessage(`Reverted: ${done}${warn ? ` — ${warn}` : ''}`);
              })
            }
          >
            REVERT ALL
          </button>
        </div>
      </div>

      {(message || javaMissing || !hw.admin) && (
        <div className="opt-banners">
          {message && (
            <div className="opt-banner opt-banner-info">
              <span>{message}</span>
              <button className="opt-x" onClick={() => setMessage(null)} title="Dismiss">
                <CloseIcon size={13} />
              </button>
            </div>
          )}
          {javaMissing && (
            <div className="opt-banner opt-banner-warn">
              <b>Java not found.</b> Install Java 21 and set JAVA_HOME, then restart the launcher — the JVM plan
              needs to know which Java to tune.
            </div>
          )}
          {!hw.admin && (
            <div className="opt-banner opt-banner-warn">
              <span>
                <b>No administrator rights.</b> FPS, mods and DNS-flush tweaks work fine; the TCP registry tweaks and
                switching your system DNS need elevation.
              </span>
              <button
                className="btn-ghost opt-small-btn"
                disabled={busy !== null}
                onClick={() => run('elevate', () => elevateOptimizer(), (r) => setMessage(r?.note))}
              >
                {busy === 'elevate' ? 'ASKING…' : 'RUN AS ADMIN'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- master switches ---- */}
      <section className="panel opt-panel">
        <div className="opt-panel-head">
          <h2>Boosters</h2>
          <span className="opt-hint">Applied automatically before every launch</span>
        </div>

        <div className="setting">
          <div>
            <div className="setting-label-row">High FPS Mode</div>
            <div className="setting-sub">
              JVM heap + <b>{jvm ? jvm.gc.toUpperCase() : 'tuned'}</b> garbage collector, performance mods and{' '}
              <b>options.txt</b> tweaks (V-Sync off, unlimited framerate, capped render distance).
            </div>
          </div>
          <Toggle
            on={!!settings?.high_fps_mode}
            label="High FPS Mode"
            onClick={() => patch({ high_fps_mode: !settings?.high_fps_mode })}
          />
        </div>

        <div className="setting">
          <div>
            <div className="setting-label-row">Low Latency Mode</div>
            <div className="setting-sub">
              Flush the DNS cache before each launch and keep a live ping test running for your server.
            </div>
          </div>
          <Toggle
            on={!!settings?.low_latency_mode}
            label="Low Latency Mode"
            onClick={() => patch({ low_latency_mode: !settings?.low_latency_mode })}
          />
        </div>

        <div className="setting">
          <div>
            <div className="setting-label-row">Process Priority Booster</div>
            <div className="setting-sub">
              Raise the game to <b>{settings?.priority_class?.toUpperCase()}</b> priority and drop the launcher to
              below-normal so it never competes. Realtime is available but can stutter the desktop.
            </div>
          </div>
          <Toggle
            on={!!settings?.priority_booster}
            label="Process Priority Booster"
            onClick={() => patch({ priority_booster: !settings?.priority_booster })}
          />
        </div>

        {settings?.priority_booster && (
          <div className="opt-inline-row">
            <span className="opt-inline-label">Priority class</span>
            <div className="opt-seg">
              {(['above_normal', 'high', 'realtime'] as PriorityClass[]).map((level) => (
                <button
                  key={level}
                  className={`opt-seg-btn ${settings.priority_class === level ? 'active' : ''}`}
                  onClick={() => patch({ priority_class: level })}
                >
                  {level === 'above_normal' ? 'ABOVE NORMAL' : level.toUpperCase()}
                </button>
              ))}
            </div>
            {settings.priority_class === 'realtime' && (
              <span className="opt-warn-text">
                <ShieldIcon size={13} /> Realtime can starve Windows' own threads — pick HIGH if the desktop stutters.
              </span>
            )}
          </div>
        )}
      </section>

      <div className="opt-grid">
        {/* ---- FPS ---- */}
        <section className="panel opt-panel">
          <div className="opt-panel-head">
            <h2>FPS estimate</h2>
            <span className="opt-hint">heuristic, not a measurement</span>
          </div>
          {fps ? (
            <>
              <div className="opt-fps-bars">
                <div className="opt-fps-row">
                  <span>Vanilla</span>
                  <div className="opt-bar">
                    <div className="opt-bar-fill vanilla" style={{ width: `${Math.min(100, (fps.baseline / fps.boosted) * 100)}%` }} />
                  </div>
                  <b>
                    {fps.baseline_range[0]}–{fps.baseline_range[1]}
                  </b>
                </div>
                <div className="opt-fps-row">
                  <span>Optimised</span>
                  <div className="opt-bar">
                    <div className="opt-bar-fill boosted" style={{ width: '100%' }} />
                  </div>
                  <b>
                    {fps.boosted_range[0]}–{fps.boosted_range[1]}
                  </b>
                </div>
              </div>
              <div className="opt-drivers">
                <span className="opt-hint">GPU tier: {fps.gpu_tier}</span>
                <ul>
                  {fps.drivers.length === 0 && <li>Nothing enabled yet — turn on High FPS Mode.</li>}
                  {fps.drivers.map((d) => (
                    <li key={d}>
                      <CheckIcon size={12} /> {d}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="opt-footnote">{fps.confirm}</p>
            </>
          ) : (
            <p className="opt-footnote">Estimate unavailable.</p>
          )}
        </section>

        {/* ---- JVM ---- */}
        <section className="panel opt-panel">
          <div className="opt-panel-head">
            <h2>JVM &amp; memory</h2>
            <span className="opt-hint">{status.java.version ? `Java ${status.java.version}` : 'Java not found'}</span>
          </div>
          <div className="opt-kv">
            <div>
              <span>Heap</span>
              <b>{jvm ? `${jvm.memory_mb} MB` : '—'}</b>
            </div>
            <div>
              <span>Collector</span>
              <b>{jvm ? jvm.gc.toUpperCase() : '—'}</b>
            </div>
            <div>
              <span>RAM available</span>
              <b>{gb(hw.ram_available_mb)}</b>
            </div>
          </div>

          <div className="opt-inline-row">
            <span className="opt-inline-label">GC profile</span>
            <div className="opt-seg">
              {(['low_latency', 'balanced', 'max_perf'] as GcProfile[]).map((p) => (
                <button
                  key={p}
                  className={`opt-seg-btn ${settings?.gc_profile === p ? 'active' : ''}`}
                  onClick={() => patch({ gc_profile: p })}
                  title={status.profiles?.[p]}
                >
                  {p.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <p className="opt-footnote">
            {status.profiles?.[settings?.gc_profile || 'low_latency']}
            {status.gc_support?.support ? '' : ''}
          </p>

          <div className="opt-inline-row">
            <span className="opt-inline-label">Memory</span>
            <div className="opt-seg">
              <button
                className={`opt-seg-btn ${settings?.memory_mode === 'auto' ? 'active' : ''}`}
                onClick={() => patch({ memory_mode: 'auto', memory_mb: null })}
              >
                AUTO
              </button>
              <button
                className={`opt-seg-btn ${settings?.memory_mode === 'manual' ? 'active' : ''}`}
                onClick={() => patch({ memory_mode: 'manual', memory_mb: jvm?.memory_mb ?? 4096 })}
              >
                MANUAL
              </button>
            </div>
          </div>
          {settings?.memory_mode === 'manual' && (
            <div className="opt-inline-row">
              <span className="opt-inline-label">Heap size</span>
              <input
                className="opt-range"
                type="range"
                min={1024}
                max={Math.max(2048, Math.min(16384, hw.ram_total_mb - 2048))}
                step={256}
                value={settings.memory_mb ?? 4096}
                onChange={(e) => patch({ memory_mb: Number(e.target.value) })}
              />
              <b className="opt-inline-value">{settings.memory_mb ?? 4096} MB</b>
            </div>
          )}

          {jvm && jvm.notes.length > 0 && (
            <ul className="opt-notes">
              {jvm.notes.slice(0, 3).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- Latency ---- */}
        <section className="panel opt-panel">
          <div className="opt-panel-head">
            <h2>Server latency</h2>
            <span className="opt-hint">
              {status.ping.players_online != null
                ? `${status.ping.players_online}/${status.ping.players_max} online`
                : 'live test'}
            </span>
          </div>

          <div className="opt-inline-row">
            <select
              className="opt-select"
              value={`${status.ping.target.host}:${status.ping.target.port}`}
              onChange={(e) => {
                const [host, port] = e.target.value.split(':');
                run('ping', () => setPingTarget(host, Number(port) || 25565));
              }}
            >
              {(settings?.ping_targets || []).map((t) => (
                <option key={t.host} value={`${t.host}:${t.port}`}>
                  {t.label} — {t.host}
                </option>
              ))}
              {!settings?.ping_targets?.some((t) => `${t.host}:${t.port}` === `${status.ping.target.host}:${status.ping.target.port}`) && (
                <option value={`${status.ping.target.host}:${status.ping.target.port}`}>
                  {status.ping.target.host}
                </option>
              )}
            </select>
            <input
              className="opt-input"
              placeholder="server address"
              value={customHost}
              onChange={(e) => setCustomHost(e.target.value)}
            />
            <button
              className="btn-ghost opt-small-btn"
              disabled={!customHost.trim() || busy !== null}
              onClick={() =>
                run('ping', () => setPingTarget(customHost.trim(), 25565), () => setCustomHost(''))
              }
            >
              TEST
            </button>
          </div>

          <LatencyGraph ping={status.ping} />

          <div className="opt-kv opt-kv-4">
            <div>
              <span>Average</span>
              <b>{status.ping.stats.avg ?? '—'} ms</b>
            </div>
            <div>
              <span>Best</span>
              <b>{status.ping.stats.min ?? '—'} ms</b>
            </div>
            <div>
              <span>Worst</span>
              <b>{status.ping.stats.max ?? '—'} ms</b>
            </div>
            <div>
              <span>Jitter</span>
              <b>{status.ping.stats.jitter ?? '—'} ms</b>
            </div>
          </div>
          <p className="opt-footnote">
            Real Minecraft server-list pings (SRV-aware) every {status.ping.interval}s — ICMP would need admin rights
            and tells you less than this.
          </p>
        </section>

        {/* ---- Mods ---- */}
        {!astrixMode && (
          <section className="panel opt-panel">
            <div className="opt-panel-head">
              <h2>Performance mods</h2>
              <span className="opt-hint">
                {selectedVersion} · {astrixMode ? 'locked' : 'Fabric/Forge rules apply'}
              </span>
            </div>
            <div className="setting">
              <div>
                <div className="setting-label-row">Auto-manage optimisation mods</div>
                <div className="setting-sub">
                  Installs and updates version-matched builds into <b>{selectedVersion}</b>'s own mods folder. Files we
                  add are tracked and removable; anything you installed yourself is never touched.
                </div>
              </div>
              <Toggle
                on={!!settings?.mods_enabled}
                label="Auto-manage optimisation mods"
                onClick={() => patch({ mods_enabled: !settings?.mods_enabled })}
              />
            </div>
            <ul className="opt-modlist">
              {status.mods.map((m) => (
                <li key={m.slug} className={m.installed ? 'on' : ''}>
                  <span className="opt-mod-state">{m.installed ? <CheckIcon size={13} /> : <DotsIcon size={13} />}</span>
                  <div>
                    <b>{m.name}</b>
                    <span className="opt-mod-role">{m.role}</span>
                  </div>
                  <span className="opt-mod-file">{m.file ?? (m.wanted ? 'pending' : 'off')}</span>
                </li>
              ))}
              {status.mods.length === 0 && <li>No catalog for this version.</li>}
            </ul>
          </section>
        )}

        {/* ---- DNS ---- */}
        <section className="panel opt-panel">
          <div className="opt-panel-head">
            <h2>DNS latency</h2>
            <span className="opt-hint">
              {settings?.dns_primary ? `using ${settings.dns_primary}` : 'system default'}
            </span>
          </div>
          <div className="opt-inline-row">
            <button
              className="btn-ghost opt-small-btn"
              disabled={busy !== null}
              onClick={() =>
                run('dns-bench', () => benchmarkDns(status.ping.target.host), (r) => {
                  setBenchmark(r?.results || []);
                  setMessage(`Fastest resolver for ${r?.domain}: ${r?.best?.name} (${r?.best?.ms} ms)`);
                })
              }
            >
              {busy === 'dns-bench' ? 'TESTING…' : 'BENCHMARK RESOLVERS'}
            </button>
            <button
              className="btn-primary opt-small-btn"
              disabled={busy !== null}
              onClick={() =>
                run('dns-auto', () => applyDns({ auto: true, domain: status.ping.target.host }), (r) =>
                  setMessage(
                    r?.improved_ms != null
                      ? `DNS switched to ${r.primary} — name lookup ${r.improved_ms > 0 ? 'faster' : 'slower'} by ${Math.abs(r.improved_ms)} ms.`
                      : `DNS switched to ${r?.primary}.`,
                  ),
                )
              }
            >
              {busy === 'dns-auto' ? 'SWITCHING…' : 'USE FASTEST'}
            </button>
            <button
              className="btn-ghost opt-small-btn"
              disabled={busy !== null}
              onClick={() => run('dns-restore', () => restoreDns(), (r) => setMessage(`DNS restored: ${(r?.restored || []).join(', ') || 'done'}`))}
            >
              RESTORE
            </button>
          </div>

          <ul className="opt-resolver-list">
            {(benchmark || []).map((r) => (
              <li key={r.ip} className={r.ok ? 'on' : ''}>
                <span className="opt-resolver-name">
                  <b>{r.name}</b>
                  <span>{r.ip}</span>
                </span>
                <span className="opt-resolver-ms">{r.ok ? `${r.ms} ms` : 'no reply'}</span>
                <button
                  className="btn-ghost opt-small-btn"
                  disabled={!r.ok || busy !== null}
                  onClick={() => run('dns-set', () => applyDns({ primary: r.ip }), () => setMessage(`DNS switched to ${r.name} (${r.ip}).`))}
                >
                  USE
                </button>
              </li>
            ))}
            {!benchmark && <li className="opt-muted">Run a benchmark to see which resolver answers fastest.</li>}
          </ul>

          <div className="opt-current-dns">
            {status.dns.slice(0, 3).map((a) => (
              <div key={a.name}>
                <b>{a.name}</b>
                <span>{a.servers.length ? a.servers.join(', ') : a.source === 'dhcp' ? 'automatic (DHCP)' : 'not set'}</span>
              </div>
            ))}
            {status.dns.length === 0 && <span className="opt-muted">No adapter information available.</span>}
          </div>
        </section>

        {/* ---- TCP ---- */}
        <section className="panel opt-panel">
          <div className="opt-panel-head">
            <h2>TCP / Nagle</h2>
            <span className="opt-hint">{status.tcp.detail}</span>
          </div>
          <div className="opt-inline-row">
            <button
              className="btn-ghost opt-small-btn"
              disabled={busy !== null}
              onClick={() => run('tcp-on', () => applyTcpTweaks(), (r) => setMessage(`TCP tweaks applied: ${(r?.changed || []).join(', ') || 'already set'}`))}
            >
              {busy === 'tcp-on' ? 'APPLYING…' : 'DISABLE NAGLE'}
            </button>
            <button
              className="btn-ghost opt-small-btn"
              disabled={busy !== null}
              onClick={() => run('tcp-off', () => revertTcpTweaks(), (r) => setMessage(`Registry restored: ${(r?.restored || []).join(', ') || 'nothing to restore'}`))}
            >
              RESTORE
            </button>
          </div>
          <p className="opt-footnote">
            Sets <b>TcpAckFrequency=1</b> and <b>TCPNoDelay=1</b> per network adapter, snapshotting the old values
            first. Honest expectation: this is a small win — routing dominates Minecraft latency — and it needs admin
            rights plus an adapter reconnect (or reboot) to take effect.
          </p>
          {status.tcp.interfaces.length > 0 && (
            <ul className="opt-notes">
              {status.tcp.interfaces.slice(0, 4).map((i) => (
                <li key={i.guid}>
                  {i.ip}: Nagle {i.TCPNoDelay === 1 ? 'off' : 'on'}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- Background load ---- */}
        <section className="panel opt-panel">
          <div className="opt-panel-head">
            <h2>Background load</h2>
            <span className="opt-hint">{status.processes.count} processes · {status.processes.total_mb} MB</span>
          </div>
          <p className="opt-footnote">
            Read-only. Close one you recognise — nothing is ever closed automatically, because a launcher cannot know
            which process is important to you.
          </p>
          <ul className="opt-proclist">
            {status.processes.processes.map((p) => (
              <li key={p.pid}>
                <span className="opt-proc-name">
                  <b>{p.name}</b>
                  {p.hint && <span>{p.hint}</span>}
                </span>
                <span className="opt-proc-mem">{p.mem_mb} MB</span>
                <button
                  className="btn-ghost opt-small-btn"
                  disabled={busy !== null}
                  onClick={() => run(`kill-${p.pid}`, () => endProcess(p.pid), (r) => setMessage(`Closed ${r?.name || p.name}.`))}
                >
                  CLOSE
                </button>
              </li>
            ))}
            {status.processes.processes.length === 0 && <li className="opt-muted">Nothing heavy is running.</li>}
          </ul>
        </section>
      </div>

      {/* ---- last launch report ---- */}
      {last && (
        <section className="panel opt-panel">
          <div className="opt-panel-head">
            <h2>Last launch — {last.version}</h2>
            <button className="btn-ghost opt-small-btn" onClick={() => setReportOpen(!reportOpen)}>
              {reportOpen ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          {reportOpen && (
            <>
              {last.applied.length > 0 && (
                <ul className="opt-notes">
                  {last.applied.map((line) => (
                    <li key={line}>
                      <CheckIcon size={12} /> {line}
                    </li>
                  ))}
                </ul>
              )}
              {last.warnings.length > 0 && (
                <ul className="opt-notes opt-notes-warn">
                  {last.warnings.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {last.applied.length === 0 && last.warnings.length === 0 && (
                <p className="opt-footnote">No optimisations were applied on the last launch.</p>
              )}
            </>
          )}
        </section>
      )}

      <section className="panel opt-panel opt-audit">
        <div className="opt-panel-head">
          <h2>History</h2>
          <button className="btn-ghost opt-small-btn" onClick={refresh}>
            <RefreshIcon size={13} /> REFRESH
          </button>
        </div>
        <ul className="opt-notes">
          {status.audit.map((a) => (
            <li key={`${a.event}-${a.at}`}>
              {a.event} · {new Date(a.at * 1000).toLocaleString()}
            </li>
          ))}
          {status.audit.length === 0 && <li>No optimizer actions yet.</li>}
        </ul>
      </section>
    </div>
  );
}
