import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game';
import { api } from '@/services/api';

// Expo Pedometer from expo-sensors
let Pedometer: any = null;
try {
  Pedometer = require('expo-sensors').Pedometer;
} catch {
  // Pedometer not available
}

const REPORT_INTERVAL = 60_000; // report steps every 60s

export function usePedometer() {
  const gameMode = useGameStore((s) => s.gameMode);
  const isGameActive = useGameStore((s) => s.isGameActive);
  const stepsRef = useRef(0);
  const lastReportRef = useRef(0);

  useEffect(() => {
    if (!isGameActive || gameMode !== 'wandel' || !Pedometer) return;

    let subscription: any = null;

    const startWatching = async () => {
      const available = await Pedometer.isAvailableAsync?.();
      if (!available) return;

      const start = new Date();
      subscription = Pedometer.watchStepCount?.((result: { steps: number }) => {
        stepsRef.current = result.steps;
      });
    };

    startWatching();

    // Periodic reporting
    const interval = setInterval(() => {
      const steps = stepsRef.current - lastReportRef.current;
      if (steps > 0) {
        lastReportRef.current = stepsRef.current;
        api.steps.report(steps).catch(() => {});
      }
    }, REPORT_INTERVAL);

    return () => {
      subscription?.remove?.();
      clearInterval(interval);

      // Final report
      const steps = stepsRef.current - lastReportRef.current;
      if (steps > 0) {
        api.steps.report(steps).catch(() => {});
      }
    };
  }, [isGameActive, gameMode]);
}
