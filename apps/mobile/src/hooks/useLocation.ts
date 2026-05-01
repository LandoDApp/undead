import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { useLocationStore } from '@/stores/location';
import { api } from '@/services/api';
import {
  GPS_INTERVAL_STILL,
  GPS_INTERVAL_WALKING,
  GPS_INTERVAL_RUNNING,
  MOTION_THRESHOLD_STILL,
  MOTION_THRESHOLD_WALKING,
  MOTION_WINDOW_SIZE,
} from '@undead/shared';
import type { MotionState } from '@undead/shared';

export function useLocation() {
  // Individual selectors — only re-render when motionState changes, not on every position/displayPosition update
  const motionState = useLocationStore((s) => s.motionState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplesRef = useRef<number[]>([]);

  useEffect(() => {
    let accelSubscription: { remove: () => void } | null = null;

    // Grab stable action references once (never change)
    const { setPosition, setMotionState, setTracking } =
      useLocationStore.getState();

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      setTracking(true);

      // Start accelerometer for motion detection
      Accelerometer.setUpdateInterval(50); // 20Hz
      accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        samplesRef.current.push(magnitude);
        if (samplesRef.current.length > MOTION_WINDOW_SIZE) {
          samplesRef.current.shift();
        }

        if (samplesRef.current.length >= MOTION_WINDOW_SIZE) {
          const stdDev = calculateStdDev(samplesRef.current);
          let newState: MotionState;
          if (stdDev < MOTION_THRESHOLD_STILL) {
            newState = 'still';
          } else if (stdDev < MOTION_THRESHOLD_WALKING) {
            newState = 'walking';
          } else {
            newState = 'running';
          }
          setMotionState(newState);
        }
      });

      // Initial position fetch
      pollPosition();
    }

    start();

    return () => {
      accelSubscription?.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
      useLocationStore.getState().setTracking(false);
    };
  }, []);

  // Adjust polling interval based on motion state
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let interval: number;
    switch (motionState) {
      case 'running':
        interval = GPS_INTERVAL_RUNNING;
        break;
      case 'walking':
        interval = GPS_INTERVAL_WALKING;
        break;
      default:
        interval = GPS_INTERVAL_STILL;
    }

    intervalRef.current = setInterval(pollPosition, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [motionState]);
}

async function pollPosition() {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coord = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    useLocationStore.getState().setPosition(coord, location.coords.accuracy ?? 0);

    // Send to server
    api.player.updatePosition({
      latitude: coord.latitude,
      longitude: coord.longitude,
      accuracy: location.coords.accuracy ?? 0,
    });
  } catch {
    // GPS unavailable
  }
}

function calculateStdDev(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}
