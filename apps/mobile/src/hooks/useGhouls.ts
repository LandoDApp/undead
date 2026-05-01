import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useCityStateStore } from '@/stores/zone';
import { api } from '@/services/api';
import {
  GHOUL_SPEED_DAY,
  GHOUL_SPEED_NIGHT,
  GHOUL_DETECTION_DAY,
  GHOUL_DETECTION_NIGHT,
  GHOUL_CAUGHT_DISTANCE,
  GHOUL_ROUTE_COOLDOWN,
  GHOUL_MAX_CONCURRENT_ROUTES,
  GHOUL_ZONE_TARGET_RANGE,
  GHOUL_SYNC_INTERVAL,
} from '@undead/shared';
import { distanceMeters, pointAtDistance } from '@undead/shared';
import type { GhoulState, ServerGhoul, Coordinate, CityState } from '@undead/shared';

/** Convert server ghouls to client GhoulState, preserving existing animated positions */
function reconcileGhouls(
  localGhouls: GhoulState[],
  serverGhouls: ServerGhoul[],
  timeOfDay: string
): GhoulState[] {
  const localMap = new Map(localGhouls.map((g) => [g.id, g]));
  const result: GhoulState[] = [];

  for (const sg of serverGhouls) {
    const existing = localMap.get(sg.id);
    if (existing) {
      // Keep local animated position
      result.push(existing);
    } else {
      // New ghoul from server — add at spawn position
      result.push({
        id: sg.id,
        position: { latitude: sg.latitude, longitude: sg.longitude },
        routePoints: [],
        routeIndex: 0,
        speedKmh: timeOfDay === 'night' ? GHOUL_SPEED_NIGHT : GHOUL_SPEED_DAY,
        detectionRange: timeOfDay === 'night' ? GHOUL_DETECTION_NIGHT : GHOUL_DETECTION_DAY,
        lastRouteUpdate: 0,
        frozen: false,
      });
    }
  }

  // Ghouls only local (not on server) are dropped — dead or out of range
  return result;
}

/** Push a position out of any non-fallen city-state, returning position on zone edge */
function clampOutsideCityStates(pos: Coordinate, zones: CityState[]): { position: Coordinate; blocked: boolean } {
  for (const zone of zones) {
    if (zone.isFallen) continue;
    const zoneCenter = { latitude: zone.latitude, longitude: zone.longitude };
    const dist = distanceMeters(pos, zoneCenter);
    if (dist < zone.radius) {
      // Inside zone — push to edge
      const dLat = pos.latitude - zoneCenter.latitude;
      const dLon = pos.longitude - zoneCenter.longitude;
      const bearing = (Math.atan2(dLon * Math.cos(zoneCenter.latitude * Math.PI / 180), dLat) * 180) / Math.PI;
      const edgePos = pointAtDistance(zoneCenter, zone.radius + 2, bearing);
      return { position: edgePos, blocked: true };
    }
  }
  return { position: pos, blocked: false };
}

export function useGhouls() {
  const { ghouls, timeOfDay, isInCityState, isDown, setGhouls, updateGhoul, gameMode } =
    useGameStore();
  const position = useLocationStore((s) => s.position);
  const animFrameRef = useRef<number | null>(null);
  const pendingRoutesRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const fetchedRef = useRef(false);
  const isJagd = gameMode === 'jagd';

  // Sync health from server on mount
  useEffect(() => {
    useGameStore.getState().syncHealth();
  }, []);

  // Reset fetch flag when leaving jagd mode
  useEffect(() => {
    if (!isJagd) {
      fetchedRef.current = false;
    }
  }, [isJagd]);

  // Fetch nearby ghouls from server when in jagd mode and we have a position
  useEffect(() => {
    if (!isJagd || !position || fetchedRef.current || timeOfDay === 'blackout') return;

    fetchedRef.current = true;
    api.ghouls
      .nearby(position.latitude, position.longitude)
      .then((res) => {
        if (res.success && res.data) {
          const currentTod = useGameStore.getState().timeOfDay;
          const currentGhouls = useGameStore.getState().ghouls;
          setGhouls(reconcileGhouls(currentGhouls, res.data.ghouls, currentTod));
        }
      });
  }, [isJagd, position, timeOfDay]);

  // Periodic sync — re-fetch nearby ghouls every GHOUL_SYNC_INTERVAL
  useEffect(() => {
    if (!isJagd) return;

    const interval = setInterval(() => {
      const pos = useLocationStore.getState().position;
      const tod = useGameStore.getState().timeOfDay;
      const mode = useGameStore.getState().gameMode;
      if (mode !== 'jagd' || !pos || tod === 'blackout') return;

      api.ghouls
        .nearby(pos.latitude, pos.longitude)
        .then((res) => {
          if (res.success && res.data) {
            const currentGhouls = useGameStore.getState().ghouls;
            const currentTod = useGameStore.getState().timeOfDay;
            setGhouls(reconcileGhouls(currentGhouls, res.data.ghouls, currentTod));
          }
        });
    }, GHOUL_SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isJagd]);

  // Blackout: remove all ghouls
  useEffect(() => {
    if (timeOfDay === 'blackout') {
      setGhouls([]);
      fetchedRef.current = false;
    }
  }, [timeOfDay]);

  // Freeze/unfreeze ghouls in city-state
  useEffect(() => {
    ghouls.forEach((g) => {
      if (g.frozen !== isInCityState) {
        updateGhoul(g.id, { frozen: isInCityState });
      }
    });
  }, [isInCityState]);

  // Animation loop — move ghouls along routes
  // Batches all position updates into a single setGhouls() per frame
  useEffect(() => {
    function tick() {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      const playerPos = useLocationStore.getState().position;
      const currentGhouls = useGameStore.getState().ghouls;
      const tod = useGameStore.getState().timeOfDay;
      const playerDown = useGameStore.getState().isDown;
      const zones = useCityStateStore.getState().cityStates;

      const mode = useGameStore.getState().gameMode;

      if (mode !== 'jagd' || tod === 'blackout' || !playerPos || playerDown) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const caughtIds = new Set<string>();
      const updated: GhoulState[] = [];

      for (const ghoul of currentGhouls) {
        let g = ghoul;

        if (!g.frozen) {
          // Move along route
          if (g.routePoints.length > 0 && g.routeIndex < g.routePoints.length - 1) {
            const speedMs = (g.speedKmh * 1000) / 3600; // m/s
            const distToMove = speedMs * (deltaMs / 1000);

            let remaining = distToMove;
            let idx = g.routeIndex;
            let currentPos = g.position;

            while (remaining > 0 && idx < g.routePoints.length - 1) {
              const next = g.routePoints[idx + 1];
              const segDist = distanceMeters(currentPos, next);

              if (segDist <= remaining) {
                remaining -= segDist;
                currentPos = next;
                idx++;
              } else {
                const ratio = remaining / segDist;
                currentPos = {
                  latitude: currentPos.latitude + (next.latitude - currentPos.latitude) * ratio,
                  longitude: currentPos.longitude + (next.longitude - currentPos.longitude) * ratio,
                };
                remaining = 0;
              }
            }

            // City-state boundary collision — stop ghoul at zone edge
            const clamped = clampOutsideCityStates(currentPos, zones);
            if (clamped.blocked) {
              g = { ...g, position: clamped.position, routePoints: [], routeIndex: 0 };
            } else {
              g = { ...g, position: currentPos, routeIndex: idx };
            }
          }

          // Check if caught player
          const dist = distanceMeters(g.position, playerPos);
          if (dist < GHOUL_CAUGHT_DISTANCE) {
            caughtIds.add(g.id);

            // Report catch to server
            api.ghouls
              .catch({
                ghoulId: g.id,
                ghoulLat: g.position.latitude,
                ghoulLon: g.position.longitude,
                playerLat: playerPos.latitude,
                playerLon: playerPos.longitude,
              })
              .then((res) => {
                if (res.success && res.data) {
                  useGameStore.getState().applyServerHit(res.data);
                }
              });
            continue;
          }

          // Request new route if needed
          const inDetectionRange = dist < ghoul.detectionRange;
          const routeCooldownReady = now - g.lastRouteUpdate > GHOUL_ROUTE_COOLDOWN;
          const routeSlotAvailable = pendingRoutesRef.current < GHOUL_MAX_CONCURRENT_ROUTES;

          if (inDetectionRange && routeCooldownReady && routeSlotAvailable) {
            pendingRoutesRef.current++;
            g = { ...g, lastRouteUpdate: now };
            const gId = g.id;

            api.ghouls
              .getRoute({
                ghoulLat: g.position.latitude,
                ghoulLon: g.position.longitude,
                playerLat: playerPos.latitude,
                playerLon: playerPos.longitude,
              })
              .then((res) => {
                pendingRoutesRef.current--;
                if (res.success && res.data) {
                  updateGhoul(gId, { routePoints: res.data.route, routeIndex: 0 });
                }
              })
              .catch(() => {
                pendingRoutesRef.current--;
              });
          } else if (
            !inDetectionRange &&
            routeCooldownReady &&
            routeSlotAvailable &&
            g.routeIndex >= g.routePoints.length - 1
          ) {
            let nearestZoneTarget: { latitude: number; longitude: number } | null = null;
            let nearestDist = GHOUL_ZONE_TARGET_RANGE;

            for (const zone of zones) {
              if (zone.isFallen) continue;
              const zoneCenter = { latitude: zone.latitude, longitude: zone.longitude };
              const zoneDist = distanceMeters(g.position, zoneCenter);
              if (zoneDist < nearestDist) {
                nearestDist = zoneDist;
                // Route to zone EDGE, not center — bearing from zone to ghoul
                const dLat = g.position.latitude - zoneCenter.latitude;
                const dLon = g.position.longitude - zoneCenter.longitude;
                const bearing = (Math.atan2(dLon * Math.cos(zoneCenter.latitude * Math.PI / 180), dLat) * 180) / Math.PI;
                nearestZoneTarget = pointAtDistance(zoneCenter, zone.radius + 2, bearing);
              }
            }

            if (nearestZoneTarget) {
              pendingRoutesRef.current++;
              g = { ...g, lastRouteUpdate: now };
              const gId = g.id;

              api.ghouls
                .getRoute({
                  ghoulLat: g.position.latitude,
                  ghoulLon: g.position.longitude,
                  playerLat: nearestZoneTarget.latitude,
                  playerLon: nearestZoneTarget.longitude,
                })
                .then((res) => {
                  pendingRoutesRef.current--;
                  if (res.success && res.data) {
                    updateGhoul(gId, { routePoints: res.data.route, routeIndex: 0 });
                  }
                })
                .catch(() => {
                  pendingRoutesRef.current--;
                });
            }
          }
        }

        updated.push(g);
      }

      // Single state write per frame
      if (caughtIds.size > 0) {
        setGhouls(updated.filter((g) => !caughtIds.has(g.id)));
      } else {
        setGhouls(updated);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);
}
