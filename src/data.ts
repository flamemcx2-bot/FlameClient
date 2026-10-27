import type { GameVersion, NewsCard, TierCard } from './types';

// Fallback versions — the live values come from the backend
// (/api/status -> launcher_version / launcher_display_version, kept in sync
// with python_launcher/launcher.py). The display form ("2.0.2v") is what the
// sidebar chip and Settings show; the bare number is for comparisons.
export const LAUNCHER_VERSION = '2.1.0';
export const LAUNCHER_DISPLAY_VERSION = '2.1.0v';

export const DEFAULT_VERSION = '1.21.11';

/**
 * Official website, account-creation deep link. The login screen sends new
 * users here; the site's `#create` anchor opens its account wizard.
 * (The live host redirects http -> https anyway.)
 */
export const CREATE_ACCOUNT_URL = 'https://flameclient.web.app/#create';

/**
 * Password-reset deep link. The site's `#reset` anchor opens its reset tab
 * directly (username + registered email -> emailed code -> new password).
 */
export const RESET_PASSWORD_URL = 'https://flameclient.web.app/#reset';

/** The only versions this launcher offers. Every 1.21.x/1.20.x line runs Fabric; 1.8.8 is Forge-only. */
export const HERO_VERSIONS = ['1.21.11', '1.21.1', '1.21', '1.20', '1.20.1', '1.8.8'];

/** Astrix Mode is locked to a single version. */
export const ASTRIX_VERSIONS = ['1.21.11'];

export const VERSIONS: GameVersion[] = [
  { id: '1.21.11', label: '1.21.11', tag: 'Recommended' },
  { id: '1.21.1', label: '1.21.1', tag: 'Fabric' },
  { id: '1.21', label: '1.21', tag: 'Fabric' },
  { id: '1.20', label: '1.20', tag: 'Fabric' },
  { id: '1.20.1', label: '1.20.1', tag: 'Fabric' },
  { id: '1.8.8', label: '1.8.8', tag: 'Forge' },
];

/* FlameClient news — the launcher's own updates plus partner cards.
   These are the same cards on the dashboard ("Latest News") and on the News tab. */
export const NEWS: NewsCard[] = [
  { id: 'flame-2-1-0', title: 'FLAMECLIENT', subtitle: 'V2.1.0', art: 'flame-2-1-0' },
  {
    id: 'astrix-partners',
    title: 'ASTRIX',
    subtitle: 'PARTNERS',
    badge: 'PARTNERS',
    art: 'astrix-partners',
  },
  { id: 'flame-1-0-1', title: 'FLAMECLIENT', subtitle: 'V1.0.1', art: 'flame-1-0-1' },
  {
    id: 'codeon-hosting',
    title: 'CODEON',
    subtitle: 'HOSTING',
    badge: 'PARTNERS',
    art: 'codeon-hosting',
  },
];

/* Astrix Mode's Tier Queue — the eleven tiers a player can queue for. The
   order is the order they appear in on the tab; the art for each one lives in
   src/assets/tier/ (see TIER_ART in components/art.tsx). */
export const TIER_QUEUE: TierCard[] = [
  { id: 'vanilla', label: 'VANILLA' },
  { id: 'uhc', label: 'UHC' },
  { id: 'pot', label: 'POT' },
  { id: 'nethop', label: 'NETHOP' },
  { id: 'smp', label: 'SMP' },
  { id: 'sword', label: 'SWORD' },
  { id: 'axe', label: 'AXE' },
  { id: 'mace', label: 'MACE' },
  { id: 'elytramace', label: 'ELYTRAMACE' },
  { id: 'spearmace', label: 'SPEARMACE' },
  { id: 'cart', label: 'CART' },
];

/* Astrix Mode (FlameClient x AstrixPvP) replaces the FlameClient news cards
   on both the dashboard and the News tab. */
export const ASTRIX_NEWS: NewsCard[] = [
  { id: 'astrix-discord', title: 'ASTRIXPVP', subtitle: 'DISCORD', art: 'astrix-discord' },
  {
    id: 'astrix-hosting',
    title: 'HOSTING',
    subtitle: 'CODEON HOSTING',
    badge: 'Partner',
    art: 'astrix-hosting',
  },
  {
    id: 'astrix-server',
    title: 'ASTRIXPVP',
    subtitle: 'SERVER',
    badge: 'Official Server',
    art: 'astrix-server',
  },
  { id: 'astrix-tierlist', title: 'NEW', subtitle: 'TIER LIST', art: 'astrix-tierlist' },
];


