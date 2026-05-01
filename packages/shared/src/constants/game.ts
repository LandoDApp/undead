// Ghoul mechanics
export const GHOUL_COUNT_MIN = 80;
export const GHOUL_COUNT_MAX = 100;
export const GHOUL_SPAWN_DISTANCE_MIN = 100; // meters
export const GHOUL_SPAWN_DISTANCE_MAX = 600; // meters - wider spread for 100 ghouls
export const GHOUL_SPEED_DAY = 8; // km/h
export const GHOUL_SPEED_NIGHT = 4; // km/h
export const GHOUL_DETECTION_DAY = 250; // meters
export const GHOUL_DETECTION_NIGHT = 300; // meters
export const GHOUL_CAUGHT_DISTANCE = 10; // meters
export const GHOUL_RESPAWN_DELAY = 5_000; // ms - faster respawn for large hordes
export const GHOUL_ROUTE_COOLDOWN = 5_000; // ms per ghoul
export const GHOUL_MAX_CONCURRENT_ROUTES = 8; // more concurrent routes for 100 ghouls
export const GHOUL_ZONE_TARGET_RANGE = 500; // meters - ghouls target zones within this range

// Server-side ghoul grid (~24 cells in 800m radius, 4 × 24 ≈ 100 ghouls)
export const GHOULS_PER_CELL = 4;
export const GHOUL_RESPAWN_TIME = 120_000; // ms (2 min until dead ghoul revives)
export const GHOUL_NEARBY_RADIUS = 800; // meters — query radius
export const GHOUL_SYNC_INTERVAL = 30_000; // ms — client re-fetch interval

// Player mechanics
export const PLAYER_MAX_HITS = 2;
export const PLAYER_DOWN_DURATION = 10_000; // ms (10s respawn timer)

// City-State mechanics (DB table still named safe_zones internally)
export const ZONE_ENTER_CHARGE_BONUS = 5;
export const ZONE_STAY_CHARGE_PER_MINUTE = 1;
export const ZONE_GHOUL_DRAIN_PER_MINUTE = 1; // per ghoul within 100m
export const ZONE_GHOUL_DRAIN_RANGE = 100; // meters
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

// Resources
export const RESOURCE_COLLECT_RADIUS = 25; // meters
export const RESOURCE_NEARBY_RADIUS = 800; // meters — query radius
export const RESOURCE_SYNC_INTERVAL = 15_000; // ms — client re-fetch interval

// Resource spawn rates (per grid cell)
export const RESOURCE_SPAWN_HERB = 3; // common
export const RESOURCE_SPAWN_CRYSTAL = 1; // rare
export const RESOURCE_SPAWN_RELIC = 0; // special/event only
export const RESOURCE_RELIC_CHANCE = 0.1; // 10% chance per tick

// Resource lifetimes (ms)
export const RESOURCE_LIFETIME_HERB = 600_000; // 10 min
export const RESOURCE_LIFETIME_CRYSTAL = 900_000; // 15 min
export const RESOURCE_LIFETIME_RELIC = 300_000; // 5 min (rare but urgent)

// Resource values
export const RESOURCE_VALUE_HERB = 1;
export const RESOURCE_VALUE_CRYSTAL = 1;
export const RESOURCE_VALUE_RELIC = 1;

/** @deprecated Use RESOURCE_COLLECT_RADIUS */
export const POINT_COLLECT_RADIUS = RESOURCE_COLLECT_RADIUS;
/** @deprecated Use RESOURCE_VALUE_HERB */
export const POINTS_PER_COLLECT = 10;
/** @deprecated Use RESOURCE_SPAWN_HERB */
export const POINT_SPAWN_PER_CELL = 2;
/** @deprecated Use RESOURCE_LIFETIME_HERB */
export const POINT_LIFETIME = RESOURCE_LIFETIME_HERB;
/** @deprecated Use RESOURCE_NEARBY_RADIUS */
export const POINT_NEARBY_RADIUS = RESOURCE_NEARBY_RADIUS;
/** @deprecated Use RESOURCE_SYNC_INTERVAL */
export const POINT_SYNC_INTERVAL = RESOURCE_SYNC_INTERVAL;

// Zone Tick (server-side damage loop)
export const ZONE_TICK_INTERVAL = 10_000; // ms
export const ZONE_DAMAGE_PER_GHOUL_PER_TICK = 0.0031; // 5 ghouls → 18h to drain 100 HP
export const ZONE_DAMAGE_RANGE = 100; // meters
export const ZONE_DEFENSE_MULTIPLIERS = [1.0, 0.3, 0.1, 0.0]; // 0/1/2/3+ players
export const ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK = 0.2;

// City-State Healing (herbs → HP)
export const CITY_STATE_HEAL_HERBS_PER_HP = 3;
/** @deprecated Use CITY_STATE_HEAL_HERBS_PER_HP */
export const ZONE_HEAL_POINTS_PER_HP = 5;

// City-State Upgrades (crystals)
export const ZONE_BASE_RADIUS = 50; // meters
export const ZONE_RADIUS_PER_LEVEL = 15; // meters per upgrade level
export const ZONE_MAX_LEVEL = 5;
export const CITY_STATE_UPGRADE_CRYSTAL_COSTS = [5, 10, 20, 40, 80]; // crystals per level
/** @deprecated Use CITY_STATE_UPGRADE_CRYSTAL_COSTS */
export const ZONE_UPGRADE_COSTS = [50, 100, 200, 400, 800]; // points per level (legacy)
export const ZONE_SHRINK_THRESHOLD = 50; // HP% below which zone radius shrinks
export const ZONE_SHRINK_FACTOR = 0.75;

// Bastion mechanics
export const BASTION_MAX_HP = [50, 100, 200] as const; // per level (0, 1, 2)
export const BASTION_UPGRADE_CRYSTAL_COSTS = [0, 15, 50] as const; // crystals to reach level 0→1, 1→2
export const BASTION_GHOUL_DRAIN_PER_HOUR = 2; // HP lost per hour when owner is offline
export const BASTION_HEAL_HERB_COST = 2; // herbs per HP healed
export const BASTION_REINFORCE_BONUS = 10; // HP bonus when a friend reinforces
export const BASTION_NEARBY_RADIUS = 800; // meters — query radius for nearby bastions
export const BASTION_SYNC_INTERVAL = 30_000; // ms — client re-fetch interval

// Bastion Idle System
export const WORKER_HERB_RATE = 3;        // herbs/hour at level 0
export const WORKER_CRYSTAL_RATE = 1;     // crystals/hour at level 0
export const WORKER_SCHOLAR_XP_RATE = 5;  // XP/hour at level 0 (future)
export const WORKER_SCOUT_RATE = 1;       // reports/hour at level 0
export const WORKER_LEVEL_MULTIPLIER = 1.5; // rate × this per level
export const WORKER_UPGRADE_CRYSTAL_COSTS = [0, 5, 15] as const; // crystals to reach level 0→1, 1→2

export const BASTION_STORAGE_HERBS = [30, 60, 120] as const;
export const BASTION_STORAGE_CRYSTALS = [10, 20, 40] as const;
export const BASTION_STORAGE_RELICS = [5, 10, 20] as const;
export const BASTION_STORAGE_SCOUTS = [3, 6, 12] as const;
export const BASTION_WORKER_SLOTS = [2, 3, 4] as const;
export const BASTION_MAX_OFFLINE_HOURS = 8;

// Quest System
export const QUEST_DAILY_COUNT = 3;
export const QUEST_WEEKLY_COUNT = 3;
export const QUEST_DAILY_RESET_HOUR = 4;  // 04:00
export const QUEST_WEEKLY_RESET_DAY = 1;  // Monday

// Streak System
export const STREAK_BONUS_3 = { herbs: 5 } as const;
export const STREAK_BONUS_7 = { crystals: 3 } as const;
export const STREAK_BONUS_30 = { relics: 1 } as const;
export const STREAK_FREEZES_PER_MONTH = 1;
export const VISION_BUFF_DURATION = 86_400_000;  // 24h in ms
