import { useEffect } from 'react';
import { useGameStore } from '@/stores/game';
import { getTimeOfDay } from '@undead/shared';

export function useDayNight() {
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);

  useEffect(() => {
    // Check immediately
    setTimeOfDay(getTimeOfDay());

    // Re-check every minute
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);
}
