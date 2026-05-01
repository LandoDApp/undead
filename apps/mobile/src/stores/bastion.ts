import { create } from 'zustand';
import type { Bastion, BastionWorker, BastionStorage, ResourceBalance, WorkerType } from '@undead/shared';
import { api } from '@/services/api';
import { useResourceStore } from './resources';

interface BastionState {
  bastion: Bastion | null;
  nearbyBastions: Bastion[];
  workers: BastionWorker[];
  storage: BastionStorage | null;
  fetchBastion: () => Promise<void>;
  createBastion: (name: string, latitude: number, longitude: number) => Promise<boolean>;
  upgradeBastion: () => Promise<boolean>;
  healBastion: (amount: number) => Promise<boolean>;
  reinforceBastion: (bastionId: string) => Promise<boolean>;
  fetchNearby: (lat: number, lon: number) => Promise<void>;
  fetchIdleState: () => Promise<void>;
  collectStorage: () => Promise<boolean>;
  assignWorker: (workerType: WorkerType) => Promise<boolean>;
  removeWorker: (workerId: string) => Promise<boolean>;
  upgradeWorker: (workerId: string) => Promise<boolean>;
}

export const useBastionStore = create<BastionState>((set) => ({
  bastion: null,
  nearbyBastions: [],
  workers: [],
  storage: null,

  fetchBastion: async () => {
    const res = await api.bastion.get();
    if (res.success) {
      set({ bastion: res.data ?? null });
    }
  },

  createBastion: async (name, latitude, longitude) => {
    const res = await api.bastion.create({ name, latitude, longitude });
    if (res.success && res.data) {
      set({ bastion: res.data });
      return true;
    }
    return false;
  },

  upgradeBastion: async () => {
    const res = await api.bastion.upgrade();
    if (res.success && res.data) {
      set({ bastion: res.data.bastion });
      useResourceStore.getState().setBalance(res.data.newBalance);
      return true;
    }
    return false;
  },

  healBastion: async (amount) => {
    const res = await api.bastion.heal(amount);
    if (res.success && res.data) {
      set((s) => ({
        bastion: s.bastion ? { ...s.bastion, hp: res.data!.newHp } : null,
      }));
      useResourceStore.getState().setBalance(res.data.newBalance);
      return true;
    }
    return false;
  },

  reinforceBastion: async (bastionId) => {
    const res = await api.bastion.reinforce(bastionId);
    if (res.success && res.data) {
      set((s) => ({
        nearbyBastions: s.nearbyBastions.map((b) =>
          b.id === bastionId ? { ...b, hp: res.data!.newHp } : b
        ),
      }));
      return true;
    }
    return false;
  },

  fetchNearby: async (lat, lon) => {
    const res = await api.bastion.nearby(lat, lon);
    if (res.success && res.data) {
      set({ nearbyBastions: res.data.bastions });
    }
  },

  fetchIdleState: async () => {
    const res = await api.bastion.getIdleState();
    if (res.success && res.data) {
      set({ workers: res.data.workers, storage: res.data.storage });
    }
  },

  collectStorage: async () => {
    const res = await api.bastion.collect();
    if (res.success && res.data) {
      set({ storage: res.data.newStorage });
      useResourceStore.getState().setBalance(res.data.newBalance);
      return true;
    }
    return false;
  },

  assignWorker: async (workerType) => {
    const res = await api.bastion.assignWorker(workerType);
    if (res.success && res.data) {
      set((s) => ({ workers: [...s.workers, res.data!] }));
      return true;
    }
    return false;
  },

  removeWorker: async (workerId) => {
    const res = await api.bastion.removeWorker(workerId);
    if (res.success) {
      set((s) => ({ workers: s.workers.filter((w) => w.id !== workerId) }));
      return true;
    }
    return false;
  },

  upgradeWorker: async (workerId) => {
    const res = await api.bastion.upgradeWorker(workerId);
    if (res.success && res.data) {
      set((s) => ({
        workers: s.workers.map((w) => (w.id === workerId ? res.data!.worker : w)),
      }));
      useResourceStore.getState().setBalance(res.data.newBalance);
      return true;
    }
    return false;
  },
}));
