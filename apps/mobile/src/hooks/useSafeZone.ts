import { useEffect, useRef } from 'react';
import { useLocationStore } from '@/stores/location';
import { useGameStore } from '@/stores/game';
import { useZoneStore } from '@/stores/zone';
import { isWithinRadius } from '@undead/shared';
import { api } from '@/services/api';

export function useSafeZone() {
  const position = useLocationStore((s) => s.position);
  const { isInSafeZone, currentZoneId, setInSafeZone } = useGameStore();
  const zones = useZoneStore((s) => s.zones);
  const fetchZones = useZoneStore((s) => s.fetchZones);
  const lastZoneRef = useRef<string | null>(null);

  // Fetch zones on mount + periodic refresh every 15s
  useEffect(() => {
    fetchZones();

    const interval = setInterval(() => {
      fetchZones();
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  // Check if player is in any zone
  useEffect(() => {
    if (!position || zones.length === 0) return;

    let foundZone: string | null = null;

    for (const zone of zones) {
      if (
        isWithinRadius(
          position,
          { latitude: zone.latitude, longitude: zone.longitude },
          zone.radius
        )
      ) {
        foundZone = zone.id;
        break;
      }
    }

    if (foundZone && !isInSafeZone) {
      // Entered a zone
      setInSafeZone(true, foundZone);
      lastZoneRef.current = foundZone;
      api.zones.enter(foundZone);
    } else if (!foundZone && isInSafeZone) {
      // Left the zone
      if (lastZoneRef.current) {
        api.zones.exit(lastZoneRef.current);
      }
      setInSafeZone(false, null);
      lastZoneRef.current = null;
    }
  }, [position, zones]);
}
