import { create } from 'zustand';
import type { Coordinate, MotionState } from '@undead/shared';

interface LocationState {
  position: Coordinate | null;
  accuracy: number | null;
  motionState: MotionState;
  isTracking: boolean;
  lastUpdate: number;
  setPosition: (coord: Coordinate, accuracy: number) => void;
  setMotionState: (state: MotionState) => void;
  setTracking: (tracking: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  position: null,
  accuracy: null,
  motionState: 'still',
  isTracking: false,
  lastUpdate: 0,

  setPosition: (coord, accuracy) =>
    set({ position: coord, accuracy, lastUpdate: Date.now() }),

  setMotionState: (motionState) => set({ motionState }),

  setTracking: (isTracking) => set({ isTracking }),
}));
