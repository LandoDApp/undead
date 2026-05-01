import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useBastionStore } from '@/stores/bastion';
import { BASTION_SYNC_INTERVAL } from '@undead/shared';

export function useBastion() {
  const isGameActive = useGameStore((s) => s.isGameActive);
  const position = useLocationStore((s) => s.position);
  const fetchedRef = useRef(false);

  // Fetch own bastion on game start
  useEffect(() => {
    if (isGameActive) {
      useBastionStore.getState().fetchBastion();
    }
  }, [isGameActive]);

  // Reset fetch flag when game stops
  useEffect(() => {
    if (!isGameActive) {
      fetchedRef.current = false;
    }
  }, [isGameActive]);

  // Initial nearby fetch when position available
  useEffect(() => {
    if (!isGameActive || !position || fetchedRef.current) return;
    fetchedRef.current = true;
    useBastionStore.getState().fetchNearby(position.latitude, position.longitude);
  }, [isGameActive, position]);

  // Periodic sync for nearby bastions
  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(() => {
      const pos = useLocationStore.getState().position;
      const active = useGameStore.getState().isGameActive;
      if (!active || !pos) return;
      useBastionStore.getState().fetchNearby(pos.latitude, pos.longitude);
    }, BASTION_SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isGameActive]);
}
