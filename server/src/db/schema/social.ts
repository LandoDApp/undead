import { pgTable, text, timestamp, boolean, integer, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { safeZones } from './game.js';

export const meetups = pgTable('meetups', {
  id: text('id').primaryKey(),
  creatorId: text('creator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  zoneId: text('zone_id')
    .notNull()
    .references(() => safeZones.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const meetupCheckins = pgTable(
  'meetup_checkins',
  {
    meetupId: text('meetup_id')
      .notNull()
      .references(() => meetups.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    notifyBefore: integer('notify_before').notNull().default(30), // minutes
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.meetupId, table.userId] })]
);

export const friends = pgTable(
  'friends',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    friendId: text('friend_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'), // pending, accepted, rejected
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.friendId] })]
);

export const pushTokens = pgTable('push_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  platform: text('platform').notNull(), // 'android' | 'ios'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
