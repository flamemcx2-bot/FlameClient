export type Screen =
  | 'home'
  | 'versions'
  | 'mods'
  | 'news'
  | 'servers'
  | 'shop'
  | 'settings'
  | 'friends'
  | 'cosmetics'
  | 'optimizer'
  /* Astrix Mode only, and gated behind a linked Discord account. */
  | 'tierqueue';

/**
 * The Tier Queue tiers. These ids are the contract with the backend
 * (TIER_QUEUE in python_launcher/launcher.py validates every join against the
 * same list), so a typo here is caught by the tier-queue test gate instead of
 * silently writing junk into config.json.
 */
export type TierId =
  | 'vanilla'
  | 'uhc'
  | 'pot'
  | 'nethop'
  | 'smp'
  | 'sword'
  | 'axe'
  | 'mace'
  | 'elytramace'
  | 'spearmace'
  | 'cart';

export interface TierCard {
  id: TierId;
  /** What the card is called on screen (the art carries the same name). */
  label: string;
}

export interface FriendUser {
  username: string;
  at?: number;
  /** The backend saw this friend's last session beat a moment ago. */
  playing?: boolean;
}

export interface FriendsData {
  ok: boolean;
  me: string | null;
  requests: FriendUser[];
  friends: FriendUser[];
  dm_unread: Record<string, number>;
}

export interface ChatMessage {
  from: string;
  text: string;
  at: number;
}

export interface GameVersion {
  id: string;
  label: string;
  tag?: string;
}

export type NewsArt =
  /* FlameClient news (real banners) */
  | 'flame-2-1-0'
  | 'astrix-partners'
  | 'flame-1-0-1'
  | 'codeon-hosting'
  /* Astrix Mode news (real banners) */
  | 'astrix-discord'
  | 'astrix-hosting'
  | 'astrix-server'
  | 'astrix-tierlist';

export interface NewsCard {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  art: NewsArt;
}

