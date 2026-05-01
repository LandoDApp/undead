import type { Bastion, ResourceBalance } from '@undead/shared';
/** Get a player's bastion (max 1 per player) */
export declare function getPlayerBastion(userId: string): Promise<Bastion | null>;
/** Create a bastion — max 1 per player */
export declare function createBastion(userId: string, name: string, latitude: number, longitude: number): Promise<Bastion>;
/** Upgrade bastion — costs crystals, increases level and max HP */
export declare function upgradeBastion(userId: string): Promise<{
    bastion: Bastion;
    crystalsSpent: number;
    newBalance: ResourceBalance;
}>;
/** Heal bastion — costs herbs */
export declare function healBastion(userId: string, amount: number): Promise<{
    newHp: number;
    herbsSpent: number;
    newBalance: ResourceBalance;
}>;
/** Friend reinforces a bastion — gives bonus HP */
export declare function reinforceBastion(bastionId: string, friendId: string): Promise<{
    newHp: number;
    bonusHp: number;
}>;
/** Get bastions nearby a position */
export declare function getNearbyBastions(lat: number, lon: number, radiusM: number): Promise<Bastion[]>;
/** Passive ghoul drain — called from tick loop. Drains HP from bastions whose owners are offline. */
export declare function tickBastionDrain(): Promise<void>;
//# sourceMappingURL=bastion.d.ts.map