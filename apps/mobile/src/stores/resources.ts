import { create } from 'zustand';
import type { Resource, ResourceBalance } from '@undead/shared';
import { api } from '@/services/api';

interface ResourcesState {
  resources: Resource[];
  balance: ResourceBalance;
  setResources: (resources: Resource[]) => void;
  fetchNearby: (lat: number, lon: number) => Promise<void>;
  collectResource: (resourceId: string, playerLat: number, playerLon: number) => Promise<boolean>;
  fetchBalance: () => Promise<void>;
  setBalance: (balance: ResourceBalance) => void;
}

const emptyBalance: ResourceBalance = {
  herbs: 0,
  crystals: 0,
  relics: 0,
  lifetimeHerbs: 0,
  lifetimeCrystals: 0,
  lifetimeRelics: 0,
};

export const useResourceStore = create<ResourcesState>((set) => ({
  resources: [],
  balance: emptyBalance,

  setResources: (resources) => set({ resources }),

  fetchNearby: async (lat, lon) => {
    const res = await api.resources.nearby(lat, lon);
    if (res.success && res.data) {
      set({ resources: res.data.resources });
    }
  },

  collectResource: async (resourceId, playerLat, playerLon) => {
    const res = await api.resources.collect(resourceId, playerLat, playerLon);
    if (res.success && res.data?.collected) {
      set((s) => ({
        resources: s.resources.filter((r) => r.id !== resourceId),
        balance: res.data!.newBalance,
      }));
      return true;
    }
    return false;
  },

  fetchBalance: async () => {
    const res = await api.resources.getBalance();
    if (res.success && res.data) {
      set({ balance: res.data });
    }
  },

  setBalance: (balance) => set({ balance }),
}));
