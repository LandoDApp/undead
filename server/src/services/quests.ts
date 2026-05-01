import { randomUUID } from 'crypto';
import { eq, and, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { quests } from '../db/schema/game.js';
import { addPlayerResource, getPlayerResourceBalance } from './resources.js';
import {
  QUEST_DAILY_COUNT,
  QUEST_WEEKLY_COUNT,
  QUEST_DAILY_RESET_HOUR,
  QUEST_WEEKLY_RESET_DAY,
} from '@undead/shared';
import type { Quest, QuestType, QuestCategory, ResourceType } from '@undead/shared';

// ---- Quest Templates ----

interface QuestTemplate {
  category: QuestCategory;
  title: string;
  description: string;
  targetValue: number;
  rewardType: ResourceType | 'xp';
  rewardAmount: number;
}

const DAILY_TEMPLATES: QuestTemplate[] = [
  { category: 'collect', title: 'Sammler', description: 'Sammle 5 Ressourcen', targetValue: 5, rewardType: 'herb', rewardAmount: 3 },
  { category: 'collect', title: 'Fleißiger Sammler', description: 'Sammle 10 Ressourcen', targetValue: 10, rewardType: 'herb', rewardAmount: 5 },
  { category: 'defeat', title: 'Ghoulbezwinger', description: 'Besiege 3 Ghoule', targetValue: 3, rewardType: 'crystal', rewardAmount: 1 },
  { category: 'defeat', title: 'Ghouljäger', description: 'Besiege 5 Ghoule', targetValue: 5, rewardType: 'crystal', rewardAmount: 2 },
  { category: 'visit', title: 'Besucher', description: 'Besuche einen Stadtstaat', targetValue: 1, rewardType: 'herb', rewardAmount: 2 },
  { category: 'heal', title: 'Heiler', description: 'Heile 10 HP', targetValue: 10, rewardType: 'herb', rewardAmount: 3 },
  { category: 'walk', title: 'Wanderer', description: 'Gehe 1000 Schritte', targetValue: 1000, rewardType: 'herb', rewardAmount: 4 },
  { category: 'walk', title: 'Spaziergänger', description: 'Gehe 500 Schritte', targetValue: 500, rewardType: 'herb', rewardAmount: 2 },
];

const WEEKLY_TEMPLATES: QuestTemplate[] = [
  { category: 'collect', title: 'Großer Sammler', description: 'Sammle 50 Ressourcen', targetValue: 50, rewardType: 'crystal', rewardAmount: 5 },
  { category: 'defeat', title: 'Ghoulvernichter', description: 'Besiege 20 Ghoule', targetValue: 20, rewardType: 'crystal', rewardAmount: 5 },
  { category: 'visit', title: 'Weltreisender', description: 'Besuche 5 Stadtstaaten', targetValue: 5, rewardType: 'crystal', rewardAmount: 3 },
  { category: 'heal', title: 'Großheiler', description: 'Heile 50 HP', targetValue: 50, rewardType: 'crystal', rewardAmount: 3 },
  { category: 'walk', title: 'Marathonläufer', description: 'Gehe 10.000 Schritte', targetValue: 10000, rewardType: 'crystal', rewardAmount: 5 },
  { category: 'upgrade', title: 'Baumeister', description: 'Führe 2 Upgrades durch', targetValue: 2, rewardType: 'crystal', rewardAmount: 3 },
];

// ---- Helpers ----

function toQuest(row: typeof quests.$inferSelect): Quest {
  return {
    id: row.id,
    type: row.questType as QuestType,
    category: row.category as QuestCategory,
    title: row.title,
    description: row.description,
    targetValue: row.targetValue,
    currentValue: row.currentValue,
    rewardType: row.rewardType as ResourceType | 'xp',
    rewardAmount: row.rewardAmount,
    expiresAt: row.expiresAt,
    completedAt: row.completedAt?.getTime() ?? null,
    claimedAt: row.claimedAt?.getTime() ?? null,
  };
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getDailyExpiry(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(QUEST_DAILY_RESET_HOUR, 0, 0, 0);
  if (tomorrow.getTime() - now.getTime() < 3600_000) {
    // Less than 1h left — push to next day
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  return tomorrow.getTime();
}

function getWeeklyExpiry(): number {
  const now = new Date();
  const daysUntilMonday = ((QUEST_WEEKLY_RESET_DAY - now.getDay()) + 7) % 7 || 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + daysUntilMonday);
  monday.setHours(QUEST_DAILY_RESET_HOUR, 0, 0, 0);
  return monday.getTime();
}

// ---- Public API ----

/** Generate daily quests for a user if none exist for today */
async function generateDailyQuests(userId: string): Promise<Quest[]> {
  const templates = pickRandom(DAILY_TEMPLATES, QUEST_DAILY_COUNT);
  const expiresAt = getDailyExpiry();
  const rows = templates.map((t) => ({
    id: randomUUID(),
    userId,
    questType: 'daily' as const,
    category: t.category,
    title: t.title,
    description: t.description,
    targetValue: t.targetValue,
    currentValue: 0,
    rewardType: t.rewardType,
    rewardAmount: t.rewardAmount,
    expiresAt,
  }));

  await db.insert(quests).values(rows);
  return rows.map((r) => ({
    ...r,
    type: r.questType as QuestType,
    category: r.category as QuestCategory,
    rewardType: r.rewardType as ResourceType | 'xp',
    completedAt: null,
    claimedAt: null,
  }));
}

/** Generate weekly quests for a user if none exist */
async function generateWeeklyQuests(userId: string): Promise<Quest[]> {
  const templates = pickRandom(WEEKLY_TEMPLATES, QUEST_WEEKLY_COUNT);
  const expiresAt = getWeeklyExpiry();
  const rows = templates.map((t) => ({
    id: randomUUID(),
    userId,
    questType: 'weekly' as const,
    category: t.category,
    title: t.title,
    description: t.description,
    targetValue: t.targetValue,
    currentValue: 0,
    rewardType: t.rewardType,
    rewardAmount: t.rewardAmount,
    expiresAt,
  }));

  await db.insert(quests).values(rows);
  return rows.map((r) => ({
    ...r,
    type: r.questType as QuestType,
    category: r.category as QuestCategory,
    rewardType: r.rewardType as ResourceType | 'xp',
    completedAt: null,
    claimedAt: null,
  }));
}

/** Get all active quests for a player. Auto-generates daily/weekly if missing. */
export async function getPlayerQuests(userId: string): Promise<{ daily: Quest[]; weekly: Quest[]; season: Quest[] }> {
  const now = Date.now();

  // Delete expired quests
  await db.delete(quests).where(
    and(
      eq(quests.userId, userId),
      lte(quests.expiresAt, now),
      isNull(quests.claimedAt)
    )
  );

  // Fetch active quests
  const rows = await db
    .select()
    .from(quests)
    .where(eq(quests.userId, userId));

  let daily = rows.filter((r) => r.questType === 'daily').map(toQuest);
  let weekly = rows.filter((r) => r.questType === 'weekly').map(toQuest);
  const season = rows.filter((r) => r.questType === 'season').map(toQuest);

  // Generate if missing
  if (daily.length === 0) {
    daily = await generateDailyQuests(userId);
  }
  if (weekly.length === 0) {
    weekly = await generateWeeklyQuests(userId);
  }

  return { daily, weekly, season };
}

/** Increment quest progress for a given category */
export async function incrementQuestProgress(
  userId: string,
  category: QuestCategory,
  amount: number
): Promise<void> {
  const now = Date.now();

  // Get active unclaimed quests matching the category
  const matching = await db
    .select()
    .from(quests)
    .where(
      and(
        eq(quests.userId, userId),
        eq(quests.category, category),
        isNull(quests.claimedAt)
      )
    );

  for (const quest of matching) {
    if (quest.expiresAt <= now) continue; // skip expired
    if (quest.completedAt) continue; // already completed

    const newValue = Math.min(quest.currentValue + amount, quest.targetValue);
    const isComplete = newValue >= quest.targetValue;

    await db
      .update(quests)
      .set({
        currentValue: newValue,
        ...(isComplete ? { completedAt: new Date() } : {}),
      })
      .where(eq(quests.id, quest.id));
  }
}

/** Claim a completed quest reward */
export async function claimQuestReward(
  userId: string,
  questId: string
): Promise<{ quest: Quest; newBalance: { herbs: number; crystals: number; relics: number; lifetimeHerbs: number; lifetimeCrystals: number; lifetimeRelics: number } }> {
  const rows = await db.select().from(quests).where(eq(quests.id, questId));
  if (rows.length === 0) throw new Error('Quest not found');

  const quest = rows[0];
  if (quest.userId !== userId) throw new Error('Not your quest');
  if (!quest.completedAt) throw new Error('Quest not completed');
  if (quest.claimedAt) throw new Error('Quest already claimed');

  // Mark claimed
  await db
    .update(quests)
    .set({ claimedAt: new Date() })
    .where(eq(quests.id, questId));

  // Credit reward
  let newBalance;
  if (quest.rewardType === 'xp') {
    // XP not yet implemented — give herbs as fallback
    newBalance = await addPlayerResource(userId, 'herb', quest.rewardAmount);
  } else {
    newBalance = await addPlayerResource(userId, quest.rewardType as ResourceType, quest.rewardAmount);
  }

  return {
    quest: toQuest({ ...quest, claimedAt: new Date() }),
    newBalance,
  };
}
