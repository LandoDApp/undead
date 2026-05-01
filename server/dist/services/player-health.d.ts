import type { PlayerHealthState } from '@undead/shared';
/** Get or initialize health state for a player */
export declare function getHealthState(userId: string): Promise<PlayerHealthState>;
/** Validate a ghoul catch and apply damage */
export declare function processGhoulCatch(userId: string, ghoulLat: number, ghoulLon: number, playerLat: number, playerLon: number): Promise<{
    hit: boolean;
    totalHits: number;
    isDown: boolean;
    downUntil: number | null;
}>;
/** Revive a player (reset health) */
export declare function revivePlayer(userId: string): Promise<PlayerHealthState>;
//# sourceMappingURL=player-health.d.ts.map