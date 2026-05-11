import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';
import { useLocationStore } from '@/stores/location';
import { useChestStore } from '@/stores/chests';
import { useEquipmentStore } from '@/stores/equipment';
import { RESOURCE_SYNC_INTERVAL, CHEST_COLLECT_RADIUS, distanceMeters } from '@undead/shared';
import { api } from '@/services/api';

export function useChests() {
  const isGameActive = useGameStore((s) => s.isGameActive);
  const gameMode = useGameStore((s) => s.gameMode);
  const position = useLocationStore((s) => s.position);
  const fetchedRef = useRef(false);

  // Fetch keys on game start
  useEffect(() => {
    if (isGameActive) {
      useEquipmentStore.getState().fetchKeys();
    }
  }, [isGameActive]);

  // Reset fetch flag when mode changes
  useEffect(() => {
    fetchedRef.current = false;
  }, [gameMode]);

  // Initial fetch when Jagd starts and position available
  useEffect(() => {
    if (!isGameActive || !position || fetchedRef.current) return;
    if (gameMode !== 'jagd') return;
    fetchedRef.current = true;
    useChestStore.getState().fetchNearby(position.latitude, position.longitude, gameMode);
  }, [isGameActive, position, gameMode]);

  // Periodic sync (only in Jagd)
  useEffect(() => {
    if (!isGameActive || gameMode !== 'jagd') return;

    const interval = setInterval(() => {
      const pos = useLocationStore.getState().position;
      const mode = useGameStore.getState().gameMode;
      if (!pos || mode !== 'jagd') return;
      useChestStore.getState().fetchNearby(pos.latitude, pos.longitude, mode);
    }, RESOURCE_SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isGameActive, gameMode]);

  // Clear chests when leaving Jagd
  useEffect(() => {
    if (gameMode !== 'jagd') {
      useChestStore.getState().setChests([]);
    }
  }, [gameMode]);
}
