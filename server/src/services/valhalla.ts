import { env } from '../config/env.js';
import type { Coordinate, RoutePoint } from '@undead/shared';

interface ValhallaLocateResponse {
  edges: Array<{
    correlated_lat: number;
    correlated_lon: number;
  }>;
}

interface ValhallaRouteResponse {
  trip: {
    legs: Array<{
      shape: string;
      summary: {
        length: number; // km
        time: number; // seconds
      };
    }>;
  };
}

/** Snap a coordinate to the nearest pedestrian network edge */
export async function locateOnNetwork(coord: Coordinate): Promise<Coordinate | null> {
  const body = {
    locations: [{ lat: coord.latitude, lon: coord.longitude }],
    costing: 'pedestrian',
    verbose: false,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${env.VALHALLA_URL}/locate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = (await res.json()) as ValhallaLocateResponse[];
    if (!data[0]?.edges?.[0]) return null;

    const edge = data[0].edges[0];
    return {
      latitude: edge.correlated_lat,
      longitude: edge.correlated_lon,
    };
  } catch {
    return null;
  }
}

/** Get a pedestrian route between two points */
export async function getRoute(
  from: Coordinate,
  to: Coordinate
): Promise<{ route: RoutePoint[]; distanceMeters: number; durationSeconds: number } | null> {
  const body = {
    locations: [
      { lat: from.latitude, lon: from.longitude, type: 'break' },
      { lat: to.latitude, lon: to.longitude, type: 'break' },
    ],
    costing: 'pedestrian',
    directions_options: { units: 'kilometers' },
  };

  try {
    const res = await fetch(`${env.VALHALLA_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as ValhallaRouteResponse;
    const leg = data.trip.legs[0];
    if (!leg) return null;

    const route = decodePolyline(leg.shape);
    return {
      route,
      distanceMeters: leg.summary.length * 1000,
      durationSeconds: leg.summary.time,
    };
  } catch {
    return null;
  }
}

/** Decode Valhalla's encoded polyline (precision 6) */
function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lon += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      latitude: lat / 1e6,
      longitude: lon / 1e6,
    });
  }

  return points;
}
