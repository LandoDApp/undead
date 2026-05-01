export declare function updatePosition(userId: string, latitude: number, longitude: number, accuracy: number): Promise<void>;
export declare function getProfile(userId: string): Promise<{
    id: string;
    displayName: string;
    email: string;
}>;
export declare function updateProfile(userId: string, displayName: string): Promise<void>;
export declare function registerPushToken(userId: string, token: string, platform: string): Promise<void>;
export declare function setInactive(userId: string): Promise<void>;
//# sourceMappingURL=player.d.ts.map