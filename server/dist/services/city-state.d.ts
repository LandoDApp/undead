/** Compute effective radius considering upgrade level and charge */
export declare function computeEffectiveRadius(zone: {
    radius: number;
    upgradeLevel: number;
    charge: number;
    maxCharge: number;
}): number;
export declare function getAllCityStates(): Promise<{
    radius: number;
    baseRadius: number;
    id: string;
    name: string;
    createdAt: Date;
    latitude: number;
    longitude: number;
    charge: number;
    maxCharge: number;
    upgradeLevel: number;
    isFallen: boolean;
    isApproved: boolean;
    suggestedBy: string | null;
}[]>;
export declare function getCityStateById(id: string): Promise<{
    id: string;
    name: string;
    createdAt: Date;
    latitude: number;
    longitude: number;
    radius: number;
    charge: number;
    maxCharge: number;
    upgradeLevel: number;
    isFallen: boolean;
    isApproved: boolean;
    suggestedBy: string | null;
}>;
export declare function enterCityState(userId: string, zoneId: string): Promise<{
    charge: number;
    id: string;
    name: string;
    createdAt: Date;
    latitude: number;
    longitude: number;
    radius: number;
    maxCharge: number;
    upgradeLevel: number;
    isFallen: boolean;
    isApproved: boolean;
    suggestedBy: string | null;
}>;
export declare function exitCityState(userId: string, zoneId: string): Promise<void>;
export declare function reconquerCityState(userId: string, zoneId: string): Promise<{
    isFallen: boolean;
    charge: number;
    id: string;
    name: string;
    createdAt: Date;
    latitude: number;
    longitude: number;
    radius: number;
    maxCharge: number;
    upgradeLevel: number;
    isApproved: boolean;
    suggestedBy: string | null;
}>;
export declare function healCityState(userId: string, zoneId: string, amount: number): Promise<{
    newCharge: number;
    herbsSpent: number;
    newBalance: import("@undead/shared").ResourceBalance;
}>;
export declare function upgradeCityState(userId: string, zoneId: string): Promise<{
    newLevel: number;
    newRadius: number;
    crystalsSpent: number;
    newBalance: import("@undead/shared").ResourceBalance;
}>;
export declare function suggestCityState(userId: string, name: string, latitude: number, longitude: number, radius: number): Promise<`${string}-${string}-${string}-${string}-${string}`>;
export declare function getCityStatePresence(zoneId: string): Promise<import("postgres").RowList<Record<string, unknown>[]>>;
//# sourceMappingURL=city-state.d.ts.map