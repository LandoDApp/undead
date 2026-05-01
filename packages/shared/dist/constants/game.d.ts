export declare const GHOUL_COUNT_MIN = 80;
export declare const GHOUL_COUNT_MAX = 100;
export declare const GHOUL_SPAWN_DISTANCE_MIN = 100;
export declare const GHOUL_SPAWN_DISTANCE_MAX = 600;
export declare const GHOUL_SPEED_DAY = 8;
export declare const GHOUL_SPEED_NIGHT = 4;
export declare const GHOUL_DETECTION_DAY = 250;
export declare const GHOUL_DETECTION_NIGHT = 300;
export declare const GHOUL_CAUGHT_DISTANCE = 10;
export declare const GHOUL_RESPAWN_DELAY = 5000;
export declare const GHOUL_ROUTE_COOLDOWN = 5000;
export declare const GHOUL_MAX_CONCURRENT_ROUTES = 8;
export declare const GHOUL_ZONE_TARGET_RANGE = 500;
export declare const GHOULS_PER_CELL = 4;
export declare const GHOUL_RESPAWN_TIME = 120000;
export declare const GHOUL_NEARBY_RADIUS = 800;
export declare const GHOUL_SYNC_INTERVAL = 30000;
export declare const PLAYER_MAX_HITS = 2;
export declare const PLAYER_DOWN_DURATION = 10000;
export declare const ZONE_ENTER_CHARGE_BONUS = 5;
export declare const ZONE_STAY_CHARGE_PER_MINUTE = 1;
export declare const ZONE_GHOUL_DRAIN_PER_MINUTE = 1;
export declare const ZONE_GHOUL_DRAIN_RANGE = 100;
export declare const ZONE_RECONQUER_TIME = 120000;
export declare const ZONE_MAX_CHARGE = 100;
export declare const GPS_INTERVAL_STILL = 30000;
export declare const GPS_INTERVAL_WALKING = 8000;
export declare const GPS_INTERVAL_RUNNING = 3000;
export declare const MOTION_THRESHOLD_STILL = 0.3;
export declare const MOTION_THRESHOLD_WALKING = 1.2;
export declare const MOTION_SAMPLE_RATE = 50;
export declare const MOTION_WINDOW_SIZE = 40;
export declare const SESSION_RESUME_THRESHOLD: number;
export declare const PLAYER_NEARBY_RADIUS = 200;
export declare const RESOURCE_COLLECT_RADIUS = 25;
export declare const RESOURCE_NEARBY_RADIUS = 800;
export declare const RESOURCE_SYNC_INTERVAL = 15000;
export declare const RESOURCE_SPAWN_HERB = 3;
export declare const RESOURCE_SPAWN_CRYSTAL = 1;
export declare const RESOURCE_SPAWN_RELIC = 0;
export declare const RESOURCE_RELIC_CHANCE = 0.1;
export declare const RESOURCE_LIFETIME_HERB = 600000;
export declare const RESOURCE_LIFETIME_CRYSTAL = 900000;
export declare const RESOURCE_LIFETIME_RELIC = 300000;
export declare const RESOURCE_VALUE_HERB = 1;
export declare const RESOURCE_VALUE_CRYSTAL = 1;
export declare const RESOURCE_VALUE_RELIC = 1;
/** @deprecated Use RESOURCE_COLLECT_RADIUS */
export declare const POINT_COLLECT_RADIUS = 25;
/** @deprecated Use RESOURCE_VALUE_HERB */
export declare const POINTS_PER_COLLECT = 10;
/** @deprecated Use RESOURCE_SPAWN_HERB */
export declare const POINT_SPAWN_PER_CELL = 2;
/** @deprecated Use RESOURCE_LIFETIME_HERB */
export declare const POINT_LIFETIME = 600000;
/** @deprecated Use RESOURCE_NEARBY_RADIUS */
export declare const POINT_NEARBY_RADIUS = 800;
/** @deprecated Use RESOURCE_SYNC_INTERVAL */
export declare const POINT_SYNC_INTERVAL = 15000;
export declare const ZONE_TICK_INTERVAL = 10000;
export declare const ZONE_DAMAGE_PER_GHOUL_PER_TICK = 0.0031;
export declare const ZONE_DAMAGE_RANGE = 100;
export declare const ZONE_DEFENSE_MULTIPLIERS: number[];
export declare const ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK = 0.2;
export declare const CITY_STATE_HEAL_HERBS_PER_HP = 3;
/** @deprecated Use CITY_STATE_HEAL_HERBS_PER_HP */
export declare const ZONE_HEAL_POINTS_PER_HP = 5;
export declare const ZONE_BASE_RADIUS = 50;
export declare const ZONE_RADIUS_PER_LEVEL = 15;
export declare const ZONE_MAX_LEVEL = 5;
export declare const CITY_STATE_UPGRADE_CRYSTAL_COSTS: number[];
/** @deprecated Use CITY_STATE_UPGRADE_CRYSTAL_COSTS */
export declare const ZONE_UPGRADE_COSTS: number[];
export declare const ZONE_SHRINK_THRESHOLD = 50;
export declare const ZONE_SHRINK_FACTOR = 0.75;
export declare const BASTION_MAX_HP: readonly [50, 100, 200];
export declare const BASTION_UPGRADE_CRYSTAL_COSTS: readonly [0, 15, 50];
export declare const BASTION_GHOUL_DRAIN_PER_HOUR = 2;
export declare const BASTION_HEAL_HERB_COST = 2;
export declare const BASTION_REINFORCE_BONUS = 10;
export declare const BASTION_NEARBY_RADIUS = 800;
export declare const BASTION_SYNC_INTERVAL = 30000;
export declare const WORKER_HERB_RATE = 3;
export declare const WORKER_CRYSTAL_RATE = 1;
export declare const WORKER_SCHOLAR_XP_RATE = 5;
export declare const WORKER_SCOUT_RATE = 1;
export declare const WORKER_LEVEL_MULTIPLIER = 1.5;
export declare const WORKER_UPGRADE_CRYSTAL_COSTS: readonly [0, 5, 15];
export declare const BASTION_STORAGE_HERBS: readonly [30, 60, 120];
export declare const BASTION_STORAGE_CRYSTALS: readonly [10, 20, 40];
export declare const BASTION_STORAGE_RELICS: readonly [5, 10, 20];
export declare const BASTION_STORAGE_SCOUTS: readonly [3, 6, 12];
export declare const BASTION_WORKER_SLOTS: readonly [2, 3, 4];
export declare const BASTION_MAX_OFFLINE_HOURS = 8;
export declare const QUEST_DAILY_COUNT = 3;
export declare const QUEST_WEEKLY_COUNT = 3;
export declare const QUEST_DAILY_RESET_HOUR = 4;
export declare const QUEST_WEEKLY_RESET_DAY = 1;
export declare const STREAK_BONUS_3: {
    readonly herbs: 5;
};
export declare const STREAK_BONUS_7: {
    readonly crystals: 3;
};
export declare const STREAK_BONUS_30: {
    readonly relics: 1;
};
export declare const STREAK_FREEZES_PER_MONTH = 1;
export declare const VISION_BUFF_DURATION = 86400000;
//# sourceMappingURL=game.d.ts.map