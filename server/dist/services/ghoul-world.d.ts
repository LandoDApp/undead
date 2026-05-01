import type { Coordinate, ServerGhoul } from '@undead/shared';
import { gridCell } from './grid-utils.js';
export { gridCell };
/** Get or create ghouls in the area around center within radius */
export declare function getOrCreateGhoulsInArea(center: Coordinate, radiusM: number): Promise<ServerGhoul[]>;
/** Kill a ghoul — mark as dead with respawn timer */
export declare function killGhoul(ghoulId: string): Promise<boolean>;
//# sourceMappingURL=ghoul-world.d.ts.map