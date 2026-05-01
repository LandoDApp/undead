/**
 * @deprecated — Use resources.ts instead.
 * This file provides legacy functions for backward compatibility with points.ts route.
 */
import {
  getOrCreateResourcesInArea,
  getPlayerBalance as _getPlayerBalance,
  addPlayerPoints as _addPlayerPoints,
  spendPlayerPoints as _spendPlayerPoints,
  collectResource,
} from './resources.js';
import type { Coordinate, CollectiblePoint } from '@undead/shared';

export { _getPlayerBalance as getPlayerBalance };
export { _addPlayerPoints as addPlayerPoints };
export { _spendPlayerPoints as spendPlayerPoints };

/** @deprecated Use getOrCreateResourcesInArea from resources.ts */
export async function getOrCreatePointsInArea(
  center: Coordinate,
  radiusM: number
): Promise<CollectiblePoint[]> {
  const resources = await getOrCreateResourcesInArea(center, radiusM);
  return resources.map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    value: r.value,
    expiresAt: r.expiresAt,
  }));
}

/** @deprecated Use collectResource from resources.ts */
export async function collectPoint(
  userId: string,
  pointId: string,
  playerLat: number,
  playerLon: number
): Promise<{ collected: boolean; pointsEarned: number; newBalance: number }> {
  const result = await collectResource(userId, pointId, playerLat, playerLon);
  return {
    collected: result.collected,
    pointsEarned: result.amount,
    newBalance: result.newBalance.herbs + result.newBalance.crystals + result.newBalance.relics,
  };
}
