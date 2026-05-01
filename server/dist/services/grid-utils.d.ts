import type { Coordinate } from '@undead/shared';
/** Compute grid cell key for a coordinate (~500m cells) */
export declare function gridCell(lat: number, lon: number): string;
/** Get all grid cells within a bounding box around center */
export declare function getCellsInRadius(center: Coordinate, radiusM: number): string[];
/** Get center coordinate of a grid cell */
export declare function cellCenter(cellKey: string): Coordinate;
//# sourceMappingURL=grid-utils.d.ts.map