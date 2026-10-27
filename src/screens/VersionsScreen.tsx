import { useState } from 'react';
import { VERSIONS, ASTRIX_VERSIONS } from '../data';
import { CheckIcon } from '../components/icons';

interface VersionsScreenProps {
  selectedVersion: string;
  onSelect: (v: string) => void;
  astrixMode?: boolean;
}

export default function VersionsScreen({
  selectedVersion,
  onSelect,
  astrixMode = false,
}: VersionsScreenProps) {
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(['1.21.11', '1.21.1', '1.21', '1.20', '1.20.1']),
  );
  const [installing, setInstalling] = useState<string | null>(null);

  const handleInstall = (id: string) => {
    if (installed.has(id)) {
      onSelect(id);
      return;
    }
    setInstalling(id);
    setTimeout(() => {
      setInstalled((prev) => new Set(prev).add(id));
      setInstalling(null);
      onSelect(id);
    }, 1200);
  };

  // Astrix Mode is locked to a single version.
  const list = astrixMode ? VERSIONS.filter((v) => ASTRIX_VERSIONS.includes(v.id)) : VERSIONS;

  return (
    <div className="screen">
      <div className="screen-head">
        <h1 className="screen-title">Versions</h1>
        <p className="screen-sub">
          {astrixMode
            ? 'Astrix Mode runs on 1.21.11'
            : 'Select the version of Minecraft you want to play'}{' '}
          · Currently on <b style={{ color: '#fff' }}>{selectedVersion}</b>
        </p>
      </div>

      <div className="version-list">
        {list.map((v) => {
          const isInstalled = installed.has(v.id);
          const isSelected = selectedVersion === v.id;
          return (
            <button
              key={v.id}
              className={`version-row ${isSelected ? 'selected' : ''}`}
              onClick={() => isInstalled && onSelect(v.id)}
            >
              <span className="version-main">
                <span className="version-label">
                  {v.label}
                  {v.tag && (
                    <span
                      className={`tag ${
                        v.tag === 'Recommended' ? 'tag-recommended' : 'tag-new'
                      }`}
                      style={{ marginLeft: 10, verticalAlign: '2px' }}
                    >
                      {v.tag}
                    </span>
                  )}
                </span>
                <span className="version-meta">
                  <span className="os-icons">
                    <span className="os-icon" title="Windows">Win</span>
                    <span className="os-icon" title="macOS">Mac</span>
                    <span className="os-icon" title="Linux">Lin</span>
                  </span>
                  {isSelected && (
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                      ● Selected
                    </span>
                  )}
                </span>
              </span>
              {isInstalled ? (
                <span
                  className={`btn-primary ${isSelected ? 'launch-now' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {isSelected && <CheckIcon size={14} />}
                  {isSelected ? 'LAUNCH' : 'PLAY'}
                </span>
              ) : (
                <span className="btn-ghost">{installing === v.id ? 'Installing…' : 'Install'}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
