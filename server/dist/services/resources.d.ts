import type { Coordinate, Resource, ResourceType, ResourceBalance } from '@undead/shared';
/** Delete expired and collected resources, then fill underpopulated cells near ghouls */
export declare function getOrCreateResourcesInArea(center: Coordinate, radiusM: number): Promise<Resource[]>;
/** Collect a resource — validate distance, mark collected, credit balance */
export declare function collectResource(userId: string, resourceId: string, playerLat: number, playerLon: number): Promise<{
    collected: boolean;
    type: ResourceType;
    amount: number;
    newBalance: ResourceBalance;
}>;
/** Add a specific resource type to player balance (upsert) */
export declare function addPlayerResource(userId: string, type: ResourceType, amount: number): Promise<ResourceBalance>;
/** Spend herbs — returns new balance or null if insufficient */
export declare function spendHerbs(userId: string, amount: number): Promise<ResourceBalance | null>;
/** Spend crystals — returns new balance or null if insufficient */
export declare function spendCrystals(userId: string, amount: number): Promise<ResourceBalance | null>;
/** Get player resource balance */
export declare function getPlayerResourceBalance(userId: string): Promise<ResourceBalance>;
/** @deprecated Use getPlayerResourceBalance */
export declare function getPlayerBalance(userId: string): Promise<{
    totalPoints: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
}>;
/** @deprecated Use addPlayerResource */
export declare function addPlayerPoints(userId: string, amount: number): Promise<number>;
/** @deprecated Use spendHerbs / spendCrystals */
export declare function spendPlayerPoints(userId: string, amount: number): Promise<number | null>;
//# sourceMappingURL=resources.d.ts.map