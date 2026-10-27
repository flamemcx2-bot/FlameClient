import {
  GameIcon,
  PuzzleIcon,
  GlobeIcon,
  NewsIcon,
  StarIcon,
  CartIcon,
  GearIcon,
  UserIcon,
  ShirtIcon,
  BoltIcon,
  TierIcon,
  DiscordIcon,
} from './icons';
import type { Screen } from '../types';
import { openExternal } from '../api';
import { LAUNCHER_DISPLAY_VERSION } from '../data';
import logoUrl from '../assets/logo.png';
import astrixLogoUrl from '../assets/astrix-logo.png';

interface SidebarProps {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  friendsPending?: number;
  astrixMode?: boolean;
  /** Live launcher display version ("2.0.2v") from the backend. */
  version?: string;
  /** Newer version available — badges the version with an update dot. */
  updateVersion?: string | null;
}

/* Community links that sit under the tabs, always one click away. */
const DISCORD_URL = 'https://discord.gg/W5jP8PjzYh';
const WEBSITE_URL = 'https://flameclient.web.app';

const ITEMS: { id: Screen; icon: typeof GameIcon; label: string }[] = [
  { id: 'home', icon: GameIcon, label: 'Game' },
  { id: 'mods', icon: PuzzleIcon, label: 'Mods & Packs' },
  { id: 'versions', icon: GlobeIcon, label: 'Versions' },
  { id: 'news', icon: NewsIcon, label: 'News' },
  { id: 'servers', icon: StarIcon, label: '⭐ Partnered Servers' },
  { id: 'friends', icon: UserIcon, label: 'Friends' },
  { id: 'optimizer', icon: BoltIcon, label: 'Optimizer' },
  { id: 'shop', icon: CartIcon, label: 'Shop' },
  { id: 'cosmetics', icon: ShirtIcon, label: 'Cosmetics' },
];

/* Astrix Mode only: the Tier Queue sits right under Game, and is gated behind a
   linked Discord account (App.tsx opens the link prompt instead of the tab). */
const TIER_ITEM: { id: Screen; icon: typeof GameIcon; label: string } = {
  id: 'tierqueue',
  icon: TierIcon,
  label: 'Tier Queue',
};

export default function Sidebar({
  screen,
  onNavigate,
  friendsPending = 0,
  astrixMode = false,
  version = LAUNCHER_DISPLAY_VERSION,
  updateVersion = null,
}: SidebarProps) {
  // Astrix Mode hides the Shop and Mods tabs, rebrands the client, and adds
  // the Tier Queue right under Game.
  const items = astrixMode
    ? [
        ...ITEMS.filter((i) => i.id === 'home'),
        TIER_ITEM,
        ...ITEMS.filter(
          (i) => i.id !== 'home' && i.id !== 'shop' && i.id !== 'mods',
        ),
      ]
    : ITEMS;

  return (
    <nav className="sidebar" aria-label="Primary">
      <div
        className="sidebar-logo"
        title={astrixMode ? 'FlameClient x AstrixPvP' : 'Flame Client'}
      >
        <img
          src={astrixMode ? astrixLogoUrl : logoUrl}
          alt={astrixMode ? 'FlameClient x AstrixPvP' : 'Flame Client'}
        />
      </div>
      <div className="sidebar-items">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`sidebar-btn ${screen === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            title={label}
            aria-label={label}
            aria-current={screen === id ? 'page' : undefined}
          >
            <Icon size={21} />
            {id === 'friends' && friendsPending > 0 && (
              <span className="red-badge sidebar-badge">{friendsPending}</span>
            )}
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        <button
          className="sidebar-btn sidebar-link"
          onClick={() => openExternal(DISCORD_URL)}
          title="Join the FlameClient Discord"
          aria-label="Discord"
        >
          <DiscordIcon size={19} />
          <span>Discord</span>
        </button>
        <button
          className="sidebar-btn sidebar-link"
          onClick={() => openExternal(WEBSITE_URL)}
          title="Open flameclient.web.app"
          aria-label="Website"
        >
          <GlobeIcon size={19} />
          <span>Website</span>
        </button>
        <button
          className={`sidebar-btn ${screen === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          title="Settings"
          aria-label="Settings"
        >
          <GearIcon size={21} />
        </button>
        <span className="sidebar-version" title={updateVersion ? `FlameClient ${updateVersion} is available` : undefined}>
          {version}
          {updateVersion && <span className="update-dot" aria-label="Update available" />}
        </span>
      </div>
    </nav>
  );
}
