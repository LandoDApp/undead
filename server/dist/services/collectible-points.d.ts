/**
 * @deprecated — Use resources.ts instead.
 * This file provides legacy functions for backward compatibility with points.ts route.
 */
import { getPlayerBalance as _getPlayerBalance, addPlayerPoints as _addPlayerPoints, spendPlayerPoints as _spendPlayerPoints } from './resources.js';
import type { Coordinate, CollectiblePoint } from '@undead/shared';
export { _getPlayerBalance as getPlayerBalance };
export { _addPlayerPoints as addPlayerPoints };
export { _spendPlayerPoints as spendPlayerPoints };
/** @deprecated Use getOrCreateResourcesInArea from resources.ts */
export declare function getOrCreatePointsInArea(center: Coordinate, radiusM: number): Promise<CollectiblePoint[]>;
/** @deprecated Use collectResource from resources.ts */
export declare function collectPoint(userId: string, pointId: string, playerLat: number, playerLon: number): Promise<{
    collected: boolean;
    pointsEarned: number;
    newBalance: number;
}>;
//# sourceMappingURL=collectible-points.d.ts.map