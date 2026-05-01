import { create } from 'zustand';
import type { Quest } from '@undead/shared';
import { api } from '@/services/api';
import { useResourceStore } from './resources';

interface QuestState {
  daily: Quest[];
  weekly: Quest[];
  season: Quest[];
  fetchQuests: () => Promise<void>;
  claimReward: (questId: string) => Promise<boolean>;
}

export const useQuestStore = create<QuestState>((set) => ({
  daily: [],
  weekly: [],
  season: [],

  fetchQuests: async () => {
    const res = await api.quests.getAll();
    if (res.success && res.data) {
      set({
        daily: res.data.daily,
        weekly: res.data.weekly,
        season: res.data.season,
      });
    }
  },

  claimReward: async (questId) => {
    const res = await api.quests.claim(questId);
    if (res.success && res.data) {
      // Update the quest in our lists
      const updateList = (quests: Quest[]) =>
        quests.map((q) => (q.id === questId ? res.data!.quest : q));

      set((s) => ({
        daily: updateList(s.daily),
        weekly: updateList(s.weekly),
        season: updateList(s.season),
      }));
      useResourceStore.getState().setBalance(res.data.newBalance);
      return true;
    }
    return false;
  },
}));
