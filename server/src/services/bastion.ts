import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bastions, bastionWorkers } from '../db/schema/game.js';
import { spendHerbs, spendCrystals, addPlayerResource, getPlayerResourceBalance } from './resources.js';
import {
  BASTION_MAX_HP,
  BASTION_UPGRADE_CRYSTAL_COSTS,
  BASTION_GHOUL_DRAIN_PER_HOUR,
  BASTION_HEAL_HERB_COST,
  BASTION_REINFORCE_BONUS,
  WORKER_HERB_RATE,
  WORKER_CRYSTAL_RATE,
  WORKER_SCOUT_RATE,
  WORKER_LEVEL_MULTIPLIER,
  WORKER_UPGRADE_CRYSTAL_COSTS,
  BASTION_STORAGE_HERBS,
  BASTION_STORAGE_CRYSTALS,
  BASTION_STORAGE_RELICS,
  BASTION_STORAGE_SCOUTS,
  BASTION_WORKER_SLOTS,
  BASTION_MAX_OFFLINE_HOURS,
} from '@undead/shared';
import type { Bastion, BastionLevel, BastionWorker, BastionStorage, BastionIdleState, BastionCollectResponse, ResourceBalance, WorkerType } from '@undead/shared';

function toBastion(row: typeof bastions.$inferSelect): Bastion {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    level: row.level as BastionLevel,
    hp: row.hp,
    maxHp: row.maxHp,
    createdAt: row.createdAt.getTime(),
  };
}

/** Get a player's bastion (max 1 per player) */
export async function getPlayerBastion(userId: string): Promise<Bastion | null> {
  const rows = await db
    .select()
    .from(bastions)
    .where(eq(bastions.userId, userId));

  if (rows.length === 0) return null;
  return toBastion(rows[0]);
}

/** Create a bastion — max 1 per player */
export async function createBastion(
  userId: string,
  name: string,
  latitude: number,
  longitude: number
): Promise<Bastion> {
  const existing = await getPlayerBastion(userId);
  if (existing) throw new Error('Player already has a bastion');

  const level: BastionLevel = 0;
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
export async function upgradeBastion(
  userId: string
): Promise<{ bastion: Bastion; crystalsSpent: number; newBalance: ResourceBalance }> {
  const bastion = await getPlayerBastion(userId);
  if (!bastion) throw new Error('No bastion found');
  if (bastion.level >= 2) throw new Error('Bastion is already at max level');

  const nextLevel = (bastion.level + 1) as BastionLevel;
  const crystalsCost = BASTION_UPGRADE_CRYSTAL_COSTS[nextLevel];
  const newBalance = await spendCrystals(userId, crystalsCost);
  if (newBalance === null) throw new Error('Not enough crystals');

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
  return { bastion: updated!, crystalsSpent: crystalsCost, newBalance };
}

/** Heal bastion — costs herbs */
export async function healBastion(
  userId: string,
  amount: number
): Promise<{ newHp: number; herbsSpent: number; newBalance: ResourceBalance }> {
  const bastion = await getPlayerBastion(userId);
  if (!bastion) throw new Error('No bastion found');

  const hpToHeal = Math.min(amount, bastion.maxHp - bastion.hp);
  if (hpToHeal <= 0) throw new Error('Bastion is already at full HP');

  const herbsCost = hpToHeal * BASTION_HEAL_HERB_COST;
  const newBalance = await spendHerbs(userId, herbsCost);
  if (newBalance === null) throw new Error('Not enough herbs');

  const newHp = bastion.hp + hpToHeal;
  await db
    .update(bastions)
    .set({ hp: newHp, updatedAt: new Date() })
    .where(eq(bastions.userId, userId));

  // Quest progress
  import('./quests.js').then((m) => m.incrementQuestProgress(userId, 'heal', hpToHeal)).catch(() => {});

  return { newHp, herbsSpent: herbsCost, newBalance };
}

/** Friend reinforces a bastion — gives bonus HP */
export async function reinforceBastion(
  bastionId: string,
  friendId: string
): Promise<{ newHp: number; bonusHp: number }> {
  const rows = await db.select().from(bastions).where(eq(bastions.id, bastionId));
  if (rows.length === 0) throw new Error('Bastion not found');

  const bastion = rows[0];
  // Don't allow self-reinforce
  if (bastion.userId === friendId) throw new Error('Cannot reinforce your own bastion');

  const bonusHp = BASTION_REINFORCE_BONUS;
  const newHp = Math.min(bastion.hp + bonusHp, bastion.maxHp);

  await db
    .update(bastions)
    .set({ hp: newHp, updatedAt: new Date() })
    .where(eq(bastions.id, bastionId));

  return { newHp, bonusHp: newHp - bastion.hp };
}

/** Get bastions nearby a position */
export async function getNearbyBastions(
  lat: number,
  lon: number,
  radiusM: number
): Promise<Bastion[]> {
  const rows = await db.execute(sql`
    SELECT * FROM bastions
    WHERE ST_DWithin(
      ST_MakePoint(longitude, latitude)::geography,
      ST_MakePoint(${lon}, ${lat})::geography,
      ${radiusM}
    )
  `);

  return (rows as any[]).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    level: row.level as BastionLevel,
    hp: row.hp,
    maxHp: row.max_hp,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

// ---- Idle System ----

function toWorker(row: typeof bastionWorkers.$inferSelect): BastionWorker {
  return {
    id: row.id,
    type: row.workerType as WorkerType,
    level: row.level,
    assignedAt: row.assignedAt.getTime(),
  };
}

function getStorageLimits(bastionLevel: number): { maxHerbs: number; maxCrystals: number; maxRelics: number; maxScoutReports: number } {
  const lvl = Math.min(bastionLevel, 2);
  return {
    maxHerbs: BASTION_STORAGE_HERBS[lvl],
    maxCrystals: BASTION_STORAGE_CRYSTALS[lvl],
    maxRelics: BASTION_STORAGE_RELICS[lvl],
    maxScoutReports: BASTION_STORAGE_SCOUTS[lvl],
  };
}

function toBastionStorage(row: typeof bastions.$inferSelect): BastionStorage {
  const limits = getStorageLimits(row.level);
  return {
    herbs: row.storageHerbs,
    crystals: row.storageCrystals,
    relics: row.storageRelics,
    scoutReports: row.storageScoutReports,
    ...limits,
    lastCollectedAt: row.lastCollectedAt.getTime(),
  };
}

/** Calculate what workers have produced since last collection, capped by storage and max offline time */
export function calculateOfflineProduction(
  bastionLevel: number,
  workers: BastionWorker[],
  currentStorage: BastionStorage,
  lastCollectedAt: number,
  now: number = Date.now()
): { herbs: number; crystals: number; relics: number; scoutReports: number } {
  const maxHours = BASTION_MAX_OFFLINE_HOURS;
  const elapsedMs = Math.min(now - lastCollectedAt, maxHours * 3600_000);
  const elapsedHours = elapsedMs / 3600_000;

  if (elapsedHours <= 0) return { herbs: 0, crystals: 0, relics: 0, scoutReports: 0 };

  const limits = getStorageLimits(bastionLevel);
  let herbs = 0;
  let crystals = 0;
  let scoutReports = 0;

  for (const w of workers) {
    const mult = Math.pow(WORKER_LEVEL_MULTIPLIER, w.level);
    switch (w.type) {
      case 'herbalist':
        herbs += WORKER_HERB_RATE * mult * elapsedHours;
        break;
      case 'miner':
        crystals += WORKER_CRYSTAL_RATE * mult * elapsedHours;
        break;
      case 'scout':
        scoutReports += WORKER_SCOUT_RATE * mult * elapsedHours;
        break;
      // scholar produces XP — future
    }
  }

  // Cap at storage limits minus current contents
  herbs = Math.min(Math.floor(herbs), limits.maxHerbs - currentStorage.herbs);
  crystals = Math.min(Math.floor(crystals), limits.maxCrystals - currentStorage.crystals);
  scoutReports = Math.min(Math.floor(scoutReports), limits.maxScoutReports - currentStorage.scoutReports);

  return {
    herbs: Math.max(0, herbs),
    crystals: Math.max(0, crystals),
    relics: 0, // relics not produced by workers
    scoutReports: Math.max(0, scoutReports),
  };
}

/** Apply pending offline production to bastion storage */
async function applyOfflineProduction(bastionRow: typeof bastions.$inferSelect): Promise<typeof bastions.$inferSelect> {
  const workers = await getWorkers(bastionRow.id);
  const storage = toBastionStorage(bastionRow);
  const production = calculateOfflineProduction(
    bastionRow.level,
    workers,
    storage,
    bastionRow.lastCollectedAt.getTime()
  );

  if (production.herbs === 0 && production.crystals === 0 && production.scoutReports === 0) {
    return bastionRow;
  }

  const updated = await db
    .update(bastions)
    .set({
      storageHerbs: bastionRow.storageHerbs + production.herbs,
      storageCrystals: bastionRow.storageCrystals + production.crystals,
      storageScoutReports: bastionRow.storageScoutReports + production.scoutReports,
      lastCollectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bastions.id, bastionRow.id))
    .returning();

  return updated[0];
}

async function getWorkers(bastionId: string): Promise<BastionWorker[]> {
  const rows = await db
    .select()
    .from(bastionWorkers)
    .where(eq(bastionWorkers.bastionId, bastionId));
  return rows.map(toWorker);
}

/** Get the idle state (workers + storage with pending production applied) */
export async function getBastionIdleState(userId: string): Promise<BastionIdleState | null> {
  const rows = await db.select().from(bastions).where(eq(bastions.userId, userId));
  if (rows.length === 0) return null;

  const updated = await applyOfflineProduction(rows[0]);
  const workers = await getWorkers(updated.id);
  const storage = toBastionStorage(updated);

  return { workers, storage };
}

/** Collect all resources from bastion storage → player balance */
export async function collectBastionStorage(userId: string): Promise<BastionCollectResponse> {
  const rows = await db.select().from(bastions).where(eq(bastions.userId, userId));
  if (rows.length === 0) throw new Error('No bastion found');

  // Apply pending production first
  const updated = await applyOfflineProduction(rows[0]);
  const storage = toBastionStorage(updated);

  const collected: BastionStorage = { ...storage };

  // Credit player balance
  let newBalance: ResourceBalance | null = null;
  if (storage.herbs > 0) {
    newBalance = await addPlayerResource(userId, 'herb', storage.herbs);
  }
  if (storage.crystals > 0) {
    newBalance = await addPlayerResource(userId, 'crystal', storage.crystals);
  }
  if (storage.relics > 0) {
    newBalance = await addPlayerResource(userId, 'relic', storage.relics);
  }

  // Clear storage
  await db
    .update(bastions)
    .set({
      storageHerbs: 0,
      storageCrystals: 0,
      storageRelics: 0,
      storageScoutReports: 0,
      lastCollectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bastions.userId, userId));

  if (!newBalance) {
    newBalance = await getPlayerResourceBalance(userId);
  }

  const limits = getStorageLimits(updated.level);
  const newStorage: BastionStorage = {
    herbs: 0,
    crystals: 0,
    relics: 0,
    scoutReports: 0,
    ...limits,
    lastCollectedAt: Date.now(),
  };

  return { collected, newBalance, newStorage };
}

/** Assign a worker to the bastion */
export async function assignWorker(userId: string, workerType: WorkerType): Promise<BastionWorker> {
  const bastionRows = await db.select().from(bastions).where(eq(bastions.userId, userId));
  if (bastionRows.length === 0) throw new Error('No bastion found');

  const bastion = bastionRows[0];
  const maxSlots = BASTION_WORKER_SLOTS[Math.min(bastion.level, 2)];
  const workers = await getWorkers(bastion.id);

  if (workers.length >= maxSlots) throw new Error('No worker slots available');

  const id = randomUUID();
  await db.insert(bastionWorkers).values({
    id,
    bastionId: bastion.id,
    workerType,
    level: 0,
  });

  return { id, type: workerType, level: 0, assignedAt: Date.now() };
}

/** Remove a worker from the bastion */
export async function removeWorker(userId: string, workerId: string): Promise<void> {
  const bastionRows = await db.select().from(bastions).where(eq(bastions.userId, userId));
  if (bastionRows.length === 0) throw new Error('No bastion found');

  const result = await db
    .delete(bastionWorkers)
    .where(eq(bastionWorkers.id, workerId))
    .returning();

  if (result.length === 0) throw new Error('Worker not found');
  if (result[0].bastionId !== bastionRows[0].id) throw new Error('Worker does not belong to your bastion');
}

/** Upgrade a worker — costs crystals */
export async function upgradeWorker(
  userId: string,
  workerId: string
): Promise<{ worker: BastionWorker; crystalsSpent: number; newBalance: ResourceBalance }> {
  const bastionRows = await db.select().from(bastions).where(eq(bastions.userId, userId));
  if (bastionRows.length === 0) throw new Error('No bastion found');

  const workerRows = await db.select().from(bastionWorkers).where(eq(bastionWorkers.id, workerId));
  if (workerRows.length === 0) throw new Error('Worker not found');
  if (workerRows[0].bastionId !== bastionRows[0].id) throw new Error('Worker does not belong to your bastion');

  const worker = workerRows[0];
  if (worker.level >= 2) throw new Error('Worker is already at max level');

  const nextLevel = worker.level + 1;
  const crystalsCost = WORKER_UPGRADE_CRYSTAL_COSTS[nextLevel];
  const newBalance = await spendCrystals(userId, crystalsCost);
  if (newBalance === null) throw new Error('Not enough crystals');

  await db
    .update(bastionWorkers)
    .set({ level: nextLevel })
    .where(eq(bastionWorkers.id, workerId));

  return {
    worker: { id: workerId, type: worker.workerType as WorkerType, level: nextLevel, assignedAt: worker.assignedAt.getTime() },
    crystalsSpent: crystalsCost,
    newBalance,
  };
}

/** Passive ghoul drain — called from tick loop. Drains HP from bastions whose owners are offline. */
export async function tickBastionDrain() {
  // Get all bastions with owners who haven't been active in 10+ minutes
  const drainRows = await db.execute(sql`
    SELECT b.id, b.hp, b.max_hp, b.updated_at
    FROM bastions b
    LEFT JOIN player_positions pp ON pp.user_id = b.user_id
    WHERE b.hp > 0
      AND (pp.is_active = false OR pp.last_seen_at < NOW() - INTERVAL '10 minutes' OR pp.user_id IS NULL)
  `);

  if ((drainRows as any[]).length === 0) return;

  // Drain is BASTION_GHOUL_DRAIN_PER_HOUR per hour.
  // Tick runs every ZONE_TICK_INTERVAL (10s). So drain per tick = drain_per_hour * (10/3600)
  const drainPerTick = BASTION_GHOUL_DRAIN_PER_HOUR * (10 / 3600);

  for (const row of drainRows as any[]) {
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
