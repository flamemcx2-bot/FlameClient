import { useEffect, useState } from 'react';
import { getServers, getVersions, launch } from '../api';
import type { PartneredServer, VersionList } from '../api';

interface ServersScreenProps {
  selectedVersion: string;
}

/**
 * ⭐ Partnered Servers — every server the admins added in the website's
 * admin portal. One click launches the game on the selected version and
 * drops the player straight onto the server (--quickPlayMultiplayer).
 */
export default function ServersScreen({ selectedVersion }: ServersScreenProps) {
  const [servers, setServers] = useState<PartneredServer[] | null>(null);
  const [versions, setVersions] = useState<VersionList | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    getServers().then((s) => alive && setServers(s));
    getVersions().then((v) => alive && setVersions(v));
    return () => {
      alive = false;
    };
  }, []);

  const versionToLaunch =
    versions && [...versions.available, ...versions.installed].includes(selectedVersion)
      ? selectedVersion
      : versions?.default_version || selectedVersion;

  const handlePlay = async (server: PartneredServer) => {
    setJoining(server.id);
    setMsg(null);
    const res = await launch(versionToLaunch, false, server.ip);
    setJoining(null);
    if (!res) {
      setMsg({ ok: false, text: 'Launcher backend not reachable — start python_launcher/launcher.py' });
      return;
    }
    if (!res.ok) {
      setMsg({ ok: false, text: res.error || 'Launch failed' });
      return;
    }
    setMsg({ ok: true, text: `Joining ${server.name} on ${versionToLaunch}…` });
  };

  return (
    <div className="screen">
      <div className="screen-head">
        <h1 className="screen-title">⭐ Partnered Servers</h1>
        <p className="screen-sub">
          Official partner servers — hit Play and you land straight in-game
        </p>
      </div>

      {msg && (
        <p className={msg.ok ? 'pack-empty-sub' : 'launch-error'}>{msg.text}</p>
      )}

      {servers === null ? (
        <p className="pack-empty-sub">Loading servers…</p>
      ) : servers.length === 0 ? (
        <p className="pack-empty-sub">No partnered servers yet — check back soon.</p>
      ) : (
        <div className="server-grid">
          {servers.map((s) => (
            <article key={s.id} className="server-card">
              {s.banner ? (
                <img className="server-banner" src={s.banner} alt="" loading="lazy" />
              ) : (
                <div className="server-banner server-banner-fallback" />
              )}
              <div className="server-body">
                {s.logo && <img className="server-logo" src={s.logo} alt="" loading="lazy" />}
                <div className="server-info">
                  <h3 className="server-name">{s.name}</h3>
                  <button
                    className="link server-ip"
                    title="Click to copy the IP"
                    onClick={() => {
                      try {
                        void navigator.clipboard?.writeText(s.ip);
                        setMsg({ ok: true, text: `Copied ${s.ip}` });
                      } catch {
                        setMsg({ ok: false, text: s.ip });
                      }
                    }}
                  >
                    {s.ip}
                  </button>
                </div>
                <button
                  className="launch-btn server-play"
                  disabled={joining !== null}
                  onClick={() => handlePlay(s)}
                >
                  {joining === s.id ? 'JOINING…' : 'PLAY'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
