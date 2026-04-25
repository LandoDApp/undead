export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface ZombieSpawnPoint {
  id: string;
  position: Coordinate;
  spawnedAt: number;
}

export interface ZombieSpawnRequest {
  latitude: number;
  longitude: number;
  count?: number;
}

export interface ZombieSpawnResponse {
  spawns: ZombieSpawnPoint[];
}

export interface ZombieRouteRequest {
  zombieLat: number;
  zombieLon: number;
  playerLat: number;
  playerLon: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface ZombieRouteResponse {
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

export interface ZombieState {
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

export interface ZombieCatchRequest {
  zombieId: string;
  zombieLat: number;
  zombieLon: number;
  playerLat: number;
  playerLon: number;
}

export interface ZombieCatchResponse {
  hit: boolean;
  totalHits: number;
  isDown: boolean;
  downUntil: number | null;
  zombieKilled: boolean;
}

export interface ServerZombie {
  id: string;
  latitude: number;
  longitude: number;
  gridCell: string;
  isAlive: boolean;
  deadUntil: number | null;
}

export interface ZombieNearbyResponse {
  zombies: ServerZombie[];
}

export interface PlayerHealthState {
  hits: number;
  maxHits: number;
  isDown: boolean;
  downUntil: number | null;
}

// Collectible Points
export interface CollectiblePoint {
  id: string;
  latitude: number;
  longitude: number;
  value: number;
  expiresAt: number;
}

export interface CollectiblePointsNearbyResponse {
  points: CollectiblePoint[];
}

export interface CollectPointResponse {
  collected: boolean;
  pointsEarned: number;
  newBalance: number;
}

export interface PlayerPointsBalance {
  totalPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

// Zone Healing & Upgrades
export interface ZoneHealRequest {
  amount: number;
}

export interface ZoneHealResponse {
  newCharge: number;
  pointsSpent: number;
  newBalance: number;
}

export interface ZoneUpgradeResponse {
  newLevel: number;
  newRadius: number;
  pointsSpent: number;
  newBalance: number;
}
