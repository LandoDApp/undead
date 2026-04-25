import type { Coordinate } from '../types/game.js';
/** Haversine distance between two points in meters */
export declare function distanceMeters(a: Coordinate, b: Coordinate): number;
/** Check if a point is within radius of a center point */
export declare function isWithinRadius(point: Coordinate, center: Coordinate, radiusMeters: number): boolean;
/** Generate a random point at a given distance and bearing from origin */
export declare function pointAtDistance(origin: Coordinate, distanceM: number, bearingDeg: number): Coordinate;
/** Interpolate between two coordinates by factor t (0-1) */
export declare function interpolateCoord(a: Coordinate, b: Coordinate, t: number): Coordinate;
//# sourceMappingURL=geo.d.ts.map