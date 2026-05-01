import { randomUUID } from 'crypto';
import { eq, and, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { ghouls } from '../db/schema/game.js';
import { locateOnNetwork } from './valhalla.js';
import { GHOULS_PER_CELL, GHOUL_RESPAWN_TIME, GHOUL_SPAWN_DISTANCE_MIN, GHOUL_SPAWN_DISTANCE_MAX, } from '@undead/shared';
import { pointAtDistance } from '@undead/shared';
import { gridCell, getCellsInRadius, cellCenter } from './grid-utils.js';
// Re-export for any external consumers
export { gridCell };
/** Revive ghouls whose dead_until timer has expired */
async function reviveExpiredGhouls(cells) {
    if (cells.length === 0)
        return;
    await db
        .update(ghouls)
        .set({ isAlive: true, deadUntil: null })
        .where(and(inArray(ghouls.gridCell, cells), eq(ghouls.isAlive, false), lte(ghouls.deadUntil, Date.now())));
}
/** Fill underpopulated cells with new ghouls */
async function fillCells(cells) {
    if (cells.length === 0)
        return;
    // Count alive ghouls per cell
    const counts = await db
        .select({
        gridCell: ghouls.gridCell,
        count: sql `count(*)::int`,
    })
        .from(ghouls)
        .where(inArray(ghouls.gridCell, cells))
        .groupBy(ghouls.gridCell);
    const countMap = new Map(counts.map((c) => [c.gridCell, c.count]));
    const spawnPromises = [];
    for (const cell of cells) {
        const existing = countMap.get(cell) ?? 0;
        const needed = GHOULS_PER_CELL - existing;
        if (needed <= 0)
            continue;
        const center = cellCenter(cell);
        for (let i = 0; i < needed; i++) {
            const distance = GHOUL_SPAWN_DISTANCE_MIN +
                Math.random() * (GHOUL_SPAWN_DISTANCE_MAX - GHOUL_SPAWN_DISTANCE_MIN);
            const bearing = Math.random() * 360;
            const point = pointAtDistance(center, distance, bearing);
            spawnPromises.push(locateOnNetwork(point).then((snapped) => ({
                id: randomUUID(),
                latitude: (snapped ?? point).latitude,
                longitude: (snapped ?? point).longitude,
                gridCell: cell,
                isAlive: true,
                deadUntil: null,
            })));
        }
    }
    const toInsert = await Promise.all(spawnPromises);
    if (toInsert.length > 0) {
        await db.insert(ghouls).values(toInsert);
    }
}
/** Get or create ghouls in the area around center within radius */
export async function getOrCreateGhoulsInArea(center, radiusM) {
    const cells = getCellsInRadius(center, radiusM);
    // Revive expired dead ghouls
    await reviveExpiredGhouls(cells);
    // Fill underpopulated cells
    await fillCells(cells);
    // Fetch all alive ghouls in the area
    const rows = await db
        .select()
        .from(ghouls)
        .where(and(inArray(ghouls.gridCell, cells), eq(ghouls.isAlive, true)));
    return rows.map((row) => ({
        id: row.id,
        latitude: row.latitude,
        longitude: row.longitude,
        gridCell: row.gridCell,
        isAlive: row.isAlive,
        deadUntil: row.deadUntil ?? null,
    }));
}
/** Kill a ghoul — mark as dead with respawn timer */
export async function killGhoul(ghoulId) {
    const result = await db
        .update(ghouls)
        .set({
        isAlive: false,
        deadUntil: Date.now() + GHOUL_RESPAWN_TIME,
    })
        .where(and(eq(ghouls.id, ghoulId), eq(ghouls.isAlive, true)));
    return result.rowCount > 0;
}
//# sourceMappingURL=ghoul-world.js.map