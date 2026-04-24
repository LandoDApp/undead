import { randomUUID } from 'crypto';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { safeZones, zoneVisits, zoneChargeEvents } from '../db/schema/game.js';
import { ZONE_ENTER_CHARGE_BONUS, ZONE_MAX_CHARGE } from '@undead/shared';

export async function getAllZones() {
  return db.select().from(safeZones).where(eq(safeZones.isApproved, true));
}

export async function getZoneById(id: string) {
  const results = await db.select().from(safeZones).where(eq(safeZones.id, id));
  return results[0] ?? null;
}

export async function enterZone(userId: string, zoneId: string) {
  const zone = await getZoneById(zoneId);
  if (!zone) throw new Error('Zone not found');

  // Create visit record
  await db.insert(zoneVisits).values({
    id: randomUUID(),
    userId,
    zoneId,
  });

  // Add charge
  const newCharge = Math.min(zone.charge + ZONE_ENTER_CHARGE_BONUS, ZONE_MAX_CHARGE);
  await db.update(safeZones).set({ charge: newCharge }).where(eq(safeZones.id, zoneId));

  // Log charge event
  await db.insert(zoneChargeEvents).values({
    id: randomUUID(),
    zoneId,
    delta: ZONE_ENTER_CHARGE_BONUS,
    reason: 'player_enter',
    triggeredBy: userId,
  });

  return { ...zone, charge: newCharge };
}

export async function exitZone(userId: string, zoneId: string) {
  // Close open visit
  const openVisits = await db
    .select()
    .from(zoneVisits)
    .where(and(eq(zoneVisits.userId, userId), eq(zoneVisits.zoneId, zoneId), isNull(zoneVisits.leftAt)));

  if (openVisits.length > 0) {
    const visit = openVisits[0];
    const now = new Date();
    const duration = Math.floor((now.getTime() - visit.enteredAt.getTime()) / 1000);

    await db
      .update(zoneVisits)
      .set({ leftAt: now, durationSeconds: duration })
      .where(eq(zoneVisits.id, visit.id));

    // Add stay charge
    const stayMinutes = Math.floor(duration / 60);
    if (stayMinutes > 0) {
      const zone = await getZoneById(zoneId);
      if (zone) {
        const newCharge = Math.min(zone.charge + stayMinutes, ZONE_MAX_CHARGE);
        await db.update(safeZones).set({ charge: newCharge }).where(eq(safeZones.id, zoneId));
        await db.insert(zoneChargeEvents).values({
          id: randomUUID(),
          zoneId,
          delta: stayMinutes,
          reason: 'player_stay',
          triggeredBy: userId,
        });
      }
    }
  }
}

export async function reconquerZone(userId: string, zoneId: string) {
  const zone = await getZoneById(zoneId);
  if (!zone) throw new Error('Zone not found');
  if (!zone.isFallen) throw new Error('Zone is not fallen');

  await db
    .update(safeZones)
    .set({ isFallen: false, charge: ZONE_ENTER_CHARGE_BONUS })
    .where(eq(safeZones.id, zoneId));

  await db.insert(zoneChargeEvents).values({
    id: randomUUID(),
    zoneId,
    delta: ZONE_ENTER_CHARGE_BONUS,
    reason: 'reconquer',
    triggeredBy: userId,
  });

  return { ...zone, isFallen: false, charge: ZONE_ENTER_CHARGE_BONUS };
}

export async function suggestZone(
  userId: string,
  name: string,
  latitude: number,
  longitude: number,
  radius: number
) {
  const id = randomUUID();
  await db.insert(safeZones).values({
    id,
    name,
    latitude,
    longitude,
    radius,
    isApproved: false,
    suggestedBy: userId,
  });
  return id;
}

export async function getZonePresence(zoneId: string) {
  const result = await db.execute(sql`
    SELECT u.display_name, pp.last_seen_at
    FROM player_positions pp
    JOIN users u ON u.id = pp.user_id
    WHERE pp.is_active = true
      AND pp.last_seen_at > NOW() - INTERVAL '10 minutes'
      AND ST_DWithin(
        ST_MakePoint(pp.longitude, pp.latitude)::geography,
        (SELECT ST_MakePoint(sz.longitude, sz.latitude)::geography FROM safe_zones sz WHERE sz.id = ${zoneId}),
        200
      )
  `);
  return result;
}
