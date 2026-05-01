import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { playerPoints } from '../db/schema/game.js';
import type { ClanType } from '@undead/shared';

export async function getClan(userId: string): Promise<ClanType | null> {
  const row = await db.query.playerPoints.findFirst({
    where: eq(playerPoints.userId, userId),
    columns: { clan: true },
  });
  return (row?.clan as ClanType | null) ?? null;
}

export async function setClan(userId: string, clan: ClanType): Promise<void> {
  await db
    .insert(playerPoints)
    .values({ userId, clan })
    .onConflictDoUpdate({
      target: playerPoints.userId,
      set: { clan },
    });
}
