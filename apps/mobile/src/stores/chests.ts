import { create } from 'zustand';
import type { Chest } from '@undead/shared';
import { api } from '@/services/api';

interface ChestState {
  chests: Chest[];
  setChests: (chests: Chest[]) => void;
  removeChest: (id: string) => void;
  fetchNearby: (lat: number, lon: number, gameMode?: string) => Promise<void>;
}

export const useChestStore = create<ChestState>((set) => ({
  chests: [],

  setChests: (chests) => set({ chests }),

  removeChest: (id) =>
    set((s) => ({ chests: s.chests.filter((c) => c.id !== id) })),

  fetchNearby: async (lat, lon, gameMode?) => {
    const res = await api.chests.nearby(lat, lon, gameMode);
    if (res.success && res.data) {
      set({ chests: res.data.chests });
    }
  },
}));
