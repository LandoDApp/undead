import { create } from 'zustand';
import type { Dungeon, LootItem } from '@undead/shared';
import { api } from '@/services/api';
import { useEquipmentStore } from './equipment';
import { useLocationStore } from './location';

interface DungeonState {
  dungeons: Dungeon[];
  // Active combat state
  inCombat: boolean;
  currentDungeonId: string | null;
  wave: number;
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  playerDps: number;
  playerTapDamage: number;
  enemyDps: number;
  highestWave: number;
  lastReward: LootItem | null;
  ejected: boolean;
  // Actions
  fetchDungeons: () => Promise<void>;
  enterDungeon: (dungeonId: string) => Promise<boolean>;
  tap: () => Promise<void>;
  tick: () => Promise<void>;
  exitCombat: () => void;
  clearReward: () => void;
}

export const useDungeonStore = create<DungeonState>((set, get) => ({
  dungeons: [],
  inCombat: false,
  currentDungeonId: null,
  wave: 0,
  enemyHp: 0,
  enemyMaxHp: 0,
  playerHp: 0,
  playerMaxHp: 0,
  playerDps: 0,
  playerTapDamage: 0,
  enemyDps: 0,
  highestWave: 0,
  lastReward: null,
  ejected: false,

  fetchDungeons: async () => {
    const res = await api.dungeons.getAll();
    if (res.success && res.data) {
      set({ dungeons: res.data.dungeons });
    }
  },

  enterDungeon: async (dungeonId) => {
    const pos = useLocationStore.getState().position;
    const res = await api.dungeons.enter(dungeonId, pos?.latitude, pos?.longitude);
    if (res.success && res.data?.allowed) {
      const d = res.data;
      set({
        inCombat: true,
        currentDungeonId: dungeonId,
        wave: d.currentWave,
        enemyHp: d.enemyHp,
        enemyMaxHp: d.enemyMaxHp,
        playerHp: d.playerMaxHp,
        playerMaxHp: d.playerMaxHp,
        playerDps: d.playerDps,
        playerTapDamage: d.playerTapDamage,
        enemyDps: d.enemyDps,
        highestWave: 0,
        lastReward: null,
        ejected: false,
      });
      return true;
    }
    return false;
  },

  tap: async () => {
    const { currentDungeonId } = get();
    if (!currentDungeonId) return;
    const res = await api.dungeons.tap(currentDungeonId);
    if (res.success && res.data) {
      const d = res.data;
      if (d.reward) {
        useEquipmentStore.getState().addItem(d.reward);
      }
      set({
        enemyHp: d.enemyHp,
        playerHp: d.playerHp,
        highestWave: d.highestWave,
        ejected: d.ejected,
        ...(d.waveCleared && d.nextWave ? { wave: d.nextWave, enemyMaxHp: d.enemyHp || get().enemyMaxHp } : {}),
        ...(d.reward ? { lastReward: d.reward } : {}),
        ...(d.ejected ? { inCombat: false } : {}),
      });
    }
  },

  tick: async () => {
    const { currentDungeonId, ejected } = get();
    if (!currentDungeonId || ejected) return;
    const res = await api.dungeons.tick(currentDungeonId);
    if (res.success && res.data) {
      const d = res.data;
      const updates: Partial<DungeonState> = {
        enemyHp: d.enemyHp,
        playerHp: d.playerHp,
        highestWave: d.highestWave,
        ejected: d.ejected,
      };
      if (d.waveCleared && d.nextWave) {
        // Enemy HP was reset on server for new wave
        updates.wave = d.nextWave;
        // enemyMaxHp needs recalculating — the server sent the new enemy's full HP
        // Since it just spawned, enemyHp IS the max
        updates.enemyMaxHp = d.enemyHp;
      }
      if (d.reward) {
        updates.lastReward = d.reward;
        useEquipmentStore.getState().addItem(d.reward);
      }
      if (d.ejected) {
        updates.inCombat = false;
      }
      set(updates as any);
    }
  },

  exitCombat: () => {
    const { currentDungeonId } = get();
    if (currentDungeonId) {
      api.dungeons.exit(currentDungeonId).catch(() => {});
    }
    set({
      inCombat: false,
      currentDungeonId: null,
      wave: 0,
      enemyHp: 0,
      enemyMaxHp: 0,
      playerHp: 0,
      playerMaxHp: 0,
      ejected: false,
      lastReward: null,
    });
  },

  clearReward: () => set({ lastReward: null }),
}));
