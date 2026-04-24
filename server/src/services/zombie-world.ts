import { randomUUID } from 'crypto';
import { eq, and, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { zombies } from '../db/schema/game.js';
import { locateOnNetwork } from './valhalla.js';
import {
  ZOMBIES_PER_CELL,
  ZOMBIE_RESPAWN_TIME,
  ZOMBIE_SPAWN_DISTANCE_MIN,
  ZOMBIE_SPAWN_DISTANCE_MAX,
} from '@undead/shared';
import { pointAtDistance } from '@undead/shared';
import type { Coordinate, ServerZombie } from '@undead/shared';

const EARTH_RADIUS_M = 6_371_000;

/** Compute grid cell key for a coordinate (~500m cells) */
export function gridCell(lat: number, lon: number): string {
  return `${Math.floor(lat * 200)}:${Math.floor(lon * 200)}`;
}

/** Get all grid cells within a bounding box around center */
function getCellsInRadius(center: Coordinate, radiusM: number): string[] {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLon = dLat / Math.cos((center.latitude * Math.PI) / 180);

  const minLat = center.latitude - dLat;
  const maxLat = center.latitude + dLat;
  const minLon = center.longitude - dLon;
  const maxLon = center.longitude + dLon;

  const cells: string[] = [];
  const minCellLat = Math.floor(minLat * 200);
  const maxCellLat = Math.floor(maxLat * 200);
  const minCellLon = Math.floor(minLon * 200);
  const maxCellLon = Math.floor(maxLon * 200);

  for (let cLat = minCellLat; cLat <= maxCellLat; cLat++) {
    for (let cLon = minCellLon; cLon <= maxCellLon; cLon++) {
      cells.push(`${cLat}:${cLon}`);
    }
  }

  return cells;
}

/** Revive zombies whose dead_until timer has expired */
async function reviveExpiredZombies(cells: string[]): Promise<void> {
  if (cells.length === 0) return;

  await db
    .update(zombies)
    .set({ isAlive: true, deadUntil: null })
    .where(
      and(
        inArray(zombies.gridCell, cells),
        eq(zombies.isAlive, false),
        lte(zombies.deadUntil, Date.now())
      )
    );
}

/** Get center coordinate of a grid cell */
function cellCenter(cellKey: string): Coordinate {
  const [latStr, lonStr] = cellKey.split(':');
  return {
    latitude: (parseInt(latStr) + 0.5) / 200,
    longitude: (parseInt(lonStr) + 0.5) / 200,
  };
}

/** Fill underpopulated cells with new zombies */
async function fillCells(cells: string[]): Promise<void> {
  if (cells.length === 0) return;

  // Count alive zombies per cell
  const counts = await db
    .select({
      gridCell: zombies.gridCell,
      count: sql<number>`count(*)::int`,
    })
    .from(zombies)
    .where(inArray(zombies.gridCell, cells))
    .groupBy(zombies.gridCell);

  const countMap = new Map(counts.map((c) => [c.gridCell, c.count]));

  const spawnPromises: Promise<(typeof zombies.$inferInsert)>[] = [];

  for (const cell of cells) {
    const existing = countMap.get(cell) ?? 0;
    const needed = ZOMBIES_PER_CELL - existing;
    if (needed <= 0) continue;

    const center = cellCenter(cell);

    for (let i = 0; i < needed; i++) {
      const distance =
        ZOMBIE_SPAWN_DISTANCE_MIN +
        Math.random() * (ZOMBIE_SPAWN_DISTANCE_MAX - ZOMBIE_SPAWN_DISTANCE_MIN);
      const bearing = Math.random() * 360;
      const point = pointAtDistance(center, distance, bearing);

      spawnPromises.push(
        locateOnNetwork(point).then((snapped) => ({
          id: randomUUID(),
          latitude: (snapped ?? point).latitude,
          longitude: (snapped ?? point).longitude,
          gridCell: cell,
          isAlive: true,
          deadUntil: null,
        }))
      );
    }
  }

  const toInsert = await Promise.all(spawnPromises);

  if (toInsert.length > 0) {
    await db.insert(zombies).values(toInsert);
  }
}

/** Get or create zombies in the area around center within radius */
export async function getOrCreateZombiesInArea(
  center: Coordinate,
  radiusM: number
): Promise<ServerZombie[]> {
  const cells = getCellsInRadius(center, radiusM);

  // Revive expired dead zombies
  await reviveExpiredZombies(cells);

  // Fill underpopulated cells
  await fillCells(cells);

  // Fetch all alive zombies in the area
  const rows = await db
    .select()
    .from(zombies)
    .where(
      and(
        inArray(zombies.gridCell, cells),
        eq(zombies.isAlive, true)
      )
    );

  return rows.map((row) => ({
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    gridCell: row.gridCell,
    isAlive: row.isAlive,
    deadUntil: row.deadUntil ?? null,
  }));
}

/** Kill a zombie — mark as dead with respawn timer */
export async function killZombie(zombieId: string): Promise<boolean> {
  const result = await db
    .update(zombies)
    .set({
      isAlive: false,
      deadUntil: Date.now() + ZOMBIE_RESPAWN_TIME,
    })
    .where(and(eq(zombies.id, zombieId), eq(zombies.isAlive, true)));

  return (result as any).rowCount > 0;
}
