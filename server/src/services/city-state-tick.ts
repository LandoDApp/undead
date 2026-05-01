import { randomUUID } from 'crypto';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { cityStates, ghouls, zoneChargeEvents } from '../db/schema/game.js';
import { getCellsInRadius } from './grid-utils.js';
import { tickBastionDrain } from './bastion.js';
import {
  ZONE_TICK_INTERVAL,
  ZONE_DAMAGE_PER_GHOUL_PER_TICK,
  ZONE_DAMAGE_RANGE,
  ZONE_DEFENSE_MULTIPLIERS,
  ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK,
  GHOUL_ZONE_TARGET_RANGE,
} from '@undead/shared';

let tickInterval: ReturnType<typeof setInterval> | null = null;

// In-memory accumulators for fractional damage/healing (keyed by zone id)
const damageAccumulator = new Map<string, number>();
const healingAccumulator = new Map<string, number>();

async function processCityStateTick() {
  try {
    // Get all non-fallen approved city-states
    const zones = await db
      .select()
      .from(cityStates)
      .where(
        sql`${cityStates.isApproved} = true AND ${cityStates.isFallen} = false`
      );

    for (const zone of zones) {
      // Count alive ghouls in grid cells within GHOUL_ZONE_TARGET_RANGE
      const nearbyCells = getCellsInRadius(
        { latitude: zone.latitude, longitude: zone.longitude },
        GHOUL_ZONE_TARGET_RANGE
      );

      let ghoulCount = 0;
      if (nearbyCells.length > 0) {
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(ghouls)
          .where(
            and(
              inArray(ghouls.gridCell, nearbyCells),
              eq(ghouls.isAlive, true)
            )
          );
        ghoulCount = countResult[0]?.count ?? 0;
      }

      // Count active players inside zone radius
      const playerCountResult = await db.execute(sql`
        SELECT count(*)::int as cnt FROM player_positions
        WHERE is_active = true
          AND last_seen_at > NOW() - INTERVAL '5 minutes'
          AND ST_DWithin(
            ST_MakePoint(longitude, latitude)::geography,
            ST_MakePoint(${zone.longitude}, ${zone.latitude})::geography,
            ${zone.radius}
          )
      `);
      const playerCount = (playerCountResult as any)[0]?.cnt ?? 0;

      // Calculate damage with defense multiplier (fractional accumulator)
      const defenseIndex = Math.min(playerCount, ZONE_DEFENSE_MULTIPLIERS.length - 1);
      const defenseMult = ZONE_DEFENSE_MULTIPLIERS[defenseIndex];
      const rawDamage = ghoulCount * ZONE_DAMAGE_PER_GHOUL_PER_TICK * defenseMult;

      // Calculate passive healing (fractional accumulator)
      const rawHealing = playerCount * ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK;

      if (rawDamage === 0 && rawHealing === 0) continue;

      // Accumulate fractional damage and extract integer part
      const accDmg = (damageAccumulator.get(zone.id) ?? 0) + rawDamage;
      const damage = Math.floor(accDmg);
      damageAccumulator.set(zone.id, accDmg - damage);

      // Accumulate fractional healing and extract integer part
      const accHeal = (healingAccumulator.get(zone.id) ?? 0) + rawHealing;
      const healing = Math.floor(accHeal);
      healingAccumulator.set(zone.id, accHeal - healing);

      if (damage === 0 && healing === 0) continue;

      const newCharge = Math.max(0, Math.min(zone.maxCharge, zone.charge + healing - damage));

      // No change
      if (newCharge === zone.charge) continue;

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
      } else {
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
  } catch (err) {
    console.error('City-state tick error:', err);
  }
}

export function startCityStateTick() {
  if (tickInterval) return;
  console.log(`City-state tick started (every ${ZONE_TICK_INTERVAL / 1000}s)`);
  tickInterval = setInterval(processCityStateTick, ZONE_TICK_INTERVAL);
}

export function stopCityStateTick() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}
