import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useResourceStore } from '@/stores/resources';
import { RESOURCE_SYNC_INTERVAL, RESOURCE_COLLECT_RADIUS, distanceMeters } from '@undead/shared';

export function useResources() {
  const isGameActive = useGameStore((s) => s.isGameActive);
  const position = useLocationStore((s) => s.position);
  const fetchedRef = useRef(false);
  const collectingRef = useRef(new Set<string>());

  // Fetch balance on game start
  useEffect(() => {
    if (isGameActive) {
      useResourceStore.getState().fetchBalance();
    }
  }, [isGameActive]);

  // Reset fetch flag when game stops
  useEffect(() => {
    if (!isGameActive) {
      fetchedRef.current = false;
    }
  }, [isGameActive]);

  // Initial fetch when game starts and position available
  useEffect(() => {
    if (!isGameActive || !position || fetchedRef.current) return;
    fetchedRef.current = true;
    const mode = useGameStore.getState().gameMode;
    useResourceStore.getState().fetchNearby(position.latitude, position.longitude, mode);
  }, [isGameActive, position]);

  // Periodic sync
  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(() => {
      const pos = useLocationStore.getState().position;
      const active = useGameStore.getState().isGameActive;
      if (!active || !pos) return;
      const mode = useGameStore.getState().gameMode;
      useResourceStore.getState().fetchNearby(pos.latitude, pos.longitude, mode);
    }, RESOURCE_SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isGameActive]);

  // Auto-collect on proximity
  useEffect(() => {
    if (!isGameActive || !position) return;

    const resources = useResourceStore.getState().resources;
    for (const resource of resources) {
      if (collectingRef.current.has(resource.id)) continue;

      const dist = distanceMeters(position, {
        latitude: resource.latitude,
        longitude: resource.longitude,
      });
      if (dist <= RESOURCE_COLLECT_RADIUS) {
        collectingRef.current.add(resource.id);
        useResourceStore
          .getState()
          .collectResource(resource.id, position.latitude, position.longitude)
          .finally(() => {
            collectingRef.current.delete(resource.id);
          });
      }
    }
  }, [isGameActive, position]);
}
