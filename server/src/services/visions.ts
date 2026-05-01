import { randomUUID } from 'crypto';
import { eq, and, gte } from 'drizzle-orm';
import { db } from '../config/database.js';
import { dailyVisions } from '../db/schema/game.js';
import type { DailyVision, VisionType } from '@undead/shared';

interface VisionTemplate {
  type: VisionType;
  title: string;
  description: string;
}

const VISION_POOL: VisionTemplate[] = [
  { type: 'buff_herbs', title: 'Segen der Erde', description: 'Kräuterertrag +50% für heute' },
  { type: 'buff_crystals', title: 'Kristallvision', description: 'Kristallertrag +50% für heute' },
  { type: 'buff_xp', title: 'Weisheit der Ahnen', description: 'XP-Gewinn +50% für heute' },
  { type: 'bonus_resource', title: 'Geschenk der Natur', description: 'Bonus-Ressource bei jeder 5. Sammlung' },
  { type: 'scout_hint', title: 'Späherbericht', description: 'Seltene Ressourcen in der Nähe markiert' },
];

function toVision(row: typeof dailyVisions.$inferSelect): DailyVision {
  return {
    id: row.id,
    type: row.visionType as VisionType,
    title: row.title,
    description: row.description,
    drawnAt: row.drawnAt.getTime(),
    expiresAt: row.expiresAt.getTime(),
  };
}

function getEndOfDay(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Draw today's vision — returns existing one if already drawn today */
export async function drawDailyVision(userId: string): Promise<DailyVision> {
  // Check if already drawn today
  const existing = await getActiveVision(userId);
  if (existing) return existing;

  // Pick random vision
  const template = VISION_POOL[Math.floor(Math.random() * VISION_POOL.length)];
  const expiresAt = getEndOfDay();

  const row = {
    id: randomUUID(),
    userId,
    visionType: template.type,
    title: template.title,
    description: template.description,
    expiresAt,
  };

  await db.insert(dailyVisions).values(row);

  return {
    id: row.id,
    type: template.type,
    title: template.title,
    description: template.description,
    drawnAt: Date.now(),
    expiresAt: expiresAt.getTime(),
  };
}

/** Get today's active vision (if any) */
export async function getActiveVision(userId: string): Promise<DailyVision | null> {
  const now = new Date();

  const rows = await db
    .select()
    .from(dailyVisions)
    .where(
      and(
        eq(dailyVisions.userId, userId),
        gte(dailyVisions.expiresAt, now)
      )
    );

  if (rows.length === 0) return null;
  return toVision(rows[0]);
}
