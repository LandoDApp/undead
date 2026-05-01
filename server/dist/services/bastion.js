import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bastions } from '../db/schema/game.js';
import { spendHerbs, spendCrystals } from './resources.js';
import { BASTION_MAX_HP, BASTION_UPGRADE_CRYSTAL_COSTS, BASTION_GHOUL_DRAIN_PER_HOUR, BASTION_HEAL_HERB_COST, BASTION_REINFORCE_BONUS, } from '@undead/shared';
function toBastion(row) {
    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        level: row.level,
        hp: row.hp,
        maxHp: row.maxHp,
        createdAt: row.createdAt.getTime(),
    };
}
/** Get a player's bastion (max 1 per player) */
export async function getPlayerBastion(userId) {
    const rows = await db
        .select()
        .from(bastions)
        .where(eq(bastions.userId, userId));
    if (rows.length === 0)
        return null;
    return toBastion(rows[0]);
}
/** Create a bastion — max 1 per player */
export async function createBastion(userId, name, latitude, longitude) {
    const existing = await getPlayerBastion(userId);
    if (existing)
        throw new Error('Player already has a bastion');
    const level = 0;
    const maxHp = BASTION_MAX_HP[level];
    const id = randomUUID();
    await db.insert(bastions).values({
        id,
        userId,
        name,
        latitude,
        longitude,
        level,
        hp: maxHp,
        maxHp,
    });
    const rows = await db.select().from(bastions).where(eq(bastions.id, id));
    return toBastion(rows[0]);
}
/** Upgrade bastion — costs crystals, increases level and max HP */
export async function upgradeBastion(userId) {
    const bastion = await getPlayerBastion(userId);
    if (!bastion)
        throw new Error('No bastion found');
    if (bastion.level >= 2)
        throw new Error('Bastion is already at max level');
    const nextLevel = (bastion.level + 1);
    const crystalsCost = BASTION_UPGRADE_CRYSTAL_COSTS[nextLevel];
    const newBalance = await spendCrystals(userId, crystalsCost);
    if (newBalance === null)
        throw new Error('Not enough crystals');
    const newMaxHp = BASTION_MAX_HP[nextLevel];
    // Heal to full on upgrade
    await db
        .update(bastions)
        .set({
        level: nextLevel,
        maxHp: newMaxHp,
        hp: newMaxHp,
        updatedAt: new Date(),
    })
        .where(eq(bastions.userId, userId));
    const updated = await getPlayerBastion(userId);
    return { bastion: updated, crystalsSpent: crystalsCost, newBalance };
}
/** Heal bastion — costs herbs */
export async function healBastion(userId, amount) {
    const bastion = await getPlayerBastion(userId);
    if (!bastion)
        throw new Error('No bastion found');
    const hpToHeal = Math.min(amount, bastion.maxHp - bastion.hp);
    if (hpToHeal <= 0)
        throw new Error('Bastion is already at full HP');
    const herbsCost = hpToHeal * BASTION_HEAL_HERB_COST;
    const newBalance = await spendHerbs(userId, herbsCost);
    if (newBalance === null)
        throw new Error('Not enough herbs');
    const newHp = bastion.hp + hpToHeal;
    await db
        .update(bastions)
        .set({ hp: newHp, updatedAt: new Date() })
        .where(eq(bastions.userId, userId));
    return { newHp, herbsSpent: herbsCost, newBalance };
}
/** Friend reinforces a bastion — gives bonus HP */
export async function reinforceBastion(bastionId, friendId) {
    const rows = await db.select().from(bastions).where(eq(bastions.id, bastionId));
    if (rows.length === 0)
        throw new Error('Bastion not found');
    const bastion = rows[0];
    // Don't allow self-reinforce
    if (bastion.userId === friendId)
        throw new Error('Cannot reinforce your own bastion');
    const bonusHp = BASTION_REINFORCE_BONUS;
    const newHp = Math.min(bastion.hp + bonusHp, bastion.maxHp);
    await db
        .update(bastions)
        .set({ hp: newHp, updatedAt: new Date() })
        .where(eq(bastions.id, bastionId));
    return { newHp, bonusHp: newHp - bastion.hp };
}
/** Get bastions nearby a position */
export async function getNearbyBastions(lat, lon, radiusM) {
    const rows = await db.execute(sql `
    SELECT * FROM bastions
    WHERE ST_DWithin(
      ST_MakePoint(longitude, latitude)::geography,
      ST_MakePoint(${lon}, ${lat})::geography,
      ${radiusM}
    )
  `);
    return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        level: row.level,
        hp: row.hp,
        maxHp: row.max_hp,
        createdAt: new Date(row.created_at).getTime(),
    }));
}
/** Passive ghoul drain — called from tick loop. Drains HP from bastions whose owners are offline. */
export async function tickBastionDrain() {
    // Get all bastions with owners who haven't been active in 10+ minutes
    const drainRows = await db.execute(sql `
    SELECT b.id, b.hp, b.max_hp, b.updated_at
    FROM bastions b
    LEFT JOIN player_positions pp ON pp.user_id = b.user_id
    WHERE b.hp > 0
      AND (pp.is_active = false OR pp.last_seen_at < NOW() - INTERVAL '10 minutes' OR pp.user_id IS NULL)
  `);
    if (drainRows.length === 0)
        return;
    // Drain is BASTION_GHOUL_DRAIN_PER_HOUR per hour.
    // Tick runs every ZONE_TICK_INTERVAL (10s). So drain per tick = drain_per_hour * (10/3600)
    const drainPerTick = BASTION_GHOUL_DRAIN_PER_HOUR * (10 / 3600);
    for (const row of drainRows) {
        const newHp = Math.max(0, row.hp - drainPerTick);
        // Only update if HP actually changed (avoid sub-1 rounding spam)
        if (Math.floor(newHp) < row.hp) {
            await db
                .update(bastions)
                .set({ hp: Math.floor(newHp), updatedAt: new Date() })
                .where(eq(bastions.id, row.id));
        }
    }
}
//# sourceMappingURL=bastion.js.map