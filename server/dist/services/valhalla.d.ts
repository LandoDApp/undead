import type { Coordinate, RoutePoint } from '@undead/shared';
/** Snap a coordinate to the nearest pedestrian network edge */
export declare function locateOnNetwork(coord: Coordinate): Promise<Coordinate | null>;
/** Get a pedestrian route between two points */
export declare function getRoute(from: Coordinate, to: Coordinate): Promise<{
    route: RoutePoint[];
    distanceMeters: number;
    durationSeconds: number;
} | null>;
//# sourceMappingURL=valhalla.d.ts.map