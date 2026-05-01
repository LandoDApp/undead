const EARTH_RADIUS_M = 6_371_000;
/** Compute grid cell key for a coordinate (~500m cells) */
export function gridCell(lat, lon) {
    return `${Math.floor(lat * 200)}:${Math.floor(lon * 200)}`;
}
/** Get all grid cells within a bounding box around center */
export function getCellsInRadius(center, radiusM) {
    const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
    const dLon = dLat / Math.cos((center.latitude * Math.PI) / 180);
    const minLat = center.latitude - dLat;
    const maxLat = center.latitude + dLat;
    const minLon = center.longitude - dLon;
    const maxLon = center.longitude + dLon;
    const cells = [];
    const minCellLat = Math.floor(minLat * 200);
    const maxCellLat = Math.floor(maxLat * 200);
    const minCellLon = Math.floor(minLon * 200);
    const maxCellLon = Math.floor(maxLon * 200);
    for (let cLat = minCellLat; cLat <= maxCellLat; cLat++) {
        for (let cLon = minCellLon; cLon <= maxCellLon; cLon++) {
            cells.push(`${cLat}:${cLon}`);
        }
    }
    return cells;
}
/** Get center coordinate of a grid cell */
export function cellCenter(cellKey) {
    const [latStr, lonStr] = cellKey.split(':');
    return {
        latitude: (parseInt(latStr) + 0.5) / 200,
        longitude: (parseInt(lonStr) + 0.5) / 200,
    };
}
//# sourceMappingURL=grid-utils.js.map