import { create } from 'zustand';
import type { SafeZone } from '@undead/shared';
import { api } from '@/services/api';

interface ZoneState {
  zones: SafeZone[];
  isLoading: boolean;
  fetchZones: () => Promise<void>;
}

export const useZoneStore = create<ZoneState>((set) => ({
  zones: [],
  isLoading: false,

  fetchZones: async () => {
    set({ isLoading: true });
    try {
      const res = await api.zones.getAll();
      if (res.success && res.data) {
        set({ zones: res.data as SafeZone[] });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
