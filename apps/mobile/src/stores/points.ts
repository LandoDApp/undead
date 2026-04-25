import { create } from 'zustand';
import type { CollectiblePoint, PlayerPointsBalance } from '@undead/shared';
import { api } from '@/services/api';

interface PointsState {
  collectiblePoints: CollectiblePoint[];
  balance: PlayerPointsBalance;
  setCollectiblePoints: (points: CollectiblePoint[]) => void;
  fetchNearby: (lat: number, lon: number) => Promise<void>;
  collectPoint: (pointId: string, playerLat: number, playerLon: number) => Promise<boolean>;
  fetchBalance: () => Promise<void>;
  setBalance: (balance: PlayerPointsBalance) => void;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  collectiblePoints: [],
  balance: { totalPoints: 0, lifetimeEarned: 0, lifetimeSpent: 0 },

  setCollectiblePoints: (points) => set({ collectiblePoints: points }),

  fetchNearby: async (lat, lon) => {
    const res = await api.points.nearby(lat, lon);
    if (res.success && res.data) {
      set({ collectiblePoints: res.data.points });
    }
  },

  collectPoint: async (pointId, playerLat, playerLon) => {
    const res = await api.points.collect(pointId, playerLat, playerLon);
    if (res.success && res.data?.collected) {
      // Remove collected point from local state
      set((s) => ({
        collectiblePoints: s.collectiblePoints.filter((p) => p.id !== pointId),
        balance: {
          ...s.balance,
          totalPoints: res.data!.newBalance,
          lifetimeEarned: s.balance.lifetimeEarned + res.data!.pointsEarned,
        },
      }));
      return true;
    }
    return false;
  },

  fetchBalance: async () => {
    const res = await api.points.getBalance();
    if (res.success && res.data) {
      set({ balance: res.data });
    }
  },

  setBalance: (balance) => set({ balance }),
}));
