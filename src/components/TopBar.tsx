import type { Screen } from '../types';
import SkinFace from './SkinFace';
import {
  GridIcon,
  MailIcon,
  UserIcon,
  MinimizeIcon,
  MaximizeIcon,
  CloseIcon,
  ExternalIcon,
  AudioBars,
} from './icons';

interface TopBarProps {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  selectedVersion: string;
  username: string;
  onLogout?: () => void;
  friendsPending?: number;
  onOpenFriends?: () => void;
  astrixMode?: boolean;
  onToggleAstrixMode?: () => void;
}

/* Native window controls (pywebview injects window.pywebview.api); falls
   back to browser behaviour when not running inside the native app. */
function windowAction(action: 'minimize' | 'maximize' | 'close') {
  const api = (window as any).pywebview?.api;
  if (api && typeof api[action] === 'function') {
    api[action]();
    return;
  }
  if (action === 'close') window.close();
}

export default function TopBar({
  onNavigate,
  selectedVersion,
  username,
  onLogout,
  friendsPending = 0,
  onOpenFriends,
  astrixMode = false,
  onToggleAstrixMode,
}: TopBarProps) {
  // In the native desktop app (pywebview) the OS title bar handles these.
  const isNative = !!(window as any).pywebview;
  return (
    <header className="topbar">
      <button
        className={`quick-play ${astrixMode ? 'quick-play-astrix' : ''}`}
        onClick={onToggleAstrixMode}
        title={astrixMode ? 'Back to Flame Client mode' : 'Switch to Astrix Mode (FlameClient x AstrixPvP)'}
      >
        <GridIcon size={16} />
        <span>{astrixMode ? 'SWITCH TO FLAMECLIENT' : 'SWITCH TO ASTRIX MODE'}</span>
      </button>

      <div className="topbar-right">
        <button className="top-pill" title={`Playing on ${username}`}>
          <span className="avatar-ring">
            <SkinFace username={username} size={26} />
          </span>
          <span className="playing-text">
            <span className="playing-on">Playing on</span>
            <span className="player-name">{username}</span>
          </span>
        </button>

        {onLogout && (
          <button className="top-icon-btn" title="Log out" onClick={onLogout}>
            <LogoutIcon size={16} />
          </button>
        )}

        <button
          className="top-icon-btn icon-badge-wrap"
          title={friendsPending > 0 ? `${friendsPending} friend request${friendsPending === 1 ? '' : 's'}` : 'Friends'}
          onClick={onOpenFriends ?? (() => onNavigate('friends'))}
        >
          <UserIcon size={18} />
          {friendsPending > 0 && <span className="red-badge">{friendsPending}</span>}
        </button>

        <button className="top-icon-btn" title="Inbox" onClick={() => onNavigate('news')}>
          <MailIcon size={18} />
        </button>

        {!isNative && (
          <div className="window-controls">
            <button className="win-btn" title="Minimize" onClick={() => windowAction('minimize')}>
              <MinimizeIcon size={15} />
            </button>
            <button className="win-btn" title="Maximize" onClick={() => windowAction('maximize')}>
              <MaximizeIcon size={13} />
            </button>
            <button className="win-btn win-close" title="Close" onClick={() => windowAction('close')}>
              <CloseIcon size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function LogoutIcon(p: { size?: number }) {
  return (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function TopBarExtras() {
  return (
    <>
      <button className="top-icon-btn" title="Audio">
        <AudioBars />
      </button>
      <button className="instances-btn" title="Instances">
        <span>0 Instances Running</span>
        <ExternalIcon size={14} />
      </button>
    </>
  );
}
