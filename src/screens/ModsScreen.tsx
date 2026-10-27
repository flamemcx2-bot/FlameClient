import { useCallback, useEffect, useRef, useState } from 'react';
import type { PackItem, PackType, ModrinthHit } from '../api';
import {
  listPacks,
  deletePack,
  renamePack,
  uploadPack,
  openPackFolder,
  searchModrinth,
  installModrinth,
} from '../api';
import {
  PuzzleIcon,
  FolderIcon,
  RefreshIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  ArrowRight,
} from '../components/icons';

function fmtSize(n: number) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

function fmtDate(t: number) {
  try {
    return new Date(t * 1000).toLocaleDateString();
  } catch {
    return '';
  }
}

interface ModsScreenProps {
  selectedVersion: string;
}

export default function ModsScreen({ selectedVersion }: ModsScreenProps) {
  const [tab, setTab] = useState<PackType>('mods');
  const [items, setItems] = useState<PackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    window.setTimeout(() => setMsg(null), 4000);
  };

  // 1.8.8 is the only Forge line; every 1.21.x/1.20.x version runs Fabric.
  const loaderName = selectedVersion === '1.8.8' ? 'Forge' : 'Fabric';

  const load = useCallback(
    async (type: PackType = tab) => {
      setLoading(true);
      const res = await listPacks(type, selectedVersion);
      setLoading(false);
      if (res && res.ok) setItems(res.items);
      else flash(false, res?.error || 'Could not read the packs folder');
    },
    [tab, selectedVersion],
  );

  useEffect(() => {
    setItems([]);
    setMsg(null);
    load();
  }, [tab, load]);

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    const res = await deletePack(tab, name, selectedVersion);
    if (res?.ok) flash(true, `Deleted ${name}`);
    else flash(false, res?.error || 'Delete failed');
    load();
  };

  const commitRename = async (name: string) => {
    const newName = renameVal.trim();
    setRenaming(null);
    if (!newName || newName === name) return;
    const res = await renamePack(tab, name, newName, selectedVersion);
    if (res?.ok) flash(true, `Renamed to ${newName}`);
    else flash(false, res?.error || 'Rename failed');
    load();
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const res = await uploadPack(tab, file.name, file, selectedVersion);
    if (res?.ok) flash(true, `Uploaded ${file.name}`);
    else flash(false, res?.error || 'Upload failed');
    load();
  };

  const handleOpen = async () => {
    const res = await openPackFolder(tab, selectedVersion);
    if (!res?.ok) flash(false, res?.error || 'Could not open the folder');
  };

  const label = tab === 'mods' ? 'mods' : 'resource packs';

  return (
    <div className="screen">
      <div className="mods-head-row">
        <h1 className="screen-title" style={{ margin: 0 }}>
          Mods &amp; Resource Packs
        </h1>
        <div className="pack-tabs">
          <button className={tab === 'mods' ? 'active' : ''} onClick={() => setTab('mods')}>
            Mods
          </button>
          <button
            className={tab === 'resourcepacks' ? 'active' : ''}
            onClick={() => setTab('resourcepacks')}
          >
            Resource Packs
          </button>
        </div>
        <div className="head-right">
          <button className="btn-getmods" onClick={() => setBrowseOpen(true)}>
            <span className="getmods-plus">+</span> GET {tab === 'mods' ? 'MODS' : 'PACKS'}
          </button>
          <button className="btn-ghost" onClick={handleOpen} title="Open folder location">
            <FolderIcon size={15} />
            Open Folder
          </button>
          <button className="btn-ghost" onClick={() => load()} title="Refresh">
            <RefreshIcon size={15} />
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()} title="Upload a file">
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept={tab === 'mods' ? '.jar' : '.zip'}
            onChange={(e) => {
              handleUpload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <p className="pack-hint">
        {tab === 'mods'
          ? `${items.length} mod${items.length === 1 ? '' : 's'} installed for Minecraft ${selectedVersion} — these load with ${loaderName} when you launch.`
          : `${items.length} resource pack${items.length === 1 ? '' : 's'} installed for Minecraft ${selectedVersion} — enable them in-game via Options → Resource Packs.`}
      </p>

      {msg && <div className={`pack-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}

      {browseOpen ? (
        <GetModsView
          type={tab}
          version={selectedVersion}
          onBack={() => setBrowseOpen(false)}
          onInstalled={() => load()}
        />
      ) : loading ? (
        <div className="pack-empty">Loading…</div>
      ) : items.length === 0 ? (
        <div className="pack-empty">
          <PuzzleIcon size={36} />
          <p>No {label} installed yet.</p>
          <p className="pack-empty-sub">
            Click <b>+ GET {tab === 'mods' ? 'MODS' : 'PACKS'}</b> to browse and install from
            Modrinth ({loaderName}-only mods, resource packs for this version), or <b>Upload</b> a {tab === 'mods' ? '.jar' : '.zip'} file.
          </p>
        </div>
      ) : (
        <div className="pack-list">
          {items.map((it) => (
            <div className="pack-row" key={it.name}>
              <span className="pack-icon">
                <PuzzleIcon size={18} />
              </span>
              {renaming === it.name ? (
                <span className="pack-rename">
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(it.name);
                      if (e.key === 'Escape') setRenaming(null);
                    }}
                  />
                  <button className="pack-mini ok" title="Save" onClick={() => commitRename(it.name)}>
                    <CheckIcon size={15} />
                  </button>
                  <button className="pack-mini" title="Cancel" onClick={() => setRenaming(null)}>
                    <CloseIcon size={14} />
                  </button>
                </span>
              ) : (
                <span className="pack-info">
                  <span className="pack-name" title={it.name}>
                    {it.name}
                    {it.locked && <span className="pack-lock" title="Protected core mod — cannot be changed">🔒 CORE</span>}
                  </span>
                  <span className="pack-meta">
                    {fmtSize(it.size)} · {fmtDate(it.modified)}
                  </span>
                </span>
              )}
              <span className="pack-actions">
                {it.locked ? (
                  <span className="pack-locked-note">protected</span>
                ) : (
                  <>
                    <button
                      className="pack-mini"
                      title="Rename"
                      onClick={() => {
                        setRenaming(it.name);
                        setRenameVal(it.name);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="pack-mini danger"
                      title="Delete"
                      onClick={() => handleDelete(it.name)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface GetModsViewProps {
  type: PackType;
  version: string;
  onBack: () => void;
  onInstalled: () => void;
}

function GetModsView({ type, version, onBack, onInstalled }: GetModsViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModrinthHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      setSearching(true);
      setErr(null);
      const res = await searchModrinth(q, type, version);
      setSearching(false);
      if (!res) setErr('Could not reach Modrinth — is the launcher backend running?');
      else if (!res.ok) setErr(res.error || 'Search failed');
      else setResults(res.hits);
    },
    [type, version],
  );

  useEffect(() => {
    doSearch('');
  }, [doSearch]);

  const install = async (hit: ModrinthHit) => {
    setBusy(hit.project_id);
    setErr(null);
    const res = await installModrinth(hit.project_id, version, type);
    setBusy(null);
    if (res?.ok) {
      setDone(hit.project_id);
      onInstalled();
    } else {
      setErr(res?.error || 'Download failed');
    }
  };

  return (
    <div className="getmods">
      <div className="getmods-head">
        <button className="btn-ghost" onClick={onBack}>
          <ArrowRight style={{ transform: 'rotate(180deg)' }} size={15} />
          Back
        </button>
        <h2 className="getmods-title">
          {type === 'mods' ? 'Get Mods' : 'Get Resource Packs'}
          <span className="getmods-ver">
            · Minecraft {version} · {type === 'mods' ? (version === '1.8.8' ? 'Forge' : 'Fabric') : 'Any loader'}
          </span>
        </h2>
      </div>

      <div className="getmods-search">
        <SearchIcon size={18} />
        <input
          value={query}
          placeholder={
            type === 'mods'
              ? 'Search mods on Modrinth… e.g. sodium, lithium, iris'
              : 'Search resource packs on Modrinth… e.g. realistic, faithful'
          }
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') doSearch(query);
          }}
        />
        <button className="btn-primary" onClick={() => doSearch(query)} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {err && <div className="pack-msg err">{err}</div>}

      {searching ? (
        <div className="pack-empty">Searching Modrinth…</div>
      ) : results === null ? (
        <div className="pack-empty">Loading popular {type === 'mods' ? 'mods' : 'packs'}…</div>
      ) : results.length === 0 ? (
        <div className="pack-empty">
          <SearchIcon size={34} />
          <p>Nothing found for “{query || `Minecraft ${version}`}”.</p>
          <p className="pack-empty-sub">Try a different search, or a Minecraft version that has more {label()}</p>
        </div>
      ) : (
        <div className="getmods-grid">
          {results.map((hit) => (
            <div className="mod-card" key={hit.project_id}>
              {hit.icon_url ? (
                <img className="mod-icon" src={hit.icon_url} alt="" loading="lazy" />
              ) : (
                <span className="mod-icon fallback">
                  <PuzzleIcon size={20} />
                </span>
              )}
              <div className="mod-body">
                <span className="mod-title" title={hit.title}>
                  {hit.title}
                </span>
                <span className="mod-author">by {hit.author}</span>
                <span className="mod-desc">{hit.description || 'No description available.'}</span>
                <span className="mod-meta">
                  <span>↓ {hit.downloads.toLocaleString()}</span>
                  {type === 'mods' && (
                    <span className="mod-badge">{version === '1.8.8' ? 'Forge' : 'Fabric'}</span>
                  )}
                </span>
              </div>
              <button
                className="mod-download"
                onClick={() => install(hit)}
                disabled={busy === hit.project_id || done === hit.project_id}
              >
                {busy === hit.project_id
                  ? 'Downloading…'
                  : done === hit.project_id
                    ? '✓ Installed'
                    : 'Download'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function label() {
    return type === 'mods' ? 'mods' : 'packs';
  }
}
