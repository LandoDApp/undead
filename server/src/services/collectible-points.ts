import { randomUUID } from 'crypto';
import { eq, and, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { collectiblePoints, playerPoints, zombies } from '../db/schema/game.js';
import { gridCell, getCellsInRadius } from './grid-utils.js';
import { locateOnNetwork } from './valhalla.js';
import {
  POINT_SPAWN_PER_CELL,
  POINT_LIFETIME,
  POINTS_PER_COLLECT,
  POINT_COLLECT_RADIUS,
} from '@undead/shared';
import { pointAtDistance, distanceMeters } from '@undead/shared';
import type { Coordinate, CollectiblePoint } from '@undead/shared';

/** Delete expired and collected points, then fill underpopulated cells near zombies */
export async function getOrCreatePointsInArea(
  center: Coordinate,
  radiusM: number
): Promise<CollectiblePoint[]> {
  const cells = getCellsInRadius(center, radiusM);
  if (cells.length === 0) return [];

  const now = Date.now();

  // Delete expired uncollected points
  await db
    .delete(collectiblePoints)
    .where(
      and(
        inArray(collectiblePoints.gridCell, cells),
        isNull(collectiblePoints.collectedBy),
        lte(collectiblePoints.expiresAt, now)
      )
    );

  // Count uncollected points per cell
  const counts = await db
    .select({
      gridCell: collectiblePoints.gridCell,
      count: sql<number>`count(*)::int`,
    })
    .from(collectiblePoints)
    .where(
      and(
        inArray(collectiblePoints.gridCell, cells),
        isNull(collectiblePoints.collectedBy)
      )
    )
    .groupBy(collectiblePoints.gridCell);

  const countMap = new Map(counts.map((c) => [c.gridCell, c.count]));

  // Find cells that need more points — only spawn near zombie positions
  const cellsNeedingPoints = cells.filter(
    (cell) => (countMap.get(cell) ?? 0) < POINT_SPAWN_PER_CELL
  );

  if (cellsNeedingPoints.length > 0) {
    // Get zombie positions in these cells to spawn points near them
    const zombieRows = await db
      .select({ latitude: zombies.latitude, longitude: zombies.longitude, gridCell: zombies.gridCell })
      .from(zombies)
      .where(
        and(
          inArray(zombies.gridCell, cellsNeedingPoints),
          eq(zombies.isAlive, true)
        )
      );

    // Group zombies by cell
    const zombiesByCell = new Map<string, { latitude: number; longitude: number }[]>();
    for (const z of zombieRows) {
      const list = zombiesByCell.get(z.gridCell) ?? [];
      list.push({ latitude: z.latitude, longitude: z.longitude });
      zombiesByCell.set(z.gridCell, list);
    }

    const spawnPromises: Promise<(typeof collectiblePoints.$inferInsert)>[] = [];

    for (const cell of cellsNeedingPoints) {
      const existing = countMap.get(cell) ?? 0;
      const needed = POINT_SPAWN_PER_CELL - existing;
      if (needed <= 0) continue;

      const cellZombies = zombiesByCell.get(cell);
      if (!cellZombies || cellZombies.length === 0) continue; // No zombies = no points

      for (let i = 0; i < needed; i++) {
        // Pick a random zombie in this cell and spawn point near it
        const zombie = cellZombies[Math.floor(Math.random() * cellZombies.length)];
        const distance = 10 + Math.random() * 40; // 10-50m from zombie
        const bearing = Math.random() * 360;
        const point = pointAtDistance(zombie, distance, bearing);

        spawnPromises.push(
          locateOnNetwork(point).then((snapped) => ({
            id: randomUUID(),
            latitude: (snapped ?? point).latitude,
            longitude: (snapped ?? point).longitude,
            gridCell: cell,
            value: POINTS_PER_COLLECT,
            expiresAt: now + POINT_LIFETIME,
          }))
        );
      }
    }

    if (spawnPromises.length > 0) {
      const toInsert = await Promise.all(spawnPromises);
      await db.insert(collectiblePoints).values(toInsert);
    }
  }

  // Return all uncollected points in area
  const rows = await db
    .select()
    .from(collectiblePoints)
    .where(
      and(
        inArray(collectiblePoints.gridCell, cells),
        isNull(collectiblePoints.collectedBy)
      )
    );

  return rows.map((row) => ({
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    value: row.value,
    expiresAt: row.expiresAt,
  }));
}

/** Collect a point — validate distance, mark collected, credit balance */
export async function collectPoint(
  userId: string,
  pointId: string,
  playerLat: number,
  playerLon: number
): Promise<{ collected: boolean; pointsEarned: number; newBalance: number }> {
  // Find uncollected point
  const rows = await db
    .select()
    .from(collectiblePoints)
    .where(
      and(
        eq(collectiblePoints.id, pointId),
        isNull(collectiblePoints.collectedBy)
      )
    );

  const point = rows[0];
  if (!point) return { collected: false, pointsEarned: 0, newBalance: 0 };

  // Check expired
  if (point.expiresAt < Date.now()) return { collected: false, pointsEarned: 0, newBalance: 0 };

  // Check distance
  const dist = distanceMeters(
    { latitude: playerLat, longitude: playerLon },
    { latitude: point.latitude, longitude: point.longitude }
  );
  if (dist > POINT_COLLECT_RADIUS) return { collected: false, pointsEarned: 0, newBalance: 0 };

  // Mark collected
  await db
    .update(collectiblePoints)
    .set({ collectedBy: userId, collectedAt: new Date() })
    .where(eq(collectiblePoints.id, pointId));

  // Credit balance
  const newBalance = await addPlayerPoints(userId, point.value);
  return { collected: true, pointsEarned: point.value, newBalance };
}

/** Get player point balance */
export async function getPlayerBalance(userId: string) {
  const rows = await db
    .select()
    .from(playerPoints)
    .where(eq(playerPoints.userId, userId));

  if (rows.length === 0) {
    return { totalPoints: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
  }

  return {
    totalPoints: rows[0].totalPoints,
    lifetimeEarned: rows[0].lifetimeEarned,
    lifetimeSpent: rows[0].lifetimeSpent,
  };
}

/** Add points to player balance (upsert) */
export async function addPlayerPoints(userId: string, amount: number): Promise<number> {
  const result = await db
    .insert(playerPoints)
    .values({
      userId,
      totalPoints: amount,
      lifetimeEarned: amount,
      lifetimeSpent: 0,
    })
    .onConflictDoUpdate({
      target: playerPoints.userId,
      set: {
        totalPoints: sql`${playerPoints.totalPoints} + ${amount}`,
        lifetimeEarned: sql`${playerPoints.lifetimeEarned} + ${amount}`,
        updatedAt: new Date(),
      },
    })
    .returning({ totalPoints: playerPoints.totalPoints });

  return result[0].totalPoints;
}

/** Spend points — returns new balance or null if insufficient */
export async function spendPlayerPoints(userId: string, amount: number): Promise<number | null> {
  const balance = await getPlayerBalance(userId);
  if (balance.totalPoints < amount) return null;

  const result = await db
    .update(playerPoints)
    .set({
      totalPoints: sql`${playerPoints.totalPoints} - ${amount}`,
      lifetimeSpent: sql`${playerPoints.lifetimeSpent} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(playerPoints.userId, userId))
    .returning({ totalPoints: playerPoints.totalPoints });

  return result[0]?.totalPoints ?? null;
}
