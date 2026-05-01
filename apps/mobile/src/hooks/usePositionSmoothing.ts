import { useEffect, useRef } from 'react';
import { interpolateCoord, distanceMeters } from '@undead/shared';
import type { Coordinate } from '@undead/shared';
import { useLocationStore } from '@/stores/location';

const ANIMATION_DURATION = 500; // ms
const TELEPORT_THRESHOLD = 50; // meters — skip animation for large jumps
const FRAME_INTERVAL = 50; // ms — ~20fps to limit store updates

/** Ease-out cubic: decelerating to zero velocity */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Smoothly interpolates displayPosition between raw GPS updates.
 * Call once in the game screen — writes to useLocationStore.displayPosition.
 */
export function usePositionSmoothing() {
  const rafRef = useRef<number | null>(null);
  const prevPositionRef = useRef<Coordinate | null>(
    useLocationStore.getState().position
  );
  const lastPositionRef = useRef<Coordinate | null>(null);

  useEffect(() => {
    const unsubscribe = useLocationStore.subscribe((state) => {
      const newPos = state.position;
      if (!newPos) return;

      // Only react to actual position changes (ignore displayPosition updates)
      if (
        lastPositionRef.current &&
        lastPositionRef.current.latitude === newPos.latitude &&
        lastPositionRef.current.longitude === newPos.longitude
      ) {
        return;
      }

      const from = prevPositionRef.current;
      prevPositionRef.current = newPos;
      lastPositionRef.current = newPos;

      // First position or teleport — snap immediately
      if (!from || distanceMeters(from, newPos) > TELEPORT_THRESHOLD) {
        useLocationStore.getState().setDisplayPosition(newPos);
        return;
      }

      // Cancel any running animation
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }

      const start = performance.now();
      let lastFrame = 0;

      function animate(now: number) {
        // Throttle to ~20fps to reduce store update overhead
        if (now - lastFrame < FRAME_INTERVAL) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }
        lastFrame = now;

        const elapsed = now - start;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const eased = easeOutCubic(progress);

        const interpolated = interpolateCoord(from!, newPos!, eased);
        useLocationStore.getState().setDisplayPosition(interpolated);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          rafRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    });

    return () => {
      unsubscribe();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}
