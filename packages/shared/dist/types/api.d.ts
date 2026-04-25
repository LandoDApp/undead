export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
export interface SafeZone {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    charge: number;
    isFallen: boolean;
    isApproved: boolean;
    createdAt: string;
    baseRadius: number;
    maxCharge: number;
    upgradeLevel: number;
}
export interface SafeZonePresence {
    zoneId: string;
    players: Array<{
        displayName: string;
        lastSeenAt: string;
    }>;
    currentCount: number;
}
export interface ZoneVisitEvent {
    type: 'enter' | 'exit';
    zoneId: string;
}
export interface ZoneSuggestion {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
}
export interface LegalPage {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
}
//# sourceMappingURL=api.d.ts.map