import { randomUUID } from 'crypto';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { cityStates, zoneVisits, zoneChargeEvents } from '../db/schema/game.js';
import { ZONE_ENTER_CHARGE_BONUS, ZONE_MAX_CHARGE, ZONE_BASE_RADIUS, ZONE_RADIUS_PER_LEVEL, ZONE_MAX_LEVEL, ZONE_SHRINK_THRESHOLD, ZONE_SHRINK_FACTOR, CITY_STATE_HEAL_HERBS_PER_HP, CITY_STATE_UPGRADE_CRYSTAL_COSTS, } from '@undead/shared';
import { spendHerbs, spendCrystals } from './resources.js';
/** Compute effective radius considering upgrade level and charge */
export function computeEffectiveRadius(zone) {
    const fullRadius = ZONE_BASE_RADIUS + zone.upgradeLevel * ZONE_RADIUS_PER_LEVEL;
    const chargePercent = (zone.charge / zone.maxCharge) * 100;
    if (chargePercent < ZONE_SHRINK_THRESHOLD) {
        return Math.round(fullRadius * ZONE_SHRINK_FACTOR);
    }
    return fullRadius;
}
export async function getAllCityStates() {
    const zones = await db.select().from(cityStates).where(eq(cityStates.isApproved, true));
    return zones.map((zone) => ({
        ...zone,
        radius: computeEffectiveRadius(zone),
        baseRadius: ZONE_BASE_RADIUS + zone.upgradeLevel * ZONE_RADIUS_PER_LEVEL,
    }));
}
export async function getCityStateById(id) {
    const results = await db.select().from(cityStates).where(eq(cityStates.id, id));
    return results[0] ?? null;
}
export async function enterCityState(userId, zoneId) {
    const zone = await getCityStateById(zoneId);
    if (!zone)
        throw new Error('City-state not found');
    // Create visit record
    await db.insert(zoneVisits).values({
        id: randomUUID(),
        userId,
        zoneId,
    });
    // Add charge
    const newCharge = Math.min(zone.charge + ZONE_ENTER_CHARGE_BONUS, ZONE_MAX_CHARGE);
    await db.update(cityStates).set({ charge: newCharge }).where(eq(cityStates.id, zoneId));
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
export async function exitCityState(userId, zoneId) {
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
            const zone = await getCityStateById(zoneId);
            if (zone) {
                const newCharge = Math.min(zone.charge + stayMinutes, ZONE_MAX_CHARGE);
                await db.update(cityStates).set({ charge: newCharge }).where(eq(cityStates.id, zoneId));
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
export async function reconquerCityState(userId, zoneId) {
    const zone = await getCityStateById(zoneId);
    if (!zone)
        throw new Error('City-state not found');
    if (!zone.isFallen)
        throw new Error('City-state is not fallen');
    await db
        .update(cityStates)
        .set({ isFallen: false, charge: ZONE_ENTER_CHARGE_BONUS })
        .where(eq(cityStates.id, zoneId));
    await db.insert(zoneChargeEvents).values({
        id: randomUUID(),
        zoneId,
        delta: ZONE_ENTER_CHARGE_BONUS,
        reason: 'reconquer',
        triggeredBy: userId,
    });
    return { ...zone, isFallen: false, charge: ZONE_ENTER_CHARGE_BONUS };
}
export async function healCityState(userId, zoneId, amount) {
    const zone = await getCityStateById(zoneId);
    if (!zone)
        throw new Error('City-state not found');
    if (zone.isFallen)
        throw new Error('Cannot heal a fallen city-state');
    const hpToHeal = Math.min(amount, zone.maxCharge - zone.charge);
    if (hpToHeal <= 0)
        throw new Error('City-state is already at full charge');
    const herbsCost = hpToHeal * CITY_STATE_HEAL_HERBS_PER_HP;
    const newBalance = await spendHerbs(userId, herbsCost);
    if (newBalance === null)
        throw new Error('Not enough herbs');
    const newCharge = zone.charge + hpToHeal;
    await db.update(cityStates).set({ charge: newCharge }).where(eq(cityStates.id, zoneId));
    await db.insert(zoneChargeEvents).values({
        id: randomUUID(),
        zoneId,
        delta: hpToHeal,
        reason: 'player_heal',
        triggeredBy: userId,
    });
    return { newCharge, herbsSpent: herbsCost, newBalance };
}
export async function upgradeCityState(userId, zoneId) {
    const zone = await getCityStateById(zoneId);
    if (!zone)
        throw new Error('City-state not found');
    if (zone.isFallen)
        throw new Error('Cannot upgrade a fallen city-state');
    if (zone.upgradeLevel >= ZONE_MAX_LEVEL)
        throw new Error('City-state is already at max level');
    // Require 100% charge to upgrade
    if (zone.charge < zone.maxCharge)
        throw new Error('City-state must be at full charge to upgrade');
    const crystalsCost = CITY_STATE_UPGRADE_CRYSTAL_COSTS[zone.upgradeLevel];
    const newBalance = await spendCrystals(userId, crystalsCost);
    if (newBalance === null)
        throw new Error('Not enough crystals');
    const newLevel = zone.upgradeLevel + 1;
    const newRadius = ZONE_BASE_RADIUS + newLevel * ZONE_RADIUS_PER_LEVEL;
    await db
        .update(cityStates)
        .set({ upgradeLevel: newLevel, radius: newRadius })
        .where(eq(cityStates.id, zoneId));
    return { newLevel, newRadius, crystalsSpent: crystalsCost, newBalance };
}
export async function suggestCityState(userId, name, latitude, longitude, radius) {
    const id = randomUUID();
    await db.insert(cityStates).values({
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
export async function getCityStatePresence(zoneId) {
    const result = await db.execute(sql `
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
//# sourceMappingURL=city-state.js.map