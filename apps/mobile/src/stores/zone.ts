import { create } from 'zustand';
import type { CityState } from '@undead/shared';
import { api } from '@/services/api';

interface CityStateStoreState {
  cityStates: CityState[];
  isLoading: boolean;
  fetchCityStates: () => Promise<void>;
}

export const useCityStateStore = create<CityStateStoreState>((set) => ({
  cityStates: [],
  isLoading: false,

  fetchCityStates: async () => {
    set({ isLoading: true });
    try {
      const res = await api.cityStates.getAll();
      if (res.success && res.data) {
        set({ cityStates: res.data as CityState[] });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
