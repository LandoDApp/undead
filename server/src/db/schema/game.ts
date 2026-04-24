import { pgTable, text, timestamp, real, boolean, integer, doublePrecision, bigint, index } from 'drizzle-orm/pg-core';
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

export const safeZones = pgTable('safe_zones', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  radius: real('radius').notNull().default(50),
  charge: integer('charge').notNull().default(100),
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
    .references(() => safeZones.id, { onDelete: 'cascade' }),
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

export const zombies = pgTable('zombies', {
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
    .references(() => safeZones.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),
  reason: text('reason').notNull(), // 'player_enter', 'player_stay', 'zombie_drain', 'reconquer'
  triggeredBy: text('triggered_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
