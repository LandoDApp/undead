const EARTH_RADIUS_M = 6_371_000;
/** Haversine distance between two points in meters */
export function distanceMeters(a, b) {
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return EARTH_RADIUS_M * c;
}
/** Check if a point is within radius of a center point */
export function isWithinRadius(point, center, radiusMeters) {
    return distanceMeters(point, center) <= radiusMeters;
}
/** Generate a random point at a given distance and bearing from origin */
export function pointAtDistance(origin, distanceM, bearingDeg) {
    const d = distanceM / EARTH_RADIUS_M;
    const brng = toRad(bearingDeg);
    const lat1 = toRad(origin.latitude);
    const lon1 = toRad(origin.longitude);
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
    const lon2 = lon1 +
        Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return {
        latitude: toDeg(lat2),
        longitude: toDeg(lon2),
    };
}
/** Interpolate between two coordinates by factor t (0-1) */
export function interpolateCoord(a, b, t) {
    return {
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
    };
}
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
function toDeg(rad) {
    return (rad * 180) / Math.PI;
}
//# sourceMappingURL=geo.js.map