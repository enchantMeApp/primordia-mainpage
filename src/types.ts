// Response shapes for the admin API.
// These must stay in sync with the routes registered by admin.js in the game
// backend — the panel and the server are shipped from two different repos, so
// this file is the only place the contract is written down.

export interface LoginResponse {
  token: string;
}

export interface SessionResponse {
  ok: boolean;
  user: string;
}

export interface OverviewResponse {
  uptimeMs: number;
  node: string;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  db: { ok: boolean; error?: string };
  redis: { ok: boolean; error?: string };
  wsClients: number;
  online: { connected: number; active: number };
  stats: { enabled: boolean; bufferLength: number };
}

export interface OnlineUser {
  userId: number;
  displayName: string;
  playerTag: string | null;
  sockets: number;
  since: number;
}

export interface PlayersResponse {
  connected: OnlineUser[];
  activeCount: number;
}

export interface RecentPlayer {
  userId: number;
  login: string | null;
  charName: string | null;
  playerTag: string | null;
  level: number;
  location: string | null;
  lastSeenMs: number;
  active: boolean;
}

export interface LastOnlineResponse {
  windowMs: number;
  players: RecentPlayer[];
}

export interface AccountRow {
  userId: number;
  login: string | null;
  charName: string | null;
  playerTag: string | null;
  level: number;
  location: string | null;
  createdAt: string;
  verified: boolean;
}

export interface AccountsResponse {
  totals: {
    total: number;
    last24h: number;
    last7d: number;
    last30d: number;
    verified: number;
  };
  recent: AccountRow[];
  growth: { day: string; count: number }[];
  levels: { level: number; count: number }[];
}

export interface LocationSummary {
  location: string;
  players: number;
}

export interface LocationsResponse {
  total: number;
  locations: LocationSummary[];
}

export interface LocationPlayer {
  userId: number;
  login: string | null;
  charName: string | null;
  playerTag: string | null;
  level: number;
}

export interface LocationPlayersResponse {
  location: string;
  players: LocationPlayer[];
}

export interface ChatMessage {
  id: number;
  user_id: number;
  user_login: string;
  message: string;
  created_at: string;
}

export interface ChatPageResponse {
  messages: ChatMessage[];
  nextBefore: number | null;
}

export interface Pm2Process {
  name: string;
  id: number;
  status: string;
  uptime: number;
  restarts: number;
}

export interface StatusResponse {
  available: boolean;
  error?: string;
  processes: Pm2Process[];
}

export interface RestartResponse {
  scheduled: boolean;
  target: string;
}

// ---- redeem codes --------------------------------------------------------

export type RewardType =
  | 'bonds'
  | 'lore'
  | 'stat_points'
  | 'resource'
  | 'item'
  | 'blueprint'
  | 'cosmetic'
  | 'egg';

export type EggSelectorMode = 'fixed' | 'pool' | 'range' | 'random';

export type EggSelector =
  | { mode: 'fixed'; value: string | number }
  | { mode: 'pool'; values: (string | number)[] }
  | { mode: 'range'; min: number; max: number }
  | { mode: 'random' };

export type EggStatKey = 'attack' | 'defense' | 'speed' | 'vig';

export interface EggSpec {
  species: EggSelector;
  gender: EggSelector;
  color: EggSelector;
  stats?: Partial<Record<EggStatKey, EggSelector>>;
}

export interface Reward {
  type: RewardType;
  amount?: number;
  resource?: string;
  item?: string;
  blueprint?: string;
  tier?: string;
  kind?: string;
  key?: string;
  egg?: EggSpec;
}

export interface RedeemCode {
  code: string;
  label?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  rewards: Reward[];
}

export interface SimpleCatalogEntry {
  key: string;
  name: string;
}

export interface ItemCatalogEntry extends SimpleCatalogEntry {
  type: string;
  stackable: boolean;
}

export interface BlueprintTierEntry extends SimpleCatalogEntry {
  uses: number;
  min_percentage: number;
  max_percentage: number;
}

export interface EggSpeciesEntry extends SimpleCatalogEntry {
  stats: Record<EggStatKey, number>;
}

export interface EggColorEntry {
  value: number;
  name: string;
}

export interface EggStatEntry {
  key: EggStatKey;
  name: string;
}

export interface EggCatalogs {
  species: EggSpeciesEntry[];
  genders: string[];
  colors: EggColorEntry[];
  stats: EggStatEntry[];
  maxEggAmount: number;
  maxColor: number;
  maxStat: number;
}

export interface CodesCatalogs {
  balanceKinds: { type: RewardType; name: string }[];
  resources: SimpleCatalogEntry[];
  items: ItemCatalogEntry[];
  blueprints: { key: string; name: string; item_key: string }[];
  blueprintTiers: BlueprintTierEntry[];
  cosmetics: Record<string, SimpleCatalogEntry[]>;
  eggs: EggCatalogs;
}

export interface CodesResponse {
  codes: RedeemCode[];
}

export interface CodeResponse {
  code: RedeemCode;
}
