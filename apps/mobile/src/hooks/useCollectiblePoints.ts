import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { usePointsStore } from '@/stores/points';
import { POINT_SYNC_INTERVAL, POINT_COLLECT_RADIUS, distanceMeters } from '@undead/shared';

export function useCollectiblePoints() {
  const isGameActive = useGameStore((s) => s.isGameActive);
  const position = useLocationStore((s) => s.position);
  const fetchedRef = useRef(false);

  // Fetch balance on game start
  useEffect(() => {
    if (isGameActive) {
      usePointsStore.getState().fetchBalance();
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
    usePointsStore.getState().fetchNearby(position.latitude, position.longitude);
  }, [isGameActive, position]);

  // Periodic sync
  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(() => {
      const pos = useLocationStore.getState().position;
      const active = useGameStore.getState().isGameActive;
      if (!active || !pos) return;
      usePointsStore.getState().fetchNearby(pos.latitude, pos.longitude);
    }, POINT_SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isGameActive]);

  // Auto-collect on proximity
  useEffect(() => {
    if (!isGameActive || !position) return;

    const points = usePointsStore.getState().collectiblePoints;
    for (const point of points) {
      const dist = distanceMeters(position, {
        latitude: point.latitude,
        longitude: point.longitude,
      });
      if (dist <= POINT_COLLECT_RADIUS) {
        usePointsStore
          .getState()
          .collectPoint(point.id, position.latitude, position.longitude);
      }
    }
  }, [isGameActive, position]);
}
