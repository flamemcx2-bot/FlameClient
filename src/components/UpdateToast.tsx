import type { UpdateInfo } from '../api';

interface UpdateToastProps {
  info: UpdateInfo;
  busy: boolean;
  onUpdate: () => void;
  onLater: () => void;
  onOpenPage: () => void;
}

function mb(bytes?: number) {
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(bytes > 10 * 1024 * 1024 ? 1 : 2)} MB`;
}

/** "FlameClient 2.0.2 is available" — shown wherever the user is in the app,
 *  including the login screen, and it stays until they update or dismiss it. */
export default function UpdateToast({
  info,
  busy,
  onUpdate,
  onLater,
  onOpenPage,
}: UpdateToastProps) {
  const download = info.download;
  const state = download?.state;
  const starting = state === 'launching' || state === 'started';

  return (
    <div className={`toast toast-update ${info.required ? 'required' : ''}`}>
      <div className="toast-text">
        <b>
          FlameClient {info.latest_display ?? info.latest} is available
          {info.required ? ' (required)' : ''}
        </b>
        <span className="toast-sub">
          {state === 'downloading'
            ? `Downloading update… ${mb(download?.received)}` +
              (download?.total ? ` / ${mb(download.total)}` : '')
            : starting
              ? 'Setup is opening — finish the update there. The launcher will restart.'
              : state === 'error'
                ? download?.error || 'The download failed — use the download page instead.'
                : info.notes || `You are running v${info.current_display}.`}
        </span>
        {state === 'downloading' && (
          <span className="update-bar">
            <span
              className="update-bar-fill"
              style={{
                width:
                  download?.total && download?.received
                    ? `${Math.min(100, Math.round((download.received / download.total) * 100))}%`
                    : '35%',
              }}
            />
          </span>
        )}
      </div>
      <div className="toast-actions">
        {starting ? (
          <button className="toast-accept" onClick={onOpenPage}>
            DOWNLOAD PAGE
          </button>
        ) : (
          <button
            className="toast-accept"
            disabled={busy || state === 'downloading'}
            onClick={onUpdate}
          >
            {state === 'error' ? 'TRY AGAIN' : busy ? 'STARTING…' : 'UPDATE NOW'}
          </button>
        )}
        {!starting && (
          <button className="toast-later" onClick={onOpenPage}>
            PAGE
          </button>
        )}
        {!info.required && (
          <button className="toast-later toast-later-end" onClick={onLater}>
            LATER
          </button>
        )}
      </div>
    </div>
  );
}
