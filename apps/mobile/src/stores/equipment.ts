import { create } from 'zustand';
import type { LootItem, PlayerEquipment, EquipSlot } from '@undead/shared';
import { api } from '@/services/api';

interface EquipmentState {
  items: LootItem[];
  equipment: PlayerEquipment;
  keys: number;
  fetchItems: () => Promise<void>;
  fetchKeys: () => Promise<void>;
  equipItem: (itemId: string) => Promise<void>;
  unequipItem: (slot: EquipSlot) => Promise<void>;
  setKeys: (keys: number) => void;
  addItem: (item: LootItem) => void;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  items: [],
  equipment: { weapon: null, armor: null, amulet: null },
  keys: 0,

  fetchItems: async () => {
    const res = await api.equipment.getAll();
    if (res.success && res.data) {
      set({ items: res.data.items, equipment: res.data.equipment });
    }
  },

  fetchKeys: async () => {
    const res = await api.keys.get();
    if (res.success && res.data) {
      set({ keys: res.data.keys });
    }
  },

  equipItem: async (itemId) => {
    const res = await api.equipment.equip(itemId);
    if (res.success && res.data) {
      set({ equipment: res.data.equipment });
      // Refresh items to update isEquipped flags
      const allRes = await api.equipment.getAll();
      if (allRes.success && allRes.data) {
        set({ items: allRes.data.items });
      }
    }
  },

  unequipItem: async (slot) => {
    const res = await api.equipment.unequip(slot);
    if (res.success && res.data) {
      set({ equipment: res.data.equipment });
      const allRes = await api.equipment.getAll();
      if (allRes.success && allRes.data) {
        set({ items: allRes.data.items });
      }
    }
  },

  setKeys: (keys) => set({ keys }),

  addItem: (item) =>
    set((s) => ({ items: [...s.items, item] })),
}));
