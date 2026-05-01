import { pgTable, text, timestamp, real, boolean, integer, doublePrecision, bigint, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth.js';
export const playerPositions = pgTable('player_positions', {
    userId: text('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    accuracy: real('accuracy'),
    isActive: boolean('is_active').notNull().default(false),
    lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
});
// DB table stays "safe_zones" — TypeScript name becomes cityStates
export const cityStates = pgTable('safe_zones', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    radius: real('radius').notNull().default(50),
    charge: integer('charge').notNull().default(100),
    maxCharge: integer('max_charge').notNull().default(100),
    upgradeLevel: integer('upgrade_level').notNull().default(0),
    isFallen: boolean('is_fallen').notNull().default(false),
    isApproved: boolean('is_approved').notNull().default(false),
    suggestedBy: text('suggested_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const zoneVisits = pgTable('zone_visits', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    zoneId: text('zone_id')
        .notNull()
        .references(() => cityStates.id, { onDelete: 'cascade' }),
    enteredAt: timestamp('entered_at').notNull().defaultNow(),
    leftAt: timestamp('left_at'),
    durationSeconds: integer('duration_s'),
});
export const playerHealthState = pgTable('player_health_state', {
    userId: text('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    hits: integer('hits').notNull().default(0),
    isDown: boolean('is_down').notNull().default(false),
    downUntil: bigint('down_until', { mode: 'number' }), // unix timestamp ms
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// DB table stays "zombies" — TypeScript name becomes ghouls
export const ghouls = pgTable('zombies', {
    id: text('id').primaryKey(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    gridCell: text('grid_cell').notNull(),
    isAlive: boolean('is_alive').notNull().default(true),
    deadUntil: bigint('dead_until', { mode: 'number' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
    index('zombies_grid_cell_idx').on(table.gridCell),
    index('zombies_lat_lon_idx').on(table.latitude, table.longitude),
    index('zombies_grid_cell_alive_idx').on(table.gridCell, table.isAlive),
]);
export const zoneChargeEvents = pgTable('zone_charge_events', {
    id: text('id').primaryKey(),
    zoneId: text('zone_id')
        .notNull()
        .references(() => cityStates.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(), // 'player_enter', 'player_stay', 'ghoul_drain', 'reconquer', 'tick_damage', 'tick_heal', 'player_heal', 'fallen'
    triggeredBy: text('triggered_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const collectiblePoints = pgTable('collectible_points', {
    id: text('id').primaryKey(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    gridCell: text('grid_cell').notNull(),
    resourceType: text('resource_type').notNull().default('herb'),
    value: integer('value').notNull().default(10),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
    collectedBy: text('collected_by').references(() => users.id),
    collectedAt: timestamp('collected_at'),
}, (table) => [
    index('collectible_points_grid_cell_idx').on(table.gridCell),
    index('collectible_points_lat_lon_idx').on(table.latitude, table.longitude),
    index('collectible_points_expires_at_idx').on(table.expiresAt),
]);
export const playerPoints = pgTable('player_points', {
    userId: text('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    totalPoints: integer('total_points').notNull().default(0),
    lifetimeEarned: integer('lifetime_earned').notNull().default(0),
    lifetimeSpent: integer('lifetime_spent').notNull().default(0),
    herbs: integer('herbs').notNull().default(0),
    crystals: integer('crystals').notNull().default(0),
    relics: integer('relics').notNull().default(0),
    lifetimeHerbs: integer('lifetime_herbs').notNull().default(0),
    lifetimeCrystals: integer('lifetime_crystals').notNull().default(0),
    lifetimeRelics: integer('lifetime_relics').notNull().default(0),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export const bastions = pgTable('bastions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Meine Bastion'),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    level: integer('level').notNull().default(0),
    hp: integer('hp').notNull().default(50),
    maxHp: integer('max_hp').notNull().default(50),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
    uniqueIndex('bastions_user_idx').on(table.userId),
    index('bastions_lat_lon_idx').on(table.latitude, table.longitude),
]);
//# sourceMappingURL=game.js.map