import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Quest } from '@undead/shared';
import { api } from '@/services/api';
import { useResourceStore } from './resources';

const FOCUSED_QUEST_KEY = 'focused_quest_id';

interface QuestState {
  daily: Quest[];
  weekly: Quest[];
  season: Quest[];
  focusedQuestId: string | null;
  fetchQuests: () => Promise<void>;
  claimReward: (questId: string) => Promise<boolean>;
  setFocusedQuest: (questId: string | null) => void;
  loadFocusedQuest: () => Promise<void>;
}

export const useQuestStore = create<QuestState>((set) => ({
  daily: [],
  weekly: [],
  season: [],
  focusedQuestId: null,

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

  setFocusedQuest: (questId) => {
    set({ focusedQuestId: questId });
    if (questId) {
      AsyncStorage.setItem(FOCUSED_QUEST_KEY, questId).catch(() => {});
    } else {
      AsyncStorage.removeItem(FOCUSED_QUEST_KEY).catch(() => {});
    }
  },

  loadFocusedQuest: async () => {
    try {
      const id = await AsyncStorage.getItem(FOCUSED_QUEST_KEY);
      if (id) set({ focusedQuestId: id });
    } catch {
      // ignore
    }
  },
}));
