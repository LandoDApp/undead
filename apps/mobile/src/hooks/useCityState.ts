import { useEffect, useRef } from 'react';
import { useLocationStore } from '@/stores/location';
import { useGameStore } from '@/stores/game';
import { useCityStateStore } from '@/stores/zone';
import { isWithinRadius } from '@undead/shared';
import { api } from '@/services/api';

export function useCityState() {
  const position = useLocationStore((s) => s.position);
  const { isInCityState, currentZoneId, setInCityState } = useGameStore();
  const cityStates = useCityStateStore((s) => s.cityStates);
  const fetchCityStates = useCityStateStore((s) => s.fetchCityStates);
  const lastZoneRef = useRef<string | null>(null);

  // Fetch city-states on mount + periodic refresh every 15s
  useEffect(() => {
    fetchCityStates();

    const interval = setInterval(() => {
      fetchCityStates();
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  // Check if player is in any city-state
  useEffect(() => {
    if (!position || cityStates.length === 0) return;

    let foundZone: string | null = null;

    for (const zone of cityStates) {
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

    if (foundZone && !isInCityState) {
      // Entered a city-state
      setInCityState(true, foundZone);
      lastZoneRef.current = foundZone;
      api.cityStates.enter(foundZone);
    } else if (!foundZone && isInCityState) {
      // Left the city-state
      if (lastZoneRef.current) {
        api.cityStates.exit(lastZoneRef.current);
      }
      setInCityState(false, null);
      lastZoneRef.current = null;
    }
  }, [position, cityStates]);
}
