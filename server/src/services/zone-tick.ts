import { randomUUID } from 'crypto';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { safeZones, zombies, zoneChargeEvents } from '../db/schema/game.js';
import { getCellsInRadius } from './grid-utils.js';
import {
  ZONE_TICK_INTERVAL,
  ZONE_DAMAGE_PER_ZOMBIE_PER_TICK,
  ZONE_DAMAGE_RANGE,
  ZONE_DEFENSE_MULTIPLIERS,
  ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK,
  ZOMBIE_ZONE_TARGET_RANGE,
} from '@undead/shared';

let tickInterval: ReturnType<typeof setInterval> | null = null;

async function processZoneTick() {
  try {
    // Get all non-fallen approved zones
    const zones = await db
      .select()
      .from(safeZones)
      .where(
        sql`${safeZones.isApproved} = true AND ${safeZones.isFallen} = false`
      );

    for (const zone of zones) {
      // Count alive zombies in grid cells within ZOMBIE_ZONE_TARGET_RANGE
      // Grid cells are ~500m, so we need a wider lookup radius than ZONE_DAMAGE_RANGE (100m)
      // to actually detect zombies that spawned near the zone or routed toward it
      const nearbyCells = getCellsInRadius(
        { latitude: zone.latitude, longitude: zone.longitude },
        ZOMBIE_ZONE_TARGET_RANGE
      );

      let zombieCount = 0;
      if (nearbyCells.length > 0) {
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(zombies)
          .where(
            and(
              inArray(zombies.gridCell, nearbyCells),
              eq(zombies.isAlive, true)
            )
          );
        zombieCount = countResult[0]?.count ?? 0;
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

      // Calculate damage with defense multiplier
      const defenseIndex = Math.min(playerCount, ZONE_DEFENSE_MULTIPLIERS.length - 1);
      const defenseMult = ZONE_DEFENSE_MULTIPLIERS[defenseIndex];
      const rawDamage = zombieCount * ZONE_DAMAGE_PER_ZOMBIE_PER_TICK * defenseMult;
      // Ensure minimum 1 damage when zombies are present and defense isn't total
      const damage = rawDamage > 0 ? Math.max(1, Math.floor(rawDamage)) : 0;

      // Calculate passive healing (minimum 1 when players present)
      const rawHealing = playerCount * ZONE_PASSIVE_HEAL_PER_PLAYER_PER_TICK;
      const healing = rawHealing > 0 ? Math.max(1, Math.floor(rawHealing)) : 0;

      if (damage === 0 && healing === 0) continue;

      const newCharge = Math.max(0, Math.min(zone.maxCharge, zone.charge + healing - damage));

      // No change
      if (newCharge === zone.charge) continue;

      // Check if zone just fell
      if (newCharge <= 0 && zone.charge > 0) {
        await db
          .update(safeZones)
          .set({ charge: 0, isFallen: true })
          .where(eq(safeZones.id, zone.id));

        await db.insert(zoneChargeEvents).values({
          id: randomUUID(),
          zoneId: zone.id,
          delta: -zone.charge,
          reason: 'fallen',
        });
      } else {
        await db
          .update(safeZones)
          .set({ charge: newCharge })
          .where(eq(safeZones.id, zone.id));

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
  } catch (err) {
    console.error('Zone tick error:', err);
  }
}

export function startZoneTick() {
  if (tickInterval) return;
  console.log(`Zone tick started (every ${ZONE_TICK_INTERVAL / 1000}s)`);
  tickInterval = setInterval(processZoneTick, ZONE_TICK_INTERVAL);
}

export function stopZoneTick() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}
