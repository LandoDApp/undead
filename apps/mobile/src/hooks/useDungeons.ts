import { useEffect } from 'react';
import { useGameStore } from '@/stores/game';
import { useDungeonStore } from '@/stores/dungeon';

export function useDungeons() {
  const isGameActive = useGameStore((s) => s.isGameActive);

  useEffect(() => {
    if (isGameActive) {
      useDungeonStore.getState().fetchDungeons();
    }
  }, [isGameActive]);
}
