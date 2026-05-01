import { randomUUID } from 'crypto';
import { eq, and, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { collectiblePoints, playerPoints, ghouls } from '../db/schema/game.js';
import { getCellsInRadius } from './grid-utils.js';
import { locateOnNetwork } from './valhalla.js';
import { RESOURCE_SPAWN_HERB, RESOURCE_SPAWN_CRYSTAL, RESOURCE_RELIC_CHANCE, RESOURCE_LIFETIME_HERB, RESOURCE_LIFETIME_CRYSTAL, RESOURCE_LIFETIME_RELIC, RESOURCE_VALUE_HERB, RESOURCE_VALUE_CRYSTAL, RESOURCE_VALUE_RELIC, RESOURCE_COLLECT_RADIUS, } from '@undead/shared';
import { pointAtDistance, distanceMeters } from '@undead/shared';
const SPAWN_CONFIG = [
    { type: 'herb', count: RESOURCE_SPAWN_HERB, lifetime: RESOURCE_LIFETIME_HERB, value: RESOURCE_VALUE_HERB },
    { type: 'crystal', count: RESOURCE_SPAWN_CRYSTAL, lifetime: RESOURCE_LIFETIME_CRYSTAL, value: RESOURCE_VALUE_CRYSTAL },
];
/** Delete expired and collected resources, then fill underpopulated cells near ghouls */
export async function getOrCreateResourcesInArea(center, radiusM) {
    const cells = getCellsInRadius(center, radiusM);
    if (cells.length === 0)
        return [];
    const now = Date.now();
    // Delete expired uncollected resources
    await db
        .delete(collectiblePoints)
        .where(and(inArray(collectiblePoints.gridCell, cells), isNull(collectiblePoints.collectedBy), lte(collectiblePoints.expiresAt, now)));
    // Count uncollected resources per cell+type
    const counts = await db
        .select({
        gridCell: collectiblePoints.gridCell,
        resourceType: collectiblePoints.resourceType,
        count: sql `count(*)::int`,
    })
        .from(collectiblePoints)
        .where(and(inArray(collectiblePoints.gridCell, cells), isNull(collectiblePoints.collectedBy)))
        .groupBy(collectiblePoints.gridCell, collectiblePoints.resourceType);
    // Build a map: "cell:type" → count
    const countMap = new Map();
    for (const c of counts) {
        countMap.set(`${c.gridCell}:${c.resourceType}`, c.count);
    }
    // Find cells that need more resources — only spawn near ghoul positions
    const cellsNeedingResources = new Set();
    for (const cell of cells) {
        for (const cfg of SPAWN_CONFIG) {
            const existing = countMap.get(`${cell}:${cfg.type}`) ?? 0;
            if (existing < cfg.count) {
                cellsNeedingResources.add(cell);
            }
        }
        // Check relic chance
        const existingRelics = countMap.get(`${cell}:relic`) ?? 0;
        if (existingRelics === 0 && Math.random() < RESOURCE_RELIC_CHANCE) {
            cellsNeedingResources.add(cell);
        }
    }
    if (cellsNeedingResources.size > 0) {
        const cellsArr = [...cellsNeedingResources];
        // Get ghoul positions in these cells to spawn resources near them
        const ghoulRows = await db
            .select({ latitude: ghouls.latitude, longitude: ghouls.longitude, gridCell: ghouls.gridCell })
            .from(ghouls)
            .where(and(inArray(ghouls.gridCell, cellsArr), eq(ghouls.isAlive, true)));
        // Group ghouls by cell
        const ghoulsByCell = new Map();
        for (const g of ghoulRows) {
            const list = ghoulsByCell.get(g.gridCell) ?? [];
            list.push({ latitude: g.latitude, longitude: g.longitude });
            ghoulsByCell.set(g.gridCell, list);
        }
        const spawnPromises = [];
        for (const cell of cellsArr) {
            const cellGhouls = ghoulsByCell.get(cell);
            if (!cellGhouls || cellGhouls.length === 0)
                continue;
            // Spawn herbs and crystals
            for (const cfg of SPAWN_CONFIG) {
                const existing = countMap.get(`${cell}:${cfg.type}`) ?? 0;
                const needed = cfg.count - existing;
                if (needed <= 0)
                    continue;
                for (let i = 0; i < needed; i++) {
                    const ghoul = cellGhouls[Math.floor(Math.random() * cellGhouls.length)];
                    const distance = 10 + Math.random() * 40;
                    const bearing = Math.random() * 360;
                    const point = pointAtDistance(ghoul, distance, bearing);
                    spawnPromises.push(locateOnNetwork(point).then((snapped) => ({
                        id: randomUUID(),
                        latitude: (snapped ?? point).latitude,
                        longitude: (snapped ?? point).longitude,
                        gridCell: cell,
                        resourceType: cfg.type,
                        value: cfg.value,
                        expiresAt: now + cfg.lifetime,
                    })));
                }
            }
            // Relic: only if none exist and chance passed
            const existingRelics = countMap.get(`${cell}:relic`) ?? 0;
            if (existingRelics === 0 && Math.random() < RESOURCE_RELIC_CHANCE) {
                const ghoul = cellGhouls[Math.floor(Math.random() * cellGhouls.length)];
                const distance = 10 + Math.random() * 40;
                const bearing = Math.random() * 360;
                const point = pointAtDistance(ghoul, distance, bearing);
                spawnPromises.push(locateOnNetwork(point).then((snapped) => ({
                    id: randomUUID(),
                    latitude: (snapped ?? point).latitude,
                    longitude: (snapped ?? point).longitude,
                    gridCell: cell,
                    resourceType: 'relic',
                    value: RESOURCE_VALUE_RELIC,
                    expiresAt: now + RESOURCE_LIFETIME_RELIC,
                })));
            }
        }
        if (spawnPromises.length > 0) {
            const toInsert = await Promise.all(spawnPromises);
            await db.insert(collectiblePoints).values(toInsert);
        }
    }
    // Return all uncollected resources in area
    const rows = await db
        .select()
        .from(collectiblePoints)
        .where(and(inArray(collectiblePoints.gridCell, cells), isNull(collectiblePoints.collectedBy)));
    return rows.map((row) => ({
        id: row.id,
        latitude: row.latitude,
        longitude: row.longitude,
        type: row.resourceType,
        value: row.value,
        expiresAt: row.expiresAt,
    }));
}
/** Collect a resource — validate distance, mark collected, credit balance */
export async function collectResource(userId, resourceId, playerLat, playerLon) {
    const emptyBalance = { herbs: 0, crystals: 0, relics: 0, lifetimeHerbs: 0, lifetimeCrystals: 0, lifetimeRelics: 0 };
    // Find uncollected resource
    const rows = await db
        .select()
        .from(collectiblePoints)
        .where(and(eq(collectiblePoints.id, resourceId), isNull(collectiblePoints.collectedBy)));
    const resource = rows[0];
    if (!resource)
        return { collected: false, type: 'herb', amount: 0, newBalance: emptyBalance };
    // Check expired
    if (resource.expiresAt < Date.now())
        return { collected: false, type: 'herb', amount: 0, newBalance: emptyBalance };
    // Check distance
    const dist = distanceMeters({ latitude: playerLat, longitude: playerLon }, { latitude: resource.latitude, longitude: resource.longitude });
    if (dist > RESOURCE_COLLECT_RADIUS)
        return { collected: false, type: 'herb', amount: 0, newBalance: emptyBalance };
    // Mark collected
    await db
        .update(collectiblePoints)
        .set({ collectedBy: userId, collectedAt: new Date() })
        .where(eq(collectiblePoints.id, resourceId));
    const type = resource.resourceType;
    const newBalance = await addPlayerResource(userId, type, resource.value);
    return { collected: true, type, amount: resource.value, newBalance };
}
/** Add a specific resource type to player balance (upsert) */
export async function addPlayerResource(userId, type, amount) {
    const column = type === 'herb' ? 'herbs' : type === 'crystal' ? 'crystals' : 'relics';
    const lifetimeColumn = type === 'herb' ? 'lifetime_herbs' : type === 'crystal' ? 'lifetime_crystals' : 'lifetime_relics';
    const result = await db
        .insert(playerPoints)
        .values({
        userId,
        totalPoints: amount,
        lifetimeEarned: amount,
        lifetimeSpent: 0,
        herbs: type === 'herb' ? amount : 0,
        crystals: type === 'crystal' ? amount : 0,
        relics: type === 'relic' ? amount : 0,
        lifetimeHerbs: type === 'herb' ? amount : 0,
        lifetimeCrystals: type === 'crystal' ? amount : 0,
        lifetimeRelics: type === 'relic' ? amount : 0,
    })
        .onConflictDoUpdate({
        target: playerPoints.userId,
        set: {
            totalPoints: sql `${playerPoints.totalPoints} + ${amount}`,
            lifetimeEarned: sql `${playerPoints.lifetimeEarned} + ${amount}`,
            [column]: sql `${sql.identifier(column)} + ${amount}`,
            [lifetimeColumn]: sql `${sql.identifier(lifetimeColumn)} + ${amount}`,
            updatedAt: new Date(),
        },
    })
        .returning();
    const row = result[0];
    return {
        herbs: row.herbs,
        crystals: row.crystals,
        relics: row.relics,
        lifetimeHerbs: row.lifetimeHerbs,
        lifetimeCrystals: row.lifetimeCrystals,
        lifetimeRelics: row.lifetimeRelics,
    };
}
/** Spend herbs — returns new balance or null if insufficient */
export async function spendHerbs(userId, amount) {
    const balance = await getPlayerResourceBalance(userId);
    if (balance.herbs < amount)
        return null;
    const result = await db
        .update(playerPoints)
        .set({
        herbs: sql `${playerPoints.herbs} - ${amount}`,
        totalPoints: sql `${playerPoints.totalPoints} - ${amount}`,
        lifetimeSpent: sql `${playerPoints.lifetimeSpent} + ${amount}`,
        updatedAt: new Date(),
    })
        .where(eq(playerPoints.userId, userId))
        .returning();
    const row = result[0];
    if (!row)
        return null;
    return {
        herbs: row.herbs,
        crystals: row.crystals,
        relics: row.relics,
        lifetimeHerbs: row.lifetimeHerbs,
        lifetimeCrystals: row.lifetimeCrystals,
        lifetimeRelics: row.lifetimeRelics,
    };
}
/** Spend crystals — returns new balance or null if insufficient */
export async function spendCrystals(userId, amount) {
    const balance = await getPlayerResourceBalance(userId);
    if (balance.crystals < amount)
        return null;
    const result = await db
        .update(playerPoints)
        .set({
        crystals: sql `${playerPoints.crystals} - ${amount}`,
        totalPoints: sql `${playerPoints.totalPoints} - ${amount}`,
        lifetimeSpent: sql `${playerPoints.lifetimeSpent} + ${amount}`,
        updatedAt: new Date(),
    })
        .where(eq(playerPoints.userId, userId))
        .returning();
    const row = result[0];
    if (!row)
        return null;
    return {
        herbs: row.herbs,
        crystals: row.crystals,
        relics: row.relics,
        lifetimeHerbs: row.lifetimeHerbs,
        lifetimeCrystals: row.lifetimeCrystals,
        lifetimeRelics: row.lifetimeRelics,
    };
}
/** Get player resource balance */
export async function getPlayerResourceBalance(userId) {
    const rows = await db
        .select()
        .from(playerPoints)
        .where(eq(playerPoints.userId, userId));
    if (rows.length === 0) {
        return { herbs: 0, crystals: 0, relics: 0, lifetimeHerbs: 0, lifetimeCrystals: 0, lifetimeRelics: 0 };
    }
    const row = rows[0];
    return {
        herbs: row.herbs,
        crystals: row.crystals,
        relics: row.relics,
        lifetimeHerbs: row.lifetimeHerbs,
        lifetimeCrystals: row.lifetimeCrystals,
        lifetimeRelics: row.lifetimeRelics,
    };
}
// --- Legacy compatibility wrappers (used by old code paths) ---
/** @deprecated Use getPlayerResourceBalance */
export async function getPlayerBalance(userId) {
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
/** @deprecated Use addPlayerResource */
export async function addPlayerPoints(userId, amount) {
    const result = await db
        .insert(playerPoints)
        .values({
        userId,
        totalPoints: amount,
        lifetimeEarned: amount,
        lifetimeSpent: 0,
        herbs: amount,
        lifetimeHerbs: amount,
    })
        .onConflictDoUpdate({
        target: playerPoints.userId,
        set: {
            totalPoints: sql `${playerPoints.totalPoints} + ${amount}`,
            lifetimeEarned: sql `${playerPoints.lifetimeEarned} + ${amount}`,
            herbs: sql `${playerPoints.herbs} + ${amount}`,
            lifetimeHerbs: sql `${playerPoints.lifetimeHerbs} + ${amount}`,
            updatedAt: new Date(),
        },
    })
        .returning({ totalPoints: playerPoints.totalPoints });
    return result[0].totalPoints;
}
/** @deprecated Use spendHerbs / spendCrystals */
export async function spendPlayerPoints(userId, amount) {
    const balance = await getPlayerBalance(userId);
    if (balance.totalPoints < amount)
        return null;
    const result = await db
        .update(playerPoints)
        .set({
        totalPoints: sql `${playerPoints.totalPoints} - ${amount}`,
        lifetimeSpent: sql `${playerPoints.lifetimeSpent} + ${amount}`,
        updatedAt: new Date(),
    })
        .where(eq(playerPoints.userId, userId))
        .returning({ totalPoints: playerPoints.totalPoints });
    return result[0]?.totalPoints ?? null;
}
//# sourceMappingURL=resources.js.map