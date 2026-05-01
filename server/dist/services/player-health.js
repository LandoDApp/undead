import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { playerHealthState } from '../db/schema/game.js';
import { PLAYER_MAX_HITS, PLAYER_DOWN_DURATION, GHOUL_CAUGHT_DISTANCE } from '@undead/shared';
import { distanceMeters } from '@undead/shared';
/** Get or initialize health state for a player */
export async function getHealthState(userId) {
    const rows = await db
        .select()
        .from(playerHealthState)
        .where(eq(playerHealthState.userId, userId));
    if (rows.length === 0) {
        // Initialize fresh state
        await db.insert(playerHealthState).values({
            userId,
            hits: 0,
            isDown: false,
            downUntil: null,
        });
        return { hits: 0, maxHits: PLAYER_MAX_HITS, isDown: false, downUntil: null };
    }
    const row = rows[0];
    // Auto-revive if down timer has expired
    if (row.isDown && row.downUntil && Date.now() >= row.downUntil) {
        await db
            .update(playerHealthState)
            .set({ hits: 0, isDown: false, downUntil: null, updatedAt: new Date() })
            .where(eq(playerHealthState.userId, userId));
        return { hits: 0, maxHits: PLAYER_MAX_HITS, isDown: false, downUntil: null };
    }
    return {
        hits: row.hits,
        maxHits: PLAYER_MAX_HITS,
        isDown: row.isDown,
        downUntil: row.downUntil ?? null,
    };
}
/** Validate a ghoul catch and apply damage */
export async function processGhoulCatch(userId, ghoulLat, ghoulLon, playerLat, playerLon) {
    // Validate distance - server-side check with some tolerance (2x caught distance)
    const dist = distanceMeters({ latitude: ghoulLat, longitude: ghoulLon }, { latitude: playerLat, longitude: playerLon });
    if (dist > GHOUL_CAUGHT_DISTANCE * 2) {
        // Too far apart - reject
        return { hit: false, totalHits: 0, isDown: false, downUntil: null };
    }
    // Get current state
    const state = await getHealthState(userId);
    // Already down? Don't accept more hits
    if (state.isDown) {
        return {
            hit: false,
            totalHits: state.hits,
            isDown: true,
            downUntil: state.downUntil,
        };
    }
    const newHits = state.hits + 1;
    const isDown = newHits >= PLAYER_MAX_HITS;
    const downUntil = isDown ? Date.now() + PLAYER_DOWN_DURATION : null;
    await db
        .insert(playerHealthState)
        .values({
        userId,
        hits: newHits,
        isDown,
        downUntil,
        updatedAt: new Date(),
    })
        .onConflictDoUpdate({
        target: playerHealthState.userId,
        set: {
            hits: newHits,
            isDown,
            downUntil,
            updatedAt: new Date(),
        },
    });
    return { hit: true, totalHits: newHits, isDown, downUntil };
}
/** Revive a player (reset health) */
export async function revivePlayer(userId) {
    await db
        .insert(playerHealthState)
        .values({
        userId,
        hits: 0,
        isDown: false,
        downUntil: null,
        updatedAt: new Date(),
    })
        .onConflictDoUpdate({
        target: playerHealthState.userId,
        set: {
            hits: 0,
            isDown: false,
            downUntil: null,
            updatedAt: new Date(),
        },
    });
    return { hits: 0, maxHits: PLAYER_MAX_HITS, isDown: false, downUntil: null };
}
//# sourceMappingURL=player-health.js.map