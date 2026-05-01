import { randomUUID } from 'crypto';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { cityStates, ghouls, zoneChargeEvents } from '../db/schema/game.js';
import { getCellsInRadius } from './grid-utils.js';
import { tickBastionDrain } from './bastion.js';
import { ZONE_TICK_INTERVAL, ZONE_DAMAGE_PER_GHOUL_PER_TICK, ZONE_DEFENSE_MULTIPLIERS, ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK, GHOUL_ZONE_TARGET_RANGE, } from '@undead/shared';
let tickInterval = null;
async function processCityStateTick() {
    try {
        // Get all non-fallen approved city-states
        const zones = await db
            .select()
            .from(cityStates)
            .where(sql `${cityStates.isApproved} = true AND ${cityStates.isFallen} = false`);
        for (const zone of zones) {
            // Count alive ghouls in grid cells within GHOUL_ZONE_TARGET_RANGE
            const nearbyCells = getCellsInRadius({ latitude: zone.latitude, longitude: zone.longitude }, GHOUL_ZONE_TARGET_RANGE);
            let ghoulCount = 0;
            if (nearbyCells.length > 0) {
                const countResult = await db
                    .select({ count: sql `count(*)::int` })
                    .from(ghouls)
                    .where(and(inArray(ghouls.gridCell, nearbyCells), eq(ghouls.isAlive, true)));
                ghoulCount = countResult[0]?.count ?? 0;
            }
            // Count active players inside zone radius
            const playerCountResult = await db.execute(sql `
        SELECT count(*)::int as cnt FROM player_positions
        WHERE is_active = true
          AND last_seen_at > NOW() - INTERVAL '5 minutes'
          AND ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(${zone.longitude}, ${zone.latitude})::geography,
            ${zone.radius}
          )
      `);
            const playerCount = playerCountResult[0]?.cnt ?? 0;
            // Calculate damage with defense multiplier
            const defenseIndex = Math.min(playerCount, ZONE_DEFENSE_MULTIPLIERS.length - 1);
            const defenseMult = ZONE_DEFENSE_MULTIPLIERS[defenseIndex];
            const rawDamage = ghoulCount * ZONE_DAMAGE_PER_GHOUL_PER_TICK * defenseMult;
            // Ensure minimum 1 damage when ghouls are present and defense isn't total
            const damage = rawDamage > 0 ? Math.max(1, Math.floor(rawDamage)) : 0;
            // Calculate passive healing (minimum 1 when players present)
            const rawHealing = playerCount * ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK;
            const healing = rawHealing > 0 ? Math.max(1, Math.floor(rawHealing)) : 0;
            if (damage === 0 && healing === 0)
                continue;
            const newCharge = Math.max(0, Math.min(zone.maxCharge, zone.charge + healing - damage));
            // No change
            if (newCharge === zone.charge)
                continue;
            // Check if zone just fell
            if (newCharge <= 0 && zone.charge > 0) {
                await db
                    .update(cityStates)
                    .set({ charge: 0, isFallen: true })
                    .where(eq(cityStates.id, zone.id));
                await db.insert(zoneChargeEvents).values({
                    id: randomUUID(),
                    zoneId: zone.id,
                    delta: -zone.charge,
                    reason: 'fallen',
                });
            }
            else {
                await db
                    .update(cityStates)
                    .set({ charge: newCharge })
                    .where(eq(cityStates.id, zone.id));
                if (damage > 0) {
                    await db.insert(zoneChargeEvents).values({
                        id: randomUUID(),
                        zoneId: zone.id,
                        delta: -damage,
                        reason: 'tick_damage',
                    });
                }
                if (healing > 0) {
                    await db.insert(zoneChargeEvents).values({
                        id: randomUUID(),
                        zoneId: zone.id,
                        delta: healing,
                        reason: 'tick_heal',
                    });
                }
            }
        }
        // Bastion passive drain for offline players
        await tickBastionDrain();
    }
    catch (err) {
        console.error('City-state tick error:', err);
    }
}
export function startCityStateTick() {
    if (tickInterval)
        return;
    console.log(`City-state tick started (every ${ZONE_TICK_INTERVAL / 1000}s)`);
    tickInterval = setInterval(processCityStateTick, ZONE_TICK_INTERVAL);
}
export function stopCityStateTick() {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
}
//# sourceMappingURL=city-state-tick.js.map