import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { playerHealthState } from '../db/schema/game.js';
import { incrementQuestProgress } from './quests.js';

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Report steps from the pedometer. Adds XP (1 step = 1 XP). Resets daily. */
export async function reportSteps(
  userId: string,
  steps: number
): Promise<{ stepsToday: number; totalXp: number }> {
  const today = getTodayStr();

  // Ensure row exists
  await db
    .insert(playerHealthState)
    .values({ userId, hits: 0, isDown: false })
    .onConflictDoNothing();

  const rows = await db.select().from(playerHealthState).where(eq(playerHealthState.userId, userId));
  const row = rows[0];

  const isNewDay = row.stepsDate !== today;
  const newStepsToday = isNewDay ? steps : row.stepsToday + steps;
  const xpGained = steps; // 1 step = 1 XP
  const newTotalXp = row.totalXp + xpGained;

  await db
    .update(playerHealthState)
    .set({
      stepsToday: newStepsToday,
      stepsDate: today,
      totalXp: newTotalXp,
      updatedAt: new Date(),
    })
    .where(eq(playerHealthState.userId, userId));

  // Quest progress for walking
  await incrementQuestProgress(userId, 'walk', steps);

  return { stepsToday: newStepsToday, totalXp: newTotalXp };
}
