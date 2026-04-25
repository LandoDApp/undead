// Zombie mechanics
export const ZOMBIE_COUNT_MIN = 80;
export const ZOMBIE_COUNT_MAX = 100;
export const ZOMBIE_SPAWN_DISTANCE_MIN = 100; // meters
export const ZOMBIE_SPAWN_DISTANCE_MAX = 600; // meters - wider spread for 100 zombies
export const ZOMBIE_SPEED_DAY = 8; // km/h
export const ZOMBIE_SPEED_NIGHT = 4; // km/h
export const ZOMBIE_DETECTION_DAY = 250; // meters
export const ZOMBIE_DETECTION_NIGHT = 300; // meters
export const ZOMBIE_CAUGHT_DISTANCE = 10; // meters
export const ZOMBIE_RESPAWN_DELAY = 5_000; // ms - faster respawn for large hordes
export const ZOMBIE_ROUTE_COOLDOWN = 5_000; // ms per zombie
export const ZOMBIE_MAX_CONCURRENT_ROUTES = 8; // more concurrent routes for 100 zombies
export const ZOMBIE_ZONE_TARGET_RANGE = 500; // meters - zombies target zones within this range
// Server-side zombie grid (~24 cells in 800m radius, 4 × 24 ≈ 100 zombies)
export const ZOMBIES_PER_CELL = 4;
export const ZOMBIE_RESPAWN_TIME = 120_000; // ms (2 min until dead zombie revives)
export const ZOMBIE_NEARBY_RADIUS = 800; // meters — query radius
export const ZOMBIE_SYNC_INTERVAL = 30_000; // ms — client re-fetch interval
// Player mechanics
export const PLAYER_MAX_HITS = 2;
export const PLAYER_DOWN_DURATION = 10_000; // ms (10s respawn timer)
// Safe Zone mechanics
export const ZONE_ENTER_CHARGE_BONUS = 5;
export const ZONE_STAY_CHARGE_PER_MINUTE = 1;
export const ZONE_ZOMBIE_DRAIN_PER_MINUTE = 1; // per zombie within 100m
export const ZONE_ZOMBIE_DRAIN_RANGE = 100; // meters
export const ZONE_RECONQUER_TIME = 120_000; // ms (2 minutes)
export const ZONE_MAX_CHARGE = 100;
// GPS Polling intervals (ms)
export const GPS_INTERVAL_STILL = 30_000;
export const GPS_INTERVAL_WALKING = 8_000;
export const GPS_INTERVAL_RUNNING = 3_000;
// Motion detection thresholds (accelerometer stdDev)
export const MOTION_THRESHOLD_STILL = 0.3;
export const MOTION_THRESHOLD_WALKING = 1.2;
export const MOTION_SAMPLE_RATE = 50; // ms (20 Hz)
export const MOTION_WINDOW_SIZE = 40; // samples for sliding window
// Session
export const SESSION_RESUME_THRESHOLD = 10 * 60 * 1000; // 10 minutes in ms
// Player visibility
export const PLAYER_NEARBY_RADIUS = 200; // meters for zone presence
// Collectible Points
export const POINT_COLLECT_RADIUS = 15; // meters
export const POINTS_PER_COLLECT = 10;
export const POINT_SPAWN_PER_CELL = 2;
export const POINT_LIFETIME = 600_000; // ms (10 min)
export const POINT_NEARBY_RADIUS = 800; // meters — query radius
export const POINT_SYNC_INTERVAL = 15_000; // ms — client re-fetch interval
// Zone Tick (server-side damage loop)
export const ZONE_TICK_INTERVAL = 10_000; // ms
export const ZONE_DAMAGE_PER_ZOMBIE_PER_TICK = 0.5;
export const ZONE_DAMAGE_RANGE = 100; // meters
export const ZONE_DEFENSE_MULTIPLIERS = [1.0, 0.3, 0.1, 0.0]; // 0/1/2/3+ players
export const ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK = 0.2;
// Zone Healing (points → HP)
export const ZONE_HEAL_POINTS_PER_HP = 5;
// Zone Upgrades
export const ZONE_BASE_RADIUS = 50; // meters
export const ZONE_RADIUS_PER_LEVEL = 15; // meters per upgrade level
export const ZONE_MAX_LEVEL = 5;
export const ZONE_UPGRADE_COSTS = [50, 100, 200, 400, 800]; // points per level
export const ZONE_SHRINK_THRESHOLD = 50; // HP% below which zone radius shrinks
export const ZONE_SHRINK_FACTOR = 0.75;
//# sourceMappingURL=game.js.map