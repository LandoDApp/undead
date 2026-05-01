import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { playerPoints } from '../db/schema/game.js';
import { addPlayerResource } from './resources.js';
import {
  STREAK_BONUS_3,
  STREAK_BONUS_7,
  STREAK_BONUS_30,
  STREAK_FREEZES_PER_MONTH,
} from '@undead/shared';
import type { DailyStreak } from '@undead/shared';

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Check and update the player's daily streak. Called on every login/collect. */
export async function checkAndUpdateStreak(userId: string): Promise<DailyStreak> {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  // Ensure player_points row exists
  await db
    .insert(playerPoints)
    .values({ userId, totalPoints: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
    .onConflictDoNothing();

  const rows = await db.select().from(playerPoints).where(eq(playerPoints.userId, userId));
  const row = rows[0];

  if (row.lastLoginDate === today) {
    // Already checked in today
    return {
      currentStreak: row.currentStreak,
      bestStreak: row.bestStreak,
      lastLoginDate: today,
      freezesRemaining: row.streakFreezes,
    };
  }

  let newStreak = row.currentStreak;

  if (row.lastLoginDate === yesterday) {
    // Consecutive day — increment
    newStreak = row.currentStreak + 1;
  } else if (row.lastLoginDate && row.lastLoginDate !== today) {
    // Missed a day — reset (freeze handled separately)
    newStreak = 1;
  } else {
    // First login ever
    newStreak = 1;
  }

  const newBest = Math.max(newStreak, row.bestStreak);

  await db
    .update(playerPoints)
    .set({
      currentStreak: newStreak,
      bestStreak: newBest,
      lastLoginDate: today,
      updatedAt: new Date(),
    })
    .where(eq(playerPoints.userId, userId));

  // Award streak bonuses
  if (newStreak === 3) {
    await addPlayerResource(userId, 'herb', STREAK_BONUS_3.herbs);
  } else if (newStreak === 7) {
    await addPlayerResource(userId, 'crystal', STREAK_BONUS_7.crystals);
  } else if (newStreak === 30) {
    await addPlayerResource(userId, 'relic', STREAK_BONUS_30.relics);
  }

  return {
    currentStreak: newStreak,
    bestStreak: newBest,
    lastLoginDate: today,
    freezesRemaining: row.streakFreezes,
  };
}

/** Use a streak freeze to prevent reset */
export async function useStreakFreeze(userId: string): Promise<DailyStreak> {
  const rows = await db.select().from(playerPoints).where(eq(playerPoints.userId, userId));
  if (rows.length === 0) throw new Error('Player not found');

  const row = rows[0];
  if (row.streakFreezes <= 0) throw new Error('No freezes remaining');

  await db
    .update(playerPoints)
    .set({
      streakFreezes: row.streakFreezes - 1,
      updatedAt: new Date(),
    })
    .where(eq(playerPoints.userId, userId));

  return {
    currentStreak: row.currentStreak,
    bestStreak: row.bestStreak,
    lastLoginDate: row.lastLoginDate ?? '',
    freezesRemaining: row.streakFreezes - 1,
  };
}

/** Get current streak data */
export async function getStreak(userId: string): Promise<DailyStreak> {
  const rows = await db.select().from(playerPoints).where(eq(playerPoints.userId, userId));
  if (rows.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastLoginDate: '', freezesRemaining: STREAK_FREEZES_PER_MONTH };
  }

  const row = rows[0];
  return {
    currentStreak: row.currentStreak,
    bestStreak: row.bestStreak,
    lastLoginDate: row.lastLoginDate ?? '',
    freezesRemaining: row.streakFreezes,
  };
}
