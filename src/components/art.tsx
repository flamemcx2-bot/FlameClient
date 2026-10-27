import astroSky from '../assets/astro-sky.png';
import prehistoricCollection from '../assets/prehistoric-collection.png';
import modpackCard from '../assets/modpack-card.png';
import mccIsland from '../assets/mcc-island.png';
import mccModlist from '../assets/mcc-modlist.png';
import lifestealSmp from '../assets/lifesteal-smp.png';
import lunarSmp from '../assets/lunar-smp.png';
import lifesteal2 from '../assets/lifesteal2.png';
import easterCollection from '../assets/easter-collection.png';
import miniWings from '../assets/mini-wings.png';
import astrixLogo from '../assets/astrix-logo.png';
import astrixBg from '../assets/astrix-bg.png';
import astrixDiscord from '../assets/astrix-discord.png';
import astrixHosting from '../assets/astrix-hosting.png';
import astrixServer from '../assets/astrix-server.jpg';
import astrixTierlist from '../assets/astrix-tierlist.jpg';
import type { NewsArt, TierId } from '../types';
/* Tier Queue card art (Astrix Mode). One image per tier, named after the id
   in TIER_QUEUE so the tab can look the art up by tier id. */
import tierVanilla from '../assets/tier/vanilla.png';
import tierUhc from '../assets/tier/uhc.png';
import tierPot from '../assets/tier/pot.png';
import tierNethop from '../assets/tier/nethop.png';
import tierSmp from '../assets/tier/smp.png';
import tierSword from '../assets/tier/sword.png';
import tierAxe from '../assets/tier/axe.png';
import tierMace from '../assets/tier/mace.png';
import tierElytramace from '../assets/tier/elytramace.png';
import tierSpearmace from '../assets/tier/spearmace.png';
import tierCart from '../assets/tier/cart.png';
import flame210 from '../assets/flameclient-2.1.0v.png';
import flame101 from '../assets/flameclient-1.0.1v.png';
import astrixPartner from '../assets/astrix-partner.png';
/* Codeon Hosting's banner is the same artwork already shipped for the Astrix
   "HOSTING CODEON HOSTING" card, so it reuses that asset instead of a copy. */
import codeonHosting from '../assets/astrix-hosting.png';

/* ========== Hero ========== */

export function HeroArt({ astrix = false }: { astrix?: boolean }) {
  return (
    <img
      src={astrix ? astrixBg : astroSky}
      alt=""
      className="hero-bg-img"
      draggable={false}
    />
  );
}

export function AstrixLogoArt({ className }: { className?: string }) {
  return <img src={astrixLogo} alt="" className={`card-bg-img astrix-logo-art ${className ?? ''}`} draggable={false} />;
}

/* ========== Astrix Mode news card backgrounds ========== */

export function AstrixDiscordArt({ className }: { className?: string }) {
  return <img src={astrixDiscord} alt="" className={`card-bg-img ${className ?? ''}`} draggable={false} />;
}

export function AstrixHostingArt({ className }: { className?: string }) {
  return <img src={astrixHosting} alt="" className={`card-bg-img ${className ?? ''}`} draggable={false} />;
}

export function AstrixServerArt({ className }: { className?: string }) {
  return <img src={astrixServer} alt="" className={`card-bg-img ${className ?? ''}`} draggable={false} />;
}

/* Tier list card art — intentionally dimmed so the text pops. */
export function AstrixTierlistArt({ className }: { className?: string }) {
  return <img src={astrixTierlist} alt="" className={`card-bg-img astrix-tierlist-art ${className ?? ''}`} draggable={false} />;
}

/* ========== Tier Queue card art (Astrix Mode) ========== */

/** Artwork for every tier on the Tier Queue tab, keyed by tier id. */
export const TIER_ART: Record<TierId, string> = {
  vanilla: tierVanilla,
  uhc: tierUhc,
  pot: tierPot,
  nethop: tierNethop,
  smp: tierSmp,
  sword: tierSword,
  axe: tierAxe,
  mace: tierMace,
  elytramace: tierElytramace,
  spearmace: tierSpearmace,
  cart: tierCart,
};

/* ========== News card backgrounds (real images) ========== */

interface ArtProps {
  className?: string;
}

/**
 * Full-size artwork for every news card, used by the NewsGrid lightbox so a
 * click shows the real banner (not the cropped, dimmed or overlaid tile).
 */
export const NEWS_ART_IMAGE: Record<NewsArt, string> = {
  'flame-2-1-0': flame210,
  'flame-1-0-1': flame101,
  'astrix-partners': astrixPartner,
  'codeon-hosting': codeonHosting,
  'astrix-discord': astrixDiscord,
  'astrix-hosting': astrixHosting,
  'astrix-server': astrixServer,
  'astrix-tierlist': astrixTierlist,
};

/* FlameClient's own update banners. */
export function Flame210Art({ className }: ArtProps) {
  return (
    <img
      src={flame210}
      alt=""
      className={`card-bg-img ${className ?? ''}`}
      draggable={false}
    />
  );
}

export function Flame101Art({ className }: ArtProps) {
  return (
    <img
      src={flame101}
      alt=""
      className={`card-bg-img ${className ?? ''}`}
      draggable={false}
    />
  );
}

/* Partner cards: FlameClient x AstrixPvP and Codeon Hosting. */
export function AstrixPartnerArt({ className }: ArtProps) {
  return (
    <img
      src={astrixPartner}
      alt=""
      className={`card-bg-img ${className ?? ''}`}
      draggable={false}
    />
  );
}

export function CodeonHostingArt({ className }: ArtProps) {
  return (
    <img
      src={codeonHosting}
      alt=""
      className={`card-bg-img ${className ?? ''}`}
      draggable={false}
    />
  );
}

/* ========== Modpack backgrounds (real images) ========== */

export function CastleArt({ className }: ArtProps) {
  return (
    <img
      src={mccIsland}
      alt=""
      className={`card-bg-img ${className ?? ''}`}
      draggable={false}
    />
  );
}

export function MountainsArt({ className }: ArtProps) {
  return (
    <img
      src={lifestealSmp}
      alt=""
      className={`card-bg-img ${className ?? ''}`}
      draggable={false}
    />
  );
}