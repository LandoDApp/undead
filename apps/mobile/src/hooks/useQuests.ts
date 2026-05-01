import { useEffect } from 'react';
import { useGameStore } from '@/stores/game';
import { useQuestStore } from '@/stores/quests';

export function useQuests() {
  const isGameActive = useGameStore((s) => s.isGameActive);

  // Fetch quests when game starts
  useEffect(() => {
    if (isGameActive) {
      useQuestStore.getState().fetchQuests();
    }
  }, [isGameActive]);

  // Periodic refresh every 60s
  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(() => {
      if (useGameStore.getState().isGameActive) {
        useQuestStore.getState().fetchQuests();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [isGameActive]);
}
