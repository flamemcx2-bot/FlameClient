/* Fail-soft client for the Python launcher backend (python_launcher/launcher.py).
   Every call returns null when the backend isn't reachable, so the UI still
   works as a plain mock when served by `vite dev`. */

import type { FriendsData, ChatMessage } from './types';

export interface LauncherStatus {
  ok: boolean;
  authed: boolean;
  username: string | null;
  auth_mode?: 'offline' | 'online';
  account_mode?: 'offline' | 'online' | null;
  ms_linked?: boolean;
  java: { path: string; version: string } | null;
  minecraft_dir: string;
  installed: string[];
  memory_mb: number;
  total_memory_mb: number;
  port: number;
  default_version: string | null;
  game_running?: boolean;
  game_pid?: number | null;
  notifications_enabled?: boolean;
  /** Whether a "friend started playing" toast fires when a friend goes in-game. */
  notifications_playing?: boolean;
  /** Whether the separate Launch Logs window opens on install/launch. */
  show_launch_logs?: boolean;
  /** Discord account link (Astrix Mode's Tier Queue requires it). */
  discord_linked?: boolean;
  discord_user?: DiscordProfile | null;
  launcher_version?: string;
  launcher_display_version?: string;
  /** Last known state of the launcher's own update check. */
  update?: UpdatePeek;
}

export interface UpdateDownloadState {
  state?: 'downloading' | 'launching' | 'started' | 'error';
  received?: number;
  total?: number;
  version?: string;
  error?: string | null;
  path?: string;
}

/** Cheap, non-blocking update snapshot carried by /api/status. */
export interface UpdatePeek {
  current: string;
  available: boolean;
  latest: string | null;
  latest_display: string | null;
  notes: string;
  checked_at?: number;
  download: UpdateDownloadState | null;
}

export interface UpdateInfo extends UpdatePeek {
  ok: boolean;
  current_display: string;
  required: boolean;
  published: string;
  size: number;
  download_page: string;
  check_error: string | null;
}

export interface UpdateActionResult {
  ok: boolean;
  error?: string;
  url?: string;
  update?: UpdateInfo;
}

export interface VersionList {
  ok: boolean;
  installed: string[];
  available: string[];
  default_version: string | null;
  loaders?: Record<string, string>;
  version_dirs?: Record<string, string>;
}

export interface LaunchResult {
  ok: boolean;
  pid?: number;
  version?: string;
  error?: string;
  java?: string;
  /** True when the work was accepted and now runs in the background. */
  started?: boolean;
  /** Id of the backend task carrying its log lines + progress. */
  seq?: number;
}

/**
 * A background install / launch / update job on the backend. It reports its own
 * progress because a first launch can download hundreds of megabytes; the
 * separate Launch Logs window and the home screen's status line both read it.
 */
export interface TaskState {
  ok: boolean;
  seq: number;
  kind: 'launch' | 'install' | 'update' | null;
  version: string;
  astrix: boolean;
  status: 'idle' | 'running' | 'done' | 'error';
  stage: string;
  progress: number;
  percent: number;
  error: string | null;
  pid: number | null;
  elapsed: number;
  total_lines: number;
  lines: string[];
  show_window: boolean;
}

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function getStatus(): Promise<LauncherStatus | null> {
  return getJSON<LauncherStatus>('/api/status');
}

export function getVersions(): Promise<VersionList | null> {
  return getJSON<VersionList>('/api/versions');
}

export async function launch(
  version: string,
  astrix = false,
  server?: string,
): Promise<LaunchResult | null> {
  try {
    const r = await fetch('/api/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version, astrix, server: server || undefined }),
    });
    return (await r.json()) as LaunchResult;
  } catch {
    return null;
  }
}

/** A website news post, as served by the launcher backend (banner + title). */
export interface WebNewsPost {
  id: string;
  title: string;
  banner: string;
  createdAt: string;
  url: string;
}

export async function getNews(): Promise<WebNewsPost[]> {
  try {
    const r = await getJSON<{ ok: boolean; posts: WebNewsPost[] }>('/api/news');
    return r && r.ok ? r.posts : [];
  } catch {
    return [];
  }
}

/** A partnered server, as entered in the website's admin portal. */
export interface PartneredServer {
  id: string;
  name: string;
  ip: string;
  banner: string;
  logo: string;
  createdAt: string;
}

export async function getServers(): Promise<PartneredServer[]> {
  try {
    const r = await getJSON<{ ok: boolean; servers: PartneredServer[] }>('/api/servers');
    return r && r.ok ? r.servers : [];
  } catch {
    return [];
  }
}

export interface LoginResult {
  ok: boolean;
  username?: string;
  authed?: boolean;
  error?: string;
}

export async function login(
  username: string,
  password: string,
  mode: 'login' | 'register' | 'offline',
): Promise<LoginResult | null> {
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, mode }),
    });
    return (await r.json()) as LoginResult;
  } catch {
    return null;
  }
}

export async function logout(): Promise<LoginResult | null> {
  try {
    const r = await fetch('/api/logout', { method: 'POST' });
    return (await r.json()) as LoginResult;
  } catch {
    return null;
  }
}

export interface MicrosoftStart {
  ok: boolean;
  user_code?: string;
  verification_uri?: string;
  message?: string;
  interval?: number;
  expires_in?: number;
  manual_redirect?: boolean;
  error?: string;
}

export interface MicrosoftPoll {
  status: 'pending' | 'authorized' | 'expired' | 'error';
  username?: string;
  error?: string;
}

export async function microsoftStart(): Promise<MicrosoftStart | null> {
  try {
    const r = await fetch('/api/microsoft/start', { method: 'POST' });
    return (await r.json()) as MicrosoftStart;
  } catch {
    return null;
  }
}

export async function microsoftPoll(): Promise<MicrosoftPoll | null> {
  try {
    const r = await fetch('/api/microsoft/poll', { method: 'POST' });
    return (await r.json()) as MicrosoftPoll;
  } catch {
    return null;
  }
}

/** Live state of the backend's install/launch task (`since` = lines we have). */
export function getTask(since = 0): Promise<TaskState | null> {
  return getJSON<TaskState>(`/api/task?since=${since}`);
}

export async function install(version: string): Promise<LaunchResult | null> {
  try {
    const r = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version }),
    });
    return (await r.json()) as LaunchResult;
  } catch {
    return null;
  }
}

export type PackType = 'mods' | 'resourcepacks';

export interface PackItem {
  name: string;
  size: number;
  modified: number;
  /** Core mods (e.g. the offline skin loader) are protected by the backend. */
  locked?: boolean;
}

export interface PackList {
  ok: boolean;
  type: string;
  items: PackItem[];
  error?: string;
}

export interface SimpleResult {
  ok: boolean;
  error?: string;
  name?: string;
  size?: number;
}

export interface CosmeticsInfo {
  ok: boolean;
  username: string | null;
  authed: boolean;
  versions?: string[];
  astrix?: boolean;
  /** "flameclient-skin": the launcher hands the PNGs to the game as JVM
   * properties and the bundled mod applies them. No external loader. */
  engine?: string;
  /** Base URL the mod may fall back to when a texture is not on disk. */
  api?: string;
  skin_b64?: string | null;
  cape_b64?: string | null;
}

export interface CosmeticsSaveResult {
  ok: boolean;
  saved?: string[];
  error?: string;
}

/**
 * Open a link outside the app (Discord, the website). Inside the pywebview
 * window a plain target=_blank does nothing, so the native bridge does it; in
 * a browser (vite dev) a new tab is the same thing.
 */
export function openExternal(url: string) {
  const api = (window as any).pywebview?.api;
  if (api && typeof api.open_url === 'function') {
    api.open_url(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getCosmetics(): Promise<CosmeticsInfo | null> {
  return getJSON<CosmeticsInfo>('/api/cosmetics');
}

export async function saveCosmetics(
  skinB64: string | null,
  capeB64: string | null,
): Promise<CosmeticsSaveResult | null> {
  try {
    const r = await fetch('/api/cosmetics/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skin_b64: skinB64, cape_b64: capeB64 }),
    });
    return (await r.json()) as CosmeticsSaveResult;
  } catch {
    return null;
  }
}

export interface ModrinthHit {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  author: string;
  downloads: number;
  follows: number;
  game_versions: string[];
  loaders: string[];
}

export interface ModrinthSearch {
  ok: boolean;
  hits: ModrinthHit[];
  error?: string;
}

export async function listPacks(type: PackType, version = ''): Promise<PackList | null> {
  const v = version ? `&version=${encodeURIComponent(version)}` : '';
  return getJSON<PackList>(`/api/packs?type=${type}${v}`);
}

export async function deletePack(
  type: PackType,
  name: string,
  version = '',
): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/packs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, version }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function renamePack(
  type: PackType,
  oldName: string,
  newName: string,
  version = '',
): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/packs/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, old: oldName, new: newName, version }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function uploadPack(
  type: PackType,
  name: string,
  data: Blob,
  version = '',
): Promise<SimpleResult | null> {
  try {
    const r = await fetch(
      `/api/packs/upload?type=${type}&name=${encodeURIComponent(name)}${version ? `&version=${encodeURIComponent(version)}` : ''}`,
      {
        method: 'POST',
        body: data,
      },
    );
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function openPackFolder(type: PackType, version = ''): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/packs/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, version }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function searchModrinth(
  query: string,
  type: PackType,
  version: string,
): Promise<ModrinthSearch | null> {
  const q = encodeURIComponent(query || '');
  return getJSON<ModrinthSearch>(`/api/modrinth/search?query=${q}&type=${type}&version=${encodeURIComponent(version)}`);
}

export async function installModrinth(
  projectId: string,
  version: string,
  type: PackType,
): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/modrinth/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, version, type }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

// ---- Friends & DMs ----

export function getFriends(): Promise<FriendsData | null> {
  return getJSON<FriendsData>('/api/friends');
}

export async function sendFriendRequest(username: string): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function acceptFriend(username: string): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function ignoreFriend(username: string): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/friends/ignore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function removeFriend(username: string): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/friends/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export interface ChatResult {
  ok: boolean;
  user?: string;
  messages?: ChatMessage[];
  error?: string;
}

export function getMessages(user: string): Promise<ChatResult | null> {
  return getJSON<ChatResult>(`/api/friends/messages?user=${encodeURIComponent(user)}`);
}

export async function sendMessage(user: string, text: string): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/friends/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, text }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

export async function markRead(user: string): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/friends/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}

// ---- Launcher updates ----

/** Last known update state; the backend refreshes its feed in the background. */
export function getUpdate(): Promise<UpdateInfo | null> {
  return getJSON<UpdateInfo>('/api/update');
}

/** Force a fresh check against the published release feed. */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const r = await fetch('/api/update/check', { method: 'POST' });
    if (!r.ok) return null;
    return (await r.json()) as UpdateInfo;
  } catch {
    return null;
  }
}

/** Download the published installer and start it (the setup closes this app). */
export async function installUpdate(): Promise<UpdateActionResult | null> {
  try {
    const r = await fetch('/api/update/install', { method: 'POST' });
    return (await r.json()) as UpdateActionResult;
  } catch {
    return null;
  }
}

/** Open the official download page in the browser. */
export async function openDownloadPage(): Promise<UpdateActionResult | null> {
  try {
    const r = await fetch('/api/update/open', { method: 'POST' });
    return (await r.json()) as UpdateActionResult;
  } catch {
    return null;
  }
}

// ---- Optimizer & Game Booster ----
// Backed by python_launcher/optimizer/ (see .freebuff/run.md § Optimizer).

export type PriorityClass = 'normal' | 'above_normal' | 'high' | 'realtime';
export type GcProfile = 'auto' | 'balanced' | 'low_latency' | 'max_perf';

export interface OptimizerSettings {
  high_fps_mode: boolean;
  low_latency_mode: boolean;
  priority_booster: boolean;
  priority_class: PriorityClass;
  gc_profile: GcProfile;
  memory_mode: 'auto' | 'manual';
  memory_mb: number | null;
  mods_enabled: boolean;
  mods_list: string[];
  visuals_enabled: boolean;
  visuals_preset: 'low_latency' | 'balanced';
  render_distance_cap: number;
  tcp_tweaks: boolean;
  flush_dns: boolean;
  dns_auto: boolean;
  dns_primary: string | null;
  dns_secondary: string | null;
  ping_host: string;
  ping_port: number;
  ping_targets: { label: string; host: string; port: number }[];
}

export interface OptimizerHardware {
  os: string;
  arch: string;
  cpu: string;
  cores: number;
  gpu: string;
  ram_total_mb: number;
  ram_available_mb: number;
  power_plan: string;
  admin: boolean;
  windows: boolean;
}

export interface OptimizerJvmPlan {
  memory_mb: number;
  xms_mb: number;
  args: string[];
  gc: string;
  profile: string;
  notes: string[];
  warnings: string[];
}

export interface OptimizerFps {
  baseline: number;
  boosted: number;
  baseline_range: [number, number];
  boosted_range: [number, number];
  gain_percent: number;
  gpu_tier: string;
  drivers: string[];
  confirm: string;
}

export interface OptimizerMod {
  slug: string;
  name: string;
  role: string;
  wanted: boolean;
  installed: boolean;
  file?: string | null;
  size?: number | null;
}

export interface TcpTweakState {
  supported: boolean;
  interfaces: { guid: string; ip: string; TcpAckFrequency?: number | null; TCPNoDelay?: number | null }[];
  applied_interfaces: number;
  applied: boolean;
  detail: string;
}

export interface DnsAdapter {
  name: string;
  source: string;
  servers: string[];
}

export interface ResolverResult {
  ip: string;
  name: string;
  note: string;
  ms: number | null;
  ok: boolean;
  resolved: string[];
  error: string | null;
}

export interface LatencySample {
  t: number;
  ms: number | null;
  mode?: string | null;
  online?: number | null;
  max?: number | null;
}

export interface PingSnapshot {
  ok?: boolean;
  target: { host: string; port: number };
  running: boolean;
  interval: number;
  samples: LatencySample[];
  stats: {
    last: number | null;
    samples: number;
    avg?: number | null;
    min?: number | null;
    max?: number | null;
    jitter?: number | null;
    loss?: number;
  };
  players_online?: number | null;
  players_max?: number | null;
  mode?: string | null;
}

export interface OptimizerStatus {
  ok: boolean;
  error?: string;
  detail?: string;
  astrix?: boolean;
  settings: OptimizerSettings;
  hardware: OptimizerHardware;
  java: { path: string | null; version: string | null };
  jvm_plan: OptimizerJvmPlan | null;
  gc_support: Record<string, boolean | number>;
  profiles: Record<string, string>;
  mods: OptimizerMod[];
  fps: OptimizerFps | null;
  tcp: TcpTweakState;
  dns: DnsAdapter[];
  resolvers: { ip: string; name: string; note: string }[];
  processes: { supported: boolean; processes: { name: string; pid: number; mem_mb: number; hint: string }[]; count: number; total_mb: number; note: string };
  ping: PingSnapshot;
  last_launch: {
    at: number;
    version: string;
    astrix: boolean;
    applied: string[];
    warnings: string[];
  } | null;
  audit: { at: number; event: string }[];
}

export interface OptimizerReport {
  applied: string[];
  warnings: string[];
  notes: string[];
  jvm: OptimizerJvmPlan | null;
  version: string;
}

/** Full optimizer state for the Optimizer screen. */
export function getOptimizer(
  version: string,
  astrix = false,
): Promise<OptimizerStatus | null> {
  return getJSON<OptimizerStatus>(
    `/api/optimizer?version=${encodeURIComponent(version)}${astrix ? '&astrix=1' : ''}`,
  );
}

/** Live latency history (polled while the Optimizer screen is open). */
export function getPing(): Promise<PingSnapshot | null> {
  return getJSON<PingSnapshot>('/api/optimizer/ping');
}

async function postOptimizer<T>(path: string, body: unknown = {}): Promise<T | null> {
  try {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function patchOptimizer(patch: Partial<OptimizerSettings>): Promise<SimpleResult | null> {
  return postOptimizer<SimpleResult>('/api/optimizer/settings', patch);
}

export function applyOptimizer(version: string, astrix = false): Promise<{ ok: boolean; report?: OptimizerReport } | null> {
  return postOptimizer('/api/optimizer/apply', { version, astrix });
}

export function revertOptimizer(): Promise<{ ok: boolean; actions?: string[]; warnings?: string[] } | null> {
  return postOptimizer('/api/optimizer/revert');
}

export function elevateOptimizer(): Promise<{ ok: boolean; note?: string; already_admin?: boolean } | null> {
  return postOptimizer('/api/optimizer/elevate');
}

export function benchmarkDns(domain?: string): Promise<{ ok: boolean; best?: ResolverResult; results?: ResolverResult[]; domain?: string; error?: string } | null> {
  return postOptimizer('/api/optimizer/dns/benchmark', { domain, samples: 2, timeout: 1.2 });
}

export function applyDns(body: { primary?: string; secondary?: string; auto?: boolean; domain?: string }): Promise<{ ok: boolean; primary?: string; before_ms?: number | null; after_ms?: number | null; improved_ms?: number | null; adapters?: string[]; error?: string; needs_admin?: boolean } | null> {
  return postOptimizer('/api/optimizer/dns/apply', body);
}

export function restoreDns(): Promise<SimpleResult | null> {
  return postOptimizer('/api/optimizer/dns/restore');
}

export function applyTcpTweaks(): Promise<{ ok: boolean; changed?: string[]; notes?: string[]; error?: string; needs_admin?: boolean } | null> {
  return postOptimizer('/api/optimizer/tcp/apply');
}

export function revertTcpTweaks(): Promise<SimpleResult | null> {
  return postOptimizer('/api/optimizer/tcp/revert');
}

export function setPingTarget(host: string, port: number): Promise<SimpleResult | null> {
  return postOptimizer('/api/optimizer/ping/target', { host, port });
}

export function stopPing(): Promise<SimpleResult | null> {
  return postOptimizer('/api/optimizer/ping/stop');
}

export function endProcess(pid: number): Promise<{ ok: boolean; name?: string | null; error?: string | null } | null> {
  return postOptimizer('/api/optimizer/processes/end', { pid });
}

// ---- Discord Rich Presence ----
// Backed by python_launcher/discord_rpc.py: a title plus four lines for Flame
// Mode and for Astrix Mode (which uses its own Discord application).

export interface RpcBlock {
  title: string;
  line1: string;
  line2: string;
  line3: string;
  line4: string;
}

export interface RpcAstrixBlock extends RpcBlock {
  /** Discord application id Astrix Mode posts from. */
  application_id: string;
}

export interface RpcSettings extends RpcBlock {
  astrix: RpcAstrixBlock;
}

export interface RpcPlaceholder {
  token: string;
  label: string;
}

/** What Discord actually renders (two text rows) for one mode. */
export interface RpcPreview {
  title: string;
  details: string;
  state: string;
}

export interface RpcInfo {
  ok: boolean;
  settings: RpcSettings;
  defaults: RpcSettings;
  placeholders: RpcPlaceholder[];
  application_id: string;
  astrix_application_id: string;
  preview: { flame?: RpcPreview; astrix?: RpcPreview } | Record<string, never>;
  error?: string;
}

export interface RpcSaveResult {
  ok: boolean;
  applied?: boolean;
  settings?: RpcSettings;
  preview?: RpcInfo['preview'];
  error?: string;
}

/** The saved Rich Presence text plus the placeholders the UI lists. */
export function getRpc(): Promise<RpcInfo | null> {
  return getJSON<RpcInfo>('/api/rpc');
}

/** Persist the Rich Presence text; the backend applies it immediately. */
export async function saveRpc(settings: RpcSettings): Promise<RpcSaveResult | null> {
  try {
    const r = await fetch('/api/rpc/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    return (await r.json()) as RpcSaveResult;
  } catch {
    return null;
  }
}

/* ============ Discord account linking (Astrix Mode Tier Queue) ============
   The link is a real Discord OAuth sign-in: the backend opens Discord's
   authorize page in the browser and catches the redirect on its own loopback
   port, then keeps only the account's identity (never the token). */

/** The linked account's public identity — everything the UI ever sees. */
export interface DiscordProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface DiscordUser extends DiscordProfile {
  linked_at: number;
}

export interface DiscordState {
  ok: boolean;
  linked: boolean;
  user: DiscordUser | null;
  /** The Discord application the launcher signs in through. */
  client_id: string;
  /** Redirect URLs that must be registered on that application. */
  redirect_uris: string[];
  callback_port: number | null;
  /** A sign-in is in flight — the browser tab is probably still open. */
  pending: boolean;
  expired: boolean;
  error: string | null;
  expires_in: number;
  url?: string;
}

export interface TierState {
  ok: boolean;
  linked: boolean;
  tiers: string[];
  joined: string[];
  joined_at: Record<string, number>;
  /** A Minecraft client is running: the Astrix server sees changes at once. */
  game_running?: boolean;
  /** Set by a join/leave: which tier changed and how. */
  tier?: string;
  action?: 'join' | 'leave';
  already?: boolean;
  error?: string;
  /** The account is not linked yet (HTTP 403). */
  needs_discord?: boolean;
}

/** Link state + whatever sign-in is currently in flight. */
export function getDiscord(): Promise<DiscordState | null> {
  return getJSON<DiscordState>('/api/discord');
}

function post<T>(url: string, payload?: unknown): Promise<T | null> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
    .then((r) => r.json() as Promise<T>)
    .catch(() => null);
}

/** Open Discord's authorize page in the browser; returns the URL it opened. */
export function startDiscordLink(): Promise<DiscordState | null> {
  return post<DiscordState>('/api/discord/link');
}

/** Forget the linked Discord account. */
export function unlinkDiscord(): Promise<DiscordState | null> {
  return post<DiscordState>('/api/discord/unlink');
}

/** Stop waiting for a sign-in the user abandoned (closes the gate). */
export function cancelDiscordLink(): Promise<DiscordState | null> {
  return post<DiscordState>('/api/discord/cancel');
}

/** The eleven tiers plus the ones this Discord account queued for. */
export function getTiers(): Promise<TierState | null> {
  return getJSON<TierState>('/api/tier');
}

/** Join one tier's queue (the backend knows the linked Discord account). */
export function joinTier(tier: string): Promise<TierState | null> {
  return post<TierState>('/api/tier/join', { tier });
}

/** Leave one tier's queue. */
export function leaveTier(tier: string): Promise<TierState | null> {
  return post<TierState>('/api/tier/leave', { tier });
}

export async function updateSettings(
  patch: Partial<{
    notifications_enabled: boolean;
    notifications_playing: boolean;
    show_launch_logs: boolean;
  }>,
): Promise<SimpleResult | null> {
  try {
    const r = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return (await r.json()) as SimpleResult;
  } catch {
    return null;
  }
}
