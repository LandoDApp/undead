import { useEffect } from 'react';
import { useGameStore } from '@/stores/game';
import { useBastionStore } from '@/stores/bastion';

export function useBastion() {
  const isGameActive = useGameStore((s) => s.isGameActive);

  // Fetch own bastion on game start
  useEffect(() => {
    if (isGameActive) {
      useBastionStore.getState().fetchBastion();
    }
  }, [isGameActive]);
}
