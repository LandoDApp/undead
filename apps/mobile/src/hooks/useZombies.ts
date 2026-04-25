import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useZoneStore } from '@/stores/zone';
import { api } from '@/services/api';
import {
  ZOMBIE_SPEED_DAY,
  ZOMBIE_SPEED_NIGHT,
  ZOMBIE_DETECTION_DAY,
  ZOMBIE_DETECTION_NIGHT,
  ZOMBIE_CAUGHT_DISTANCE,
  ZOMBIE_ROUTE_COOLDOWN,
  ZOMBIE_MAX_CONCURRENT_ROUTES,
  ZOMBIE_ZONE_TARGET_RANGE,
  ZOMBIE_SYNC_INTERVAL,
} from '@undead/shared';
import { distanceMeters, pointAtDistance } from '@undead/shared';
import type { ZombieState, ServerZombie, Coordinate, SafeZone } from '@undead/shared';

/** Convert server zombies to client ZombieState, preserving existing animated positions */
function reconcileZombies(
  localZombies: ZombieState[],
  serverZombies: ServerZombie[],
  timeOfDay: string
): ZombieState[] {
  const localMap = new Map(localZombies.map((z) => [z.id, z]));
  const result: ZombieState[] = [];

  for (const sz of serverZombies) {
    const existing = localMap.get(sz.id);
    if (existing) {
      // Keep local animated position
      result.push(existing);
    } else {
      // New zombie from server — add at spawn position
      result.push({
        id: sz.id,
        position: { latitude: sz.latitude, longitude: sz.longitude },
        routePoints: [],
        routeIndex: 0,
        speedKmh: timeOfDay === 'night' ? ZOMBIE_SPEED_NIGHT : ZOMBIE_SPEED_DAY,
        detectionRange: timeOfDay === 'night' ? ZOMBIE_DETECTION_NIGHT : ZOMBIE_DETECTION_DAY,
        lastRouteUpdate: 0,
        frozen: false,
      });
    }
  }

  // Zombies only local (not on server) are dropped — dead or out of range
  return result;
}

/** Push a position out of any non-fallen zone, returning position on zone edge */
function clampOutsideZones(pos: Coordinate, zones: SafeZone[]): { position: Coordinate; blocked: boolean } {
  for (const zone of zones) {
    if (zone.isFallen) continue;
    const zoneCenter = { latitude: zone.latitude, longitude: zone.longitude };
    const dist = distanceMeters(pos, zoneCenter);
    if (dist < zone.radius) {
      // Inside zone — push to edge
      // Calculate bearing from zone center to zombie
      const dLat = pos.latitude - zoneCenter.latitude;
      const dLon = pos.longitude - zoneCenter.longitude;
      const bearing = (Math.atan2(dLon * Math.cos(zoneCenter.latitude * Math.PI / 180), dLat) * 180) / Math.PI;
      const edgePos = pointAtDistance(zoneCenter, zone.radius + 2, bearing);
      return { position: edgePos, blocked: true };
    }
  }
  return { position: pos, blocked: false };
}

export function useZombies() {
  const { zombies, timeOfDay, isGameActive, isInSafeZone, isDown, setZombies, updateZombie } =
    useGameStore();
  const position = useLocationStore((s) => s.position);
  const animFrameRef = useRef<number | null>(null);
  const pendingRoutesRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const fetchedRef = useRef(false);

  // Sync health from server on mount
  useEffect(() => {
    useGameStore.getState().syncHealth();
  }, []);

  // Reset fetch flag when game stops
  useEffect(() => {
    if (!isGameActive) {
      fetchedRef.current = false;
    }
  }, [isGameActive]);

  // Fetch nearby zombies from server when game is active and we have a position
  useEffect(() => {
    if (!isGameActive || !position || fetchedRef.current || timeOfDay === 'blackout') return;

    fetchedRef.current = true;
    api.zombies
      .nearby(position.latitude, position.longitude)
      .then((res) => {
        if (res.success && res.data) {
          const currentTod = useGameStore.getState().timeOfDay;
          const currentZombies = useGameStore.getState().zombies;
          setZombies(reconcileZombies(currentZombies, res.data.zombies, currentTod));
        }
      });
  }, [isGameActive, position, timeOfDay]);

  // Periodic sync — re-fetch nearby zombies every ZOMBIE_SYNC_INTERVAL
  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(() => {
      const pos = useLocationStore.getState().position;
      const tod = useGameStore.getState().timeOfDay;
      const active = useGameStore.getState().isGameActive;
      if (!active || !pos || tod === 'blackout') return;

      api.zombies
        .nearby(pos.latitude, pos.longitude)
        .then((res) => {
          if (res.success && res.data) {
            const currentZombies = useGameStore.getState().zombies;
            const currentTod = useGameStore.getState().timeOfDay;
            setZombies(reconcileZombies(currentZombies, res.data.zombies, currentTod));
          }
        });
    }, ZOMBIE_SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isGameActive]);

  // Blackout: remove all zombies
  useEffect(() => {
    if (timeOfDay === 'blackout') {
      setZombies([]);
      fetchedRef.current = false;
    }
  }, [timeOfDay]);

  // Freeze/unfreeze zombies in safe zone
  useEffect(() => {
    zombies.forEach((z) => {
      if (z.frozen !== isInSafeZone) {
        updateZombie(z.id, { frozen: isInSafeZone });
      }
    });
  }, [isInSafeZone]);

  // Animation loop — move zombies along routes
  // Batches all position updates into a single setZombies() per frame
  useEffect(() => {
    function tick() {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      const playerPos = useLocationStore.getState().position;
      const currentZombies = useGameStore.getState().zombies;
      const tod = useGameStore.getState().timeOfDay;
      const paused = useGameStore.getState().isPaused;
      const playerDown = useGameStore.getState().isDown;
      const zones = useZoneStore.getState().zones;

      const gameActive = useGameStore.getState().isGameActive;

      if (!gameActive || paused || tod === 'blackout' || !playerPos || playerDown) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const caughtIds = new Set<string>();
      const updated: ZombieState[] = [];

      for (const zombie of currentZombies) {
        let z = zombie;

        if (!z.frozen) {
          // Move along route
          if (z.routePoints.length > 0 && z.routeIndex < z.routePoints.length - 1) {
            const speedMs = (z.speedKmh * 1000) / 3600; // m/s
            const distToMove = speedMs * (deltaMs / 1000);

            let remaining = distToMove;
            let idx = z.routeIndex;
            let currentPos = z.position;

            while (remaining > 0 && idx < z.routePoints.length - 1) {
              const next = z.routePoints[idx + 1];
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

            // Zone boundary collision — stop zombie at zone edge
            const clamped = clampOutsideZones(currentPos, zones);
            if (clamped.blocked) {
              // Zombie hit zone edge — stop route, stay at edge
              z = { ...z, position: clamped.position, routePoints: [], routeIndex: 0 };
            } else {
              z = { ...z, position: currentPos, routeIndex: idx };
            }
          }

          // Check if caught player
          const dist = distanceMeters(z.position, playerPos);
          if (dist < ZOMBIE_CAUGHT_DISTANCE) {
            caughtIds.add(z.id);

            // Report catch to server
            api.zombies
              .catch({
                zombieId: z.id,
                zombieLat: z.position.latitude,
                zombieLon: z.position.longitude,
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
          const inDetectionRange = dist < zombie.detectionRange;
          const routeCooldownReady = now - z.lastRouteUpdate > ZOMBIE_ROUTE_COOLDOWN;
          const routeSlotAvailable = pendingRoutesRef.current < ZOMBIE_MAX_CONCURRENT_ROUTES;

          if (inDetectionRange && routeCooldownReady && routeSlotAvailable) {
            pendingRoutesRef.current++;
            z = { ...z, lastRouteUpdate: now };
            const zId = z.id;

            api.zombies
              .getRoute({
                zombieLat: z.position.latitude,
                zombieLon: z.position.longitude,
                playerLat: playerPos.latitude,
                playerLon: playerPos.longitude,
              })
              .then((res) => {
                pendingRoutesRef.current--;
                if (res.success && res.data) {
                  updateZombie(zId, { routePoints: res.data.route, routeIndex: 0 });
                }
              })
              .catch(() => {
                pendingRoutesRef.current--;
              });
          } else if (
            !inDetectionRange &&
            routeCooldownReady &&
            routeSlotAvailable &&
            z.routeIndex >= z.routePoints.length - 1
          ) {
            let nearestZoneTarget: { latitude: number; longitude: number } | null = null;
            let nearestDist = ZOMBIE_ZONE_TARGET_RANGE;

            for (const zone of zones) {
              if (zone.isFallen) continue;
              const zoneCenter = { latitude: zone.latitude, longitude: zone.longitude };
              const zoneDist = distanceMeters(z.position, zoneCenter);
              if (zoneDist < nearestDist) {
                nearestDist = zoneDist;
                // Route to zone EDGE, not center — bearing from zone to zombie
                const dLat = z.position.latitude - zoneCenter.latitude;
                const dLon = z.position.longitude - zoneCenter.longitude;
                const bearing = (Math.atan2(dLon * Math.cos(zoneCenter.latitude * Math.PI / 180), dLat) * 180) / Math.PI;
                nearestZoneTarget = pointAtDistance(zoneCenter, zone.radius + 2, bearing);
              }
            }

            if (nearestZoneTarget) {
              pendingRoutesRef.current++;
              z = { ...z, lastRouteUpdate: now };
              const zId = z.id;

              api.zombies
                .getRoute({
                  zombieLat: z.position.latitude,
                  zombieLon: z.position.longitude,
                  playerLat: nearestZoneTarget.latitude,
                  playerLon: nearestZoneTarget.longitude,
                })
                .then((res) => {
                  pendingRoutesRef.current--;
                  if (res.success && res.data) {
                    updateZombie(zId, { routePoints: res.data.route, routeIndex: 0 });
                  }
                })
                .catch(() => {
                  pendingRoutesRef.current--;
                });
            }
          }
        }

        updated.push(z);
      }

      // Single state write per frame
      if (caughtIds.size > 0) {
        setZombies(updated.filter((z) => !caughtIds.has(z.id)));
      } else {
        setZombies(updated);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);
}
