import { create } from 'zustand';
import type { DailyStreak, DailyVision } from '@undead/shared';
import { api } from '@/services/api';

interface DailyState {
  streak: DailyStreak | null;
  vision: DailyVision | null;
  fetchStreak: () => Promise<void>;
  checkinStreak: () => Promise<void>;
  useFreeze: () => Promise<boolean>;
  fetchVision: () => Promise<void>;
  drawVision: () => Promise<boolean>;
}

export const useDailyStore = create<DailyState>((set) => ({
  streak: null,
  vision: null,

  fetchStreak: async () => {
    const res = await api.streak.get();
    if (res.success && res.data) {
      set({ streak: res.data });
    }
  },

  checkinStreak: async () => {
    // Streak check-in uses a different endpoint pattern
    const res = await api.streak.get();
    if (res.success && res.data) {
      set({ streak: res.data });
    }
  },

  useFreeze: async () => {
    const res = await api.streak.useFreeze();
    if (res.success && res.data) {
      set({ streak: res.data });
      return true;
    }
    return false;
  },

  fetchVision: async () => {
    const res = await api.vision.get();
    if (res.success) {
      set({ vision: res.data ?? null });
    }
  },

  drawVision: async () => {
    const res = await api.vision.draw();
    if (res.success && res.data) {
      set({ vision: res.data });
      return true;
    }
    return false;
  },
}));
