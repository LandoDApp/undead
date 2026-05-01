export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface GhoulSpawnPoint {
  id: string;
  position: Coordinate;
  spawnedAt: number;
}

export interface GhoulSpawnRequest {
  latitude: number;
  longitude: number;
  count?: number;
}

export interface GhoulSpawnResponse {
  spawns: GhoulSpawnPoint[];
}

export interface GhoulRouteRequest {
  ghoulLat: number;
  ghoulLon: number;
  playerLat: number;
  playerLon: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface GhoulRouteResponse {
  route: RoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface PlayerPositionUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  lastSeenAt: string | null;
  isActive: boolean;
}

export type MotionState = 'still' | 'walking' | 'running';

export interface GhoulState {
  id: string;
  position: Coordinate;
  routePoints: RoutePoint[];
  routeIndex: number;
  speedKmh: number;
  detectionRange: number;
  lastRouteUpdate: number;
  frozen: boolean;
}

export type TimeOfDay = 'day' | 'night' | 'blackout';

export interface GhoulCatchRequest {
  ghoulId: string;
  ghoulLat: number;
  ghoulLon: number;
  playerLat: number;
  playerLon: number;
}

export interface GhoulCatchResponse {
  hit: boolean;
  totalHits: number;
  isDown: boolean;
  downUntil: number | null;
  ghoulKilled: boolean;
}

export interface ServerGhoul {
  id: string;
  latitude: number;
  longitude: number;
  gridCell: string;
  isAlive: boolean;
  deadUntil: number | null;
}

export interface GhoulNearbyResponse {
  ghouls: ServerGhoul[];
}

export interface PlayerHealthState {
  hits: number;
  maxHits: number;
  isDown: boolean;
  downUntil: number | null;
}

// Resources
export type ResourceType = 'herb' | 'crystal' | 'relic';

export interface Resource {
  id: string;
  latitude: number;
  longitude: number;
  type: ResourceType;
  value: number;
  expiresAt: number;
}

export interface ResourcesNearbyResponse {
  resources: Resource[];
}

export interface CollectResourceResponse {
  collected: boolean;
  type: ResourceType;
  amount: number;
  newBalance: ResourceBalance;
}

export interface ResourceBalance {
  herbs: number;
  crystals: number;
  relics: number;
  lifetimeHerbs: number;
  lifetimeCrystals: number;
  lifetimeRelics: number;
}

/** @deprecated Use Resource instead */
export interface CollectiblePoint {
  id: string;
  latitude: number;
  longitude: number;
  value: number;
  expiresAt: number;
}

/** @deprecated Use ResourcesNearbyResponse instead */
export interface CollectiblePointsNearbyResponse {
  points: CollectiblePoint[];
}

/** @deprecated Use CollectResourceResponse instead */
export interface CollectPointResponse {
  collected: boolean;
  pointsEarned: number;
  newBalance: number;
}

/** @deprecated Use ResourceBalance instead */
export interface PlayerPointsBalance {
  totalPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

// Zone Healing & Upgrades
export interface ZoneHealRequest {
  amount: number;
  /** @deprecated Use herbsCost instead */
  pointsCost?: number;
}

export interface ZoneHealResponse {
  newCharge: number;
  herbsSpent: number;
  newBalance: ResourceBalance;
}

export interface ZoneUpgradeResponse {
  newLevel: number;
  newRadius: number;
  crystalsSpent: number;
  newBalance: ResourceBalance;
}

// Bastions
export type BastionLevel = 0 | 1 | 2;

export interface Bastion {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  level: BastionLevel;
  hp: number;
  maxHp: number;
  createdAt: number;
}

export interface BastionCreateRequest {
  name: string;
  latitude: number;
  longitude: number;
}

export interface BastionHealRequest {
  amount: number;
}

export interface BastionHealResponse {
  newHp: number;
  herbsSpent: number;
  newBalance: ResourceBalance;
}

export interface BastionUpgradeResponse {
  newLevel: BastionLevel;
  newMaxHp: number;
  crystalsSpent: number;
  newBalance: ResourceBalance;
}

export interface BastionReinforceResponse {
  newHp: number;
  bonusHp: number;
}

export interface BastionNearbyResponse {
  bastions: Bastion[];
}

// Bastion Idle System
export type WorkerType = 'herbalist' | 'miner' | 'scholar' | 'scout';

export interface BastionWorker {
  id: string;
  type: WorkerType;
  level: number;       // 0-2
  assignedAt: number;
}

export interface BastionStorage {
  herbs: number;
  crystals: number;
  relics: number;
  scoutReports: number;
  maxHerbs: number;
  maxCrystals: number;
  maxRelics: number;
  maxScoutReports: number;
  lastCollectedAt: number;
}

export interface BastionCollectResponse {
  collected: BastionStorage;
  newBalance: ResourceBalance;
  newStorage: BastionStorage;
}

export interface BastionIdleState {
  workers: BastionWorker[];
  storage: BastionStorage;
}

export interface BastionWorkerUpgradeResponse {
  worker: BastionWorker;
  crystalsSpent: number;
  newBalance: ResourceBalance;
}

// Quests
export type QuestType = 'daily' | 'weekly' | 'season';
export type QuestCategory = 'collect' | 'visit' | 'defeat' | 'walk' | 'heal' | 'upgrade';

export interface Quest {
  id: string;
  type: QuestType;
  category: QuestCategory;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  rewardType: ResourceType | 'xp';
  rewardAmount: number;
  expiresAt: number;
  completedAt: number | null;
  claimedAt: number | null;
}

export interface QuestListResponse {
  daily: Quest[];
  weekly: Quest[];
  season: Quest[];
}

export interface QuestClaimResponse {
  quest: Quest;
  newBalance: ResourceBalance;
}

// Streaks & Visions
export interface DailyStreak {
  currentStreak: number;
  bestStreak: number;
  lastLoginDate: string;  // YYYY-MM-DD
  freezesRemaining: number;
}

export type VisionType = 'buff_herbs' | 'buff_crystals' | 'buff_xp' | 'bonus_resource' | 'scout_hint';

export interface DailyVision {
  id: string;
  type: VisionType;
  title: string;
  description: string;
  drawnAt: number;
  expiresAt: number;
}

// Clans
export type ClanType = 'glut' | 'frost' | 'hain';

// Game Modes
export type GameMode = 'idle' | 'wandel' | 'jagd';
