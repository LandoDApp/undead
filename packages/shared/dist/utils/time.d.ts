import type { TimeOfDay } from '../types/game.js';
/** Simple sunrise/sunset approximation for Bremen */
export declare function getSunTimes(date: Date): {
    sunrise: Date;
    sunset: Date;
};
/** Determine current time of day category */
export declare function getTimeOfDay(date?: Date): TimeOfDay;
/** Check if currently in blackout period */
export declare function isBlackout(date?: Date): boolean;
//# sourceMappingURL=time.d.ts.map