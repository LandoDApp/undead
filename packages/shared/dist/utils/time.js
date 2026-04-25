import { BLACKOUT_START_HOUR, BLACKOUT_END_HOUR } from '../constants/time.js';
/** Simple sunrise/sunset approximation for Bremen */
export function getSunTimes(date) {
    const dayOfYear = getDayOfYear(date);
    // Simplified calculation for Bremen (~53°N)
    // Day length varies from ~7h (winter) to ~17h (summer)
    const dayLengthHours = 12 + 5 * Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);
    const noon = 12.5; // Solar noon approximately 12:30 in Bremen
    const sunriseHour = noon - dayLengthHours / 2;
    const sunsetHour = noon + dayLengthHours / 2;
    const sunrise = new Date(date);
    sunrise.setHours(Math.floor(sunriseHour), (sunriseHour % 1) * 60, 0, 0);
    const sunset = new Date(date);
    sunset.setHours(Math.floor(sunsetHour), (sunsetHour % 1) * 60, 0, 0);
    return { sunrise, sunset };
}
/** Determine current time of day category */
export function getTimeOfDay(date = new Date()) {
    const hour = date.getHours();
    if (hour >= BLACKOUT_START_HOUR || hour < BLACKOUT_END_HOUR) {
        return 'blackout';
    }
    const { sunrise, sunset } = getSunTimes(date);
    if (date >= sunrise && date <= sunset) {
        return 'day';
    }
    return 'night';
}
/** Check if currently in blackout period */
export function isBlackout(date = new Date()) {
    return getTimeOfDay(date) === 'blackout';
}
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
//# sourceMappingURL=time.js.map